/* -----------------------------------------------------------------------------
 *  Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, version 3.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.  
 *
 *  No Patent Rights, Trademark Rights and/or other Intellectual Property
 *  Rights other than the rights under this license are granted.
 *  All other rights reserved.
 *
 *  For any other rights, a separate agreement needs to be closed.
 *
 *  For more information please contact:  
 *  Fraunhofer FOKUS
 *  Kaiserin-Augusta-Allee 31
 *  10589 Berlin, Germany
 *  https://www.fokus.fraunhofer.de/go/fame
 *  famecontact@fokus.fraunhofer.de
 * -----------------------------------------------------------------------------
 */
import { CONFIG } from '../config/config'
import GroupDAO from '../models/Group/GroupDAO'
import GroupModel from '../models/Group/GroupModel'
import RelationModel from '../models/Relation/RelationModel'
import RelationBDTO from '../models/Relation/RelationBDTO'
import RoleDAO from '../models/Role/RoleDAO'
import { Logger } from '../lib/utils/logger'

const logger = new Logger({ name: 'OIDCGroupSyncService', level: (process.env.LOG_LEVEL as any) || 'info' })

// Marker for group-user relations this service itself created. The reconciliation loop in
// syncGroupsAndMembershipsFromClaims() below only ever REMOVES relations carrying this marker --
// memberships created by anything else (course provisioning, admin actions, other sync plugins)
// are never touched, without those writers needing to do anything special to "protect" themselves.
const OIDC_MANAGED_RELATION_TYPE = 'oidc-managed'

type InternalRole = 'Learner' | 'Instructor' | 'OrgAdmin'

type GroupSyncContext = {
    groupsByDisplayName: Map<string, GroupModel[]>
    groupRoleRelationByGroupId: Map<string, string>
    roleByName: Map<InternalRole, string>
}

function readGroupPattern(): RegExp | undefined {
    const pattern = process.env.OIDC_ALLOWED_GROUP_PATTERN?.trim()
    if (!pattern) return undefined
    try {
        return new RegExp(pattern)
    } catch (err) {
        logger.warn('Invalid OIDC_ALLOWED_GROUP_PATTERN; ignoring:', err)
        return undefined
    }
}

const allowedGroupPattern = readGroupPattern()

function normalizeGroupToken(raw: string): string {
    return (raw || '').replace(/\s*_\s*/g, CONFIG.OIDC_GROUP_ROLE_DELIMITER).replace(/\s+/g, ' ').trim()
}

function parseGroupEntry(entry: string): { base: string, suffix: string | null } {
    const cleaned = normalizeGroupToken(entry)
    if (!cleaned) return { base: '', suffix: null }
    const delim = CONFIG.OIDC_GROUP_ROLE_DELIMITER
    const lastIdx = cleaned.lastIndexOf(delim)
    if (lastIdx < 0) return { base: cleaned, suffix: null }
    const base = cleaned.substring(0, lastIdx)
    const rawSuffix = cleaned.substring(lastIdx + delim.length)
    return { base: base || cleaned, suffix: rawSuffix || null }
}

function suffixToInternalRole(suffix: string | null): InternalRole {
    const s = (suffix || '').trim().toLowerCase()
    const sufLearner = CONFIG.OIDC_GROUP_SUFFIX_LEARNER.toLowerCase()
    const sufInstructor = CONFIG.OIDC_GROUP_SUFFIX_INSTRUCTOR.toLowerCase()
    const sufAdmin = CONFIG.OIDC_GROUP_SUFFIX_ADMIN.toLowerCase()
    if (s === sufInstructor) return (CONFIG.OIDC_ROLEMAP_INSTRUCTOR as 'Instructor')
    if (s === sufAdmin) return (CONFIG.OIDC_ROLEMAP_ADMIN as 'OrgAdmin')
    if (s === sufLearner || !s) return (CONFIG.OIDC_ROLEMAP_LEARNER as 'Learner')
    return (CONFIG.OIDC_ROLEMAP_LEARNER as 'Learner')
}

