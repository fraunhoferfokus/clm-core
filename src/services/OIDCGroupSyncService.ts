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
import RelationBDTO from '../models/Relation/RelationBDTO'
import RoleDAO from '../models/Role/RoleDAO'

type InternalRole = 'Learner' | 'Instructor' | 'OrgAdmin'

function readGroupPattern(): RegExp | undefined {
    const pattern = process.env.OIDC_ALLOWED_GROUP_PATTERN?.trim()
    if (!pattern) return undefined
    try {
        return new RegExp(pattern)
    } catch (err) {
        console.warn('[OIDC] Invalid OIDC_ALLOWED_GROUP_PATTERN; ignoring:', err)
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

async function findGroupWithRole(displayName: string, roleName: InternalRole) {
    const role = await RoleDAO.findByRoleName(roleName)
    const [groups, relations] = await Promise.all([
        GroupDAO.findByAttributes({ displayName }),
        RelationBDTO.findAll()
    ])
    for (const group of groups) {
        const rel = relations.find((relation) => relation.fromType === 'group' && relation.fromId === group._id && relation.toType === 'role')
        if (rel && rel.toId === role._id) return group
    }
    return undefined
}

async function ensureGroupWithRole(displayName: string, roleName: InternalRole) {
    const existing = await findGroupWithRole(displayName, roleName)
    if (existing) return existing
    if (!CONFIG.OIDC_AUTO_CREATE_GROUPS) return undefined

    const role = await RoleDAO.findByRoleName(roleName)
    return GroupDAO.insert(new GroupModel({ displayName }), { role: role._id })
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

export async function syncGroupsAndMembershipsFromClaims(userId: string, groupsRaw: string) {
    const items = (groupsRaw || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, CONFIG.OIDC_GROUP_SYNC_MAX_ITEMS)

    const baseToRoleName = new Map<string, Map<InternalRole, string>>()
    for (const raw of items) {
        if (!isAllowedGroupName(raw)) continue

        const { base, suffix } = parseGroupEntry(raw)
        if (!base) continue

        const internalRole = suffixToInternalRole(suffix)
        if (internalRole === 'OrgAdmin' && !CONFIG.OIDC_ALLOW_ADMIN_GROUP_SYNC) continue

        if (!baseToRoleName.has(base)) baseToRoleName.set(base, new Map())
        baseToRoleName.get(base)!.set(internalRole, raw)
    }

    const desiredGroupIds: string[] = []
    for (const [, roleNameMap] of baseToRoleName.entries()) {
        const groupsByRole: Partial<Record<InternalRole, GroupModel>> = {}
        for (const roleName of Array.from(roleNameMap.keys())) {
            const displayName = roleNameMap.get(roleName)
            if (!displayName) continue
            const group = await ensureGroupWithRole(displayName, roleName)
            if (!group) continue
            groupsByRole[roleName] = group
            desiredGroupIds.push(group._id)
        }
        await ensureHierarchy(groupsByRole)
    }

    const current = await RelationBDTO.getUsersGroups(userId)
    const currentIds = new Set(current.map((group) => group._id))
    const desiredIds = new Set(desiredGroupIds)

    for (const groupId of desiredIds) {
        if (!currentIds.has(groupId)) {
            try { await RelationBDTO.addUserToGroup(userId, groupId) } catch (_) { /* ignore */ }
        }
    }
    for (const groupId of currentIds) {
        if (!desiredIds.has(groupId)) {
            try { await RelationBDTO.removeUserFromGroup(userId, groupId) } catch (_) { /* ignore */ }
        }
    }
}