async function buildGroupSyncContext(): Promise<GroupSyncContext> {
    const [groups, relations, learnerRole, instructorRole, adminRole] = await Promise.all([
        GroupDAO.findAll(),
        RelationBDTO.findAll(),
        RoleDAO.findByRoleName('Learner'),
        RoleDAO.findByRoleName('Instructor'),
        RoleDAO.findByRoleName('OrgAdmin')
    ])

    const groupsByDisplayName = new Map<string, GroupModel[]>()
    for (const group of groups) {
        const existing = groupsByDisplayName.get(group.displayName) || []
        existing.push(group)
        groupsByDisplayName.set(group.displayName, existing)
    }

    const groupRoleRelationByGroupId = new Map<string, string>()
    for (const relation of relations) {
        if (relation.fromType === 'group' && relation.toType === 'role') {
            groupRoleRelationByGroupId.set(relation.fromId, relation.toId)
        }
    }

    return {
        groupsByDisplayName,
        groupRoleRelationByGroupId,
        roleByName: new Map<InternalRole, string>([
            ['Learner', learnerRole._id],
            ['Instructor', instructorRole._id],
            ['OrgAdmin', adminRole._id]
        ])
    }
}

async function findGroupWithRole(displayName: string, roleName: InternalRole, context: GroupSyncContext) {
    const roleId = context.roleByName.get(roleName)
    if (!roleId) return undefined

    const groups = context.groupsByDisplayName.get(displayName) || []
    for (const group of groups) {
        if (context.groupRoleRelationByGroupId.get(group._id) === roleId) return group
    }
    return undefined
}

async function ensureGroupWithRole(displayName: string, roleName: InternalRole, context: GroupSyncContext) {
    const existing = await findGroupWithRole(displayName, roleName, context)
    if (existing) return existing
    if (!CONFIG.OIDC_AUTO_CREATE_GROUPS) return undefined
    // Defensive: refuse to auto-create new OrgAdmin groups unless the operator
    // explicitly opted in via OIDC_ALLOW_ADMIN_GROUP_SYNC=true. Pre-existing
    // OrgAdmin groups are still matched/used via the early-return above.
    if (roleName === 'OrgAdmin' && !CONFIG.OIDC_ALLOW_ADMIN_GROUP_SYNC) return undefined

    const role = await RoleDAO.findByRoleName(roleName)
    const createdGroup = await GroupDAO.insert(new GroupModel({ displayName }), { role: role._id })
    context.groupsByDisplayName.set(displayName, [...(context.groupsByDisplayName.get(displayName) || []), createdGroup])
    context.groupRoleRelationByGroupId.set(createdGroup._id, role._id)
    context.roleByName.set(roleName, role._id)
    return createdGroup
}

async function ensureHierarchy(groupsByRole: Partial<Record<InternalRole, GroupModel>>) {
    const admin = groupsByRole['OrgAdmin']
    const instructor = groupsByRole['Instructor']
    const learner = groupsByRole['Learner']

    if (admin && instructor) {
        try { await RelationBDTO.addGroupToGroup(admin._id, instructor._id) } catch (_) { /* ignore */ }
    } else if (admin && learner) {
        try { await RelationBDTO.addGroupToGroup(admin._id, learner._id) } catch (_) { /* ignore */ }
    }
    if (instructor && learner) {
        try { await RelationBDTO.addGroupToGroup(instructor._id, learner._id) } catch (_) { /* ignore */ }
    }
}

function isAllowedGroupName(raw: string): boolean {
    if (raw.length > 128) return false
    if (!allowedGroupPattern) return true
    return allowedGroupPattern.test(raw)
}

/**
 * Normalize the raw groups claim value into an array of group strings.
 * Supports two formats configurable via OIDC_GROUPS_FORMAT:
 *   - "comma" (default): plain comma-separated string
 *   - "json_array": stringified JSON array (handles both single- and double-quoted variants)
 */
function normalizeGroupsClaim(groupsRaw: string): string[] {
    const format = CONFIG.OIDC_GROUPS_FORMAT
    if (format === 'json_array') {
        try {
            let sanitized = (groupsRaw || '').trim()
            if (!sanitized) return []
            // Some IdPs send single-quoted arrays like "['a','b']" — normalize to valid JSON
            if (sanitized.startsWith('[') && sanitized.includes("'")) {
                sanitized = sanitized.replace(/'/g, '"')
            }
            const parsed = JSON.parse(sanitized)
            if (Array.isArray(parsed)) {
                return parsed.map((item: any) => String(item).trim()).filter(Boolean)
            }
        } catch (e) {
            console.warn('[OIDC] Failed to parse groups claim as JSON array; falling back to comma-separated:', e)
        }
    }
    // Default: comma-separated string
    return (groupsRaw || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

export async function syncGroupsAndMembershipsFromClaims(userId: string, groupsRaw: string) {
    logger.debug(`Group sync for user ${userId} (format=${CONFIG.OIDC_GROUPS_FORMAT}, delimiter=${CONFIG.OIDC_GROUP_ROLE_DELIMITER}, autoCreate=${CONFIG.OIDC_AUTO_CREATE_GROUPS}, allowAdminSync=${CONFIG.OIDC_ALLOW_ADMIN_GROUP_SYNC})`)
    const context = await buildGroupSyncContext()
    const items = normalizeGroupsClaim(groupsRaw)
        .slice(0, CONFIG.OIDC_GROUP_SYNC_MAX_ITEMS)
    logger.debug('Parsed group claim items:', items)

    const baseToRoleName = new Map<string, Map<InternalRole, string>>()
    for (const raw of items) {
        if (!isAllowedGroupName(raw)) continue

        const { base, suffix } = parseGroupEntry(raw)
        if (!base) continue

        const internalRole = suffixToInternalRole(suffix)
        // Historical behaviour skipped ALL OrgAdmin claim entries whenever
        // OIDC_ALLOW_ADMIN_GROUP_SYNC was false. That wiped out the legitimate
        // use-case of pre-existing, hand-provisioned Admin/OrgAdmin groups
        // (e.g. customer-side "X_Admin" groups mapped to OrgAdmin). Worse: it
        // did so silently, so users never got into groups the customer had
        // explicitly created.
        //
        // New behaviour:
        //   - If OIDC_ALLOW_ADMIN_GROUP_SYNC=true, Admin entries are accepted
        //     unconditionally (and may even be auto-created depending on
        //     OIDC_AUTO_CREATE_GROUPS).
        //   - If OIDC_ALLOW_ADMIN_GROUP_SYNC=false, Admin entries are accepted
        //     too, BUT the later ensureGroupWithRole() will refuse to
        //     *auto-create* new Admin groups (because autoCreate already
        //     guards that). It will only enrol users into EXISTING Admin
        //     groups that are already linked to the OrgAdmin role.
        // The previous hard-continue is intentionally removed here.

        if (!baseToRoleName.has(base)) baseToRoleName.set(base, new Map())
        baseToRoleName.get(base)!.set(internalRole, raw)
    }

    const desiredGroupIds: string[] = []
    for (const [, roleNameMap] of baseToRoleName.entries()) {
        const groupsByRole: Partial<Record<InternalRole, GroupModel>> = {}
        for (const roleName of Array.from(roleNameMap.keys())) {
            const displayName = roleNameMap.get(roleName)
            if (!displayName) continue
            const group = await ensureGroupWithRole(displayName, roleName, context)
            logger.debug(`ensureGroupWithRole("${displayName}", ${roleName}) -> ${group ? group._id : 'none (group missing or auto-create disabled)'}`)
            if (!group) continue
            groupsByRole[roleName] = group
            desiredGroupIds.push(group._id)
        }
        await ensureHierarchy(groupsByRole)
    }

    // Compare against the user's current memberships. We need the raw relations (not the
    // flattened getUsersGroups() view) to know the relationType of each membership --
    // only "oidc-managed" relations may be removed below.
    const currentRelations = await RelationBDTO.getUserGroupRelations(userId)
    const currentIds = new Set(currentRelations.map((relation) => relation.fromId))
    const relationTypeByGroupId = new Map(currentRelations.map((relation) => [relation.fromId, relation.relationType]))
    const desiredIds = new Set(desiredGroupIds)
    logger.debug('Current group ids:', Array.from(currentIds), 'desired group ids:', Array.from(desiredIds))

    for (const groupId of desiredIds) {
        if (!currentIds.has(groupId)) {
            try {
                await RelationBDTO.addUserToGroup(userId, groupId, OIDC_MANAGED_RELATION_TYPE)
                logger.debug(`addUserToGroup: ${userId} -> ${groupId}`)
            } catch (e: any) {
                logger.warn(`addUserToGroup failed: ${userId} -> ${groupId}`, e)
            }
        }
    }
    for (const groupId of currentIds) {
        if (desiredIds.has(groupId)) continue
        if (relationTypeByGroupId.get(groupId) !== OIDC_MANAGED_RELATION_TYPE) {
            // Membership wasn't created by this sync (course provisioning, admin action, other
            // integrations) -- never remove it here, regardless of what the IdP claim says.
            logger.debug(`Keeping non-OIDC-managed membership: ${userId} -> ${groupId}`)
            continue
        }
        try {
            await RelationBDTO.removeUserFromGroup(userId, groupId)
            logger.debug(`removeUserFromGroup: ${userId} -> ${groupId}`)
        } catch (e: any) {
            logger.warn(`removeUserFromGroup failed: ${userId} -> ${groupId}`, e)
        }
    }
}