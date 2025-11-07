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


import express from 'express'
import UrlPattern from 'url-pattern'
import RelationBDTO, { Role } from '../models/Relation/RelationBDTO'
import ConsumerDAO from '../models/ServiceConsumer/ConsumerDAO'
import { userBDTOInstance } from '../models/User/UserBDTO'
import { jwtServiceInstance } from '../services/jwtService'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { CONFIG } from '../config/config'
import axios from 'axios'
import { RessourcePermissions } from '../models/Role/RoleModel'
import RoleDAO from '../models/Role/RoleDAO'
import GroupDAO from '../models/Group/GroupDAO'
import GroupModel from '../models/Group/GroupModel'


// Get enriched providers (with jwks_uri fallback)
let OIDC_PROVIDER_ENRICHED: any[] = []
function getOIDCProviders() {
    try {
        // Import dynamically to avoid circular dependencies
        const { getEnrichedProviders } = require('../controllers/OIDCController')
        OIDC_PROVIDER_ENRICHED = getEnrichedProviders()
    } catch {
        OIDC_PROVIDER_ENRICHED = CONFIG.OIDC_PROVIDERS || []
    }
    return OIDC_PROVIDER_ENRICHED
}
// Log version when AuthGuard is imported (helps consumers using the npm package)
(() => {
    let version = 'unknown';
    try {
        // Using relative path resolution at runtime (dist structure mirrors src)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require('../../package.json');
        if (pkg?.version) version = pkg.version;
    } catch { /* ignore */ }
})();


let HTTP_METHODS_CRUD_MAPPER = {
    GET: 1,
    POST: 2,
    PUT: 4,
    PATCH: 4,
    DELETE: 8,
}


export enum CrudAccess {
    Read = 1 << 0, // 1 
    Write = 1 << 1, // 2
    Delete = 1 << 2, // 4
    Update = 1 << 3, // 8
    ReadWrite = Read | Write, // 3
    ReadDelete = Read | Delete,
    ReadUpdate = Read | Update,
    ReadWriteDelete = Read | Write | Delete,
    ReadWriteUpdate = Read | Write | Update,
    ReadWriteDeleteUpdate = Read | Write | Delete | Update,
    WriteDelete = Write | Delete,
    WriteUpdate = Write | Update,
    WriteDeleteUpdate = Write | Delete | Update,
    DeleteUpdate = Delete | Update
}

/**
 * @public
 * (Optional) payload for the method {@link AuthGuard.permissionChecker}
 */
export interface CheckResource {
    /**
     * Where the resource is contained
     */
    containedIn: ('body' | 'params'),
    /**
     * The name of the resource
     */
    name: string,
    /**
     * The type of the resource
     */
    type: string,
    /**
     * Whether the resource is a relation
     */
    isRelation?: boolean
}


/**
 * (Optional) payload for the method {@link AuthGuard.requireUserAuthentication}
 * @public
 */
export interface UserAuthenticationOptions {
    /**
     * Whether the id of the requested resource should be the same as the requesters id
     */
    sameUserAsId?: boolean
}

/**
 * Static class which exposes express-auth-middlewares
 * @public
 */
export class AuthGuard {

    /**
     * Force api-token authentication 
     * @param excluded - Array of strings which exclude certain routes to be checked against authoriziation
     * @returns 
     */
    static requireAPIToken = (excluded?: string[]) => {
        return ([this.isAPITokenAuthenticated(excluded), this.isAPITokenAuthorized()])
    }

    private static isAPITokenAuthenticated = (excluded?: string[]): express.Handler => async (req, res, next) => {
        let requestUrl = req.url.endsWith('/')
            ? req.originalUrl.slice(0, -1)
            : req.originalUrl;
        const regex = /\?.+/;
        requestUrl = requestUrl.replace(regex, '').trim();
        requestUrl = requestUrl.replace(/\./g, '');
        requestUrl = requestUrl.replace(/=/g, '');

        const match = excluded?.find((path) => new UrlPattern(path).match(requestUrl))
        if (match) {
            req.byPass = true
            return next()
        }

        const bearerOrBasic = req.get('Authorization');
        if (!bearerOrBasic) return next({ status: 400, message: `Authorization header has to be present!` })
        let [format, value] = bearerOrBasic.split(' ');
        if (format === 'Basic') {
            let [username, password] = Buffer.from(value, 'base64').toString('utf-8').split(':');
            value = username || password;
        } else if (format !== 'Bearer') {
            return next({ status: 400, message: `Invalid auth-scheme. Allowed are: [Bearer, Basic]` })
        }

        if (!value) return next({ status: 400, message: `API-Token cannot be empty or undefined!` })

        try {
            const token = await ConsumerDAO.findById(value)
            req.apiToken = token;
            return next()
        } catch (err: any) {
            if (err.status === 404) return next({ message: `Invalid API-Token`, status: 400 })
            return next(err)
        }


    }

    private static isAPITokenAuthorized = (): express.Handler => {
        return async (req, res, next) => {
            if (req.byPass) return next()
            let method = req.method;
            let requestUrl = req.url.endsWith('/')
                ? req.originalUrl.slice(0, -1)
                : req.originalUrl;
            //query-param
            requestUrl = requestUrl.replace(/\?.+/, '').trim();
            requestUrl = requestUrl.replace(/\./g, '');
            requestUrl = requestUrl.replace('@', '')

            try {
                let match = req.apiToken.paths?.map((path) => [new UrlPattern(path.route), path.scope] as [UrlPattern, string[]])
                    .find(([pattern, scope]) => pattern.match(requestUrl) && scope.includes(method.toUpperCase()))

                if (match) return next()
                return next({ status: 403, message: `Not sufficient permission or route does not exist: ${requestUrl} (${method.toUpperCase()})` })



            } catch (err) {
                return next(err)
            }





        }
    }

    /**
     * Force user authentication 
     * @param config - Config
     * @returns 
     */
    static requireUserAuthentication(config: UserAuthenticationOptions = { sameUserAsId: false }): express.Handler[] {
        let arr: express.Handler[] = [async (req, res, next) => {
            let header: string | undefined = req.header('x-access-token');
            const token = header && header.toLowerCase().trim() !== '' && header !== 'undefined' ? header : null;
            if (!token) return next({ message: 'not valid x-access-token header!', status: 401 });

            try {
                let decoded = jwt.decode(token) as JwtPayload
                let iss = decoded.iss
                // Flag um zwischen internen und externen Tokens zu unterscheiden
                let isExternalToken = false
                
                if (iss !== CONFIG.DEPLOY_URL && !CONFIG.ALLOWED_ISSUERS.includes(iss)) {
                    isExternalToken = true
                    const providers = getOIDCProviders()
                    const provider = providers.find((provider: any) => provider.authorization_endpoint.includes(iss))
                    if (!provider) return next({ message: `Invalid issuer: ${iss}! `, status: 401 });
                    // JWKS based verification replaces userinfo endpoint call
                    try {
                        const { verifyExternalToken } = await import('../services/jwksService');
                        await verifyExternalToken(token);
                    } catch (err: any) {
                        console.error(err)
                        return next({ status: err.status || 401, message: err.message || 'IdP validation error with provided token...' })
                    }
                } else {
                    await jwtServiceInstance.verifyToken(token)
                }

                let user;
                
                // Für interne Tokens: Direkter Lookup via sub (keine Fallbacks, keine Claims)
                if (!isExternalToken) {
                    const userId = decoded.sub as string
                    try {
                        user = await userBDTOInstance.findById(userId)
                    } catch (_) {
                        return next({ status: 401, message: 'User not found for internal token subject' })
                    }
                } else {
                    // Für externe Tokens: Erweiterte Lookup-Logik mit trainingId/sub Claims
                    const trainingKey = CONFIG.OIDC_CLAIM_TRAINING_ID
                    const subKey = CONFIG.OIDC_CLAIM_SUB
                    const preferredId = ((decoded as any)?.[trainingKey] as string) || ((decoded as any)?.[subKey] as string) || (decoded.sub as string)
                    try {
                        user = await userBDTOInstance.findById(preferredId)
                    } catch (_) {
                        // Fallbacks to handle legacy users
                        const byIdentity = (await userBDTOInstance.findByAttributes({ identityId: preferredId }))[0]
                        if (byIdentity) user = byIdentity
                        if (!user) {
                            const byEmail = (await userBDTOInstance.findByAttributes({ email: preferredId }))[0] || (await userBDTOInstance.findByAttributes({ email: (decoded as any)?.email }))[0]
                            if (byEmail) user = byEmail
                        }
                        if (!user) return next({ status: 401, message: 'User not found for token subject' })
                    }
                    
                    // Gruppen-Synchronisierung nur für externe Tokens
                    if (CONFIG.OIDC_SYNC_GROUPS_ON_AUTH) {
                        try {
                            const groupsRaw = (decoded as any)?.[CONFIG.OIDC_CLAIM_GROUPS] as string | undefined
                            if (groupsRaw && typeof groupsRaw === 'string') {
                                await AuthGuard.syncGroupsAndMembershipsFromClaims(user._id, groupsRaw)
                            }
                        } catch (e) {
                            // Do not block request on group sync errors
                            if (CONFIG.VERBOSE === 'true') console.error('AuthGuard group sync error:', e)
                        }
                    }
                }
                
                req.requestingUser = user
                // req.app.locals.user = req.locals?.user;
                return next();
            } catch (err: any) {
                return next({ status: 401, message: err.message });
            }
        }]
        if (config.sameUserAsId) arr.push(this.sameUserAsId())

        return arr
    }

    /**
     * Ensures that a route can only accessed when a user has a specific role
     * @param role - The minimum required role to access that role {@link Role}
     * @param resources - An array of resources which need to be authorized
     * @param requiredCrud - For individual Permission which is required to execute to the target ressource
     * @returns 
     */
    static permissionChecker(
        ressource: keyof RessourcePermissions,
        targetedIds: { in: 'path' | 'body', name: string }[] = [],
        requiredCrud?: CrudAccess
    ): express.Handler[] {
        return [...this.requireUserAuthentication(),
        async (req, res, next) => {
            if (req.requestingUser?.isSuperAdmin) return next()

            const allRelations = await RelationBDTO.findAll()
            const usersPermissions = await RelationBDTO.getUsersPermissions(req.requestingUser?._id!)
            req.requestingUser!.permissions = usersPermissions!



            const method = req.method.toUpperCase()
            let crudPermission = requiredCrud || HTTP_METHODS_CRUD_MAPPER[method as keyof typeof HTTP_METHODS_CRUD_MAPPER]

            const userIsInGroups = (await RelationBDTO.findAll()).filter((relation) => relation.toId === req.requestingUser?._id && relation.fromType === 'group')

            let allowedAction = false
            for (const userIsInGroup of userIsInGroups) {
                const groupHasRoleRelation = allRelations.find((relation) => relation.fromId === userIsInGroup.fromId && relation.toType === 'role')!
                const groupRole = await RoleDAO.findById(groupHasRoleRelation.toId)
                let currentCrudPermissions = groupRole.resourcePermissions[ressource]
                if ((currentCrudPermissions & crudPermission) === crudPermission) {
                    allowedAction = true
                    break;
                }
            }

            if (!allowedAction) {
                return next({ status: 403, message: `Not sufficient group-permissions to execute: ${req.url} (${method.toUpperCase()})` })
            }

            for (const targetedId of targetedIds) {
                let id = targetedId.in === 'path' ? req.params[targetedId.name] : req.body[targetedId.name]
                if ((usersPermissions[id] & crudPermission) !== crudPermission) {
                    return next({ status: 403, message: `Not sufficient permissions to execute: ${req.url} (${method.toUpperCase()}) to the ressource ${id}` })
                }
            }
            return next()
        }
        ]
    }

    /**
     * Require super-admin to access certain routes
     * @returns 
     */
    static requireAdminUser = (): express.Handler[] => {
        return [...this.requireUserAuthentication(), (req, res, next) => {
            if (!req.requestingUser?.isSuperAdmin) return next({ status: 400, message: `Not admin user!` })
            return next()
        }]
    }

    private static sameUserAsId = (): express.Handler => {
        return (req, res, next) => {
            if (req.requestingUser?._id !== req.params.id && !req.requestingUser?.isSuperAdmin) return next({ message: 'Cannot access another user!', status: 400 })
            return next()
        }
    }


    /** Normalize a group token by trimming and unifying delimiter spacing */
    private static normalizeGroupToken(raw: string): string {
        return (raw || '').replace(/\s*_\s*/g, CONFIG.OIDC_GROUP_ROLE_DELIMITER).replace(/\s+/g, ' ').trim()
    }

    /** Parse a single group entry into base displayName and optional suffix role token */
    private static parseGroupEntry(entry: string): { base: string, suffix: string | null } {
        const cleaned = this.normalizeGroupToken(entry)
        if (!cleaned) return { base: '', suffix: null }
        const delim = CONFIG.OIDC_GROUP_ROLE_DELIMITER
        const lastIdx = cleaned.lastIndexOf(delim)
        if (lastIdx < 0) return { base: cleaned, suffix: null }
        const base = cleaned.substring(0, lastIdx)
        const rawSuffix = cleaned.substring(lastIdx + delim.length)
        return { base: base || cleaned, suffix: rawSuffix || null }
    }

    /** Map suffix token to internal role display name */
    private static suffixToInternalRole(suffix: string | null): 'Learner' | 'Instructor' | 'OrgAdmin' {
        const s = (suffix || '').trim().toLowerCase()
        const sufLearner = CONFIG.OIDC_GROUP_SUFFIX_LEARNER.toLowerCase()
        const sufInstructor = CONFIG.OIDC_GROUP_SUFFIX_INSTRUCTOR.toLowerCase()
        const sufAdmin = CONFIG.OIDC_GROUP_SUFFIX_ADMIN.toLowerCase()
        if (s === sufInstructor) return (CONFIG.OIDC_ROLEMAP_INSTRUCTOR as 'Instructor')
        if (s === sufAdmin) return (CONFIG.OIDC_ROLEMAP_ADMIN as 'OrgAdmin')
        if (s === sufLearner) return (CONFIG.OIDC_ROLEMAP_LEARNER as 'Learner')
        return (CONFIG.OIDC_ROLEMAP_LEARNER as 'Learner')
    }

    /** Ensure a group exists with the given role connected; create if missing */
    private static async ensureGroupWithRole(displayName: string, roleName: 'Learner' | 'Instructor' | 'OrgAdmin') {
        const role = await RoleDAO.findByRoleName(roleName)
        const [groups, relations] = await Promise.all([
            GroupDAO.findByAttributes({ displayName }),
            RelationBDTO.findAll()
        ])
        for (const g of groups) {
            const rel = relations.find(r => r.fromType === 'group' && r.fromId === g._id && r.toType === 'role')
            if (rel && rel.toId === role._id) return g
        }
        return GroupDAO.insert(new GroupModel({ displayName }), { role: role._id })
    }

    /** Ensure the hierarchy Admin -> Instructor -> Learner exists for a base group */
    private static async ensureHierarchy(groupsByRole: Partial<Record<'Learner'|'Instructor'|'OrgAdmin', GroupModel>>) {
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

    /** Parse the claim and synchronize user's memberships */
    private static async syncGroupsAndMembershipsFromClaims(userId: string, groupsRaw: string) {
        // Keep displayName exactly as in token; only normalize for parsing role/base
        const items = (groupsRaw || '').split(',').map(s => s.trim()).filter(Boolean)
        const baseToRoleName = new Map<string, Map<'Learner'|'Instructor'|'OrgAdmin', string>>()
        for (const raw of items) {
            const { base, suffix } = this.parseGroupEntry(raw)
            if (!base) continue
            const role = this.suffixToInternalRole(suffix)
            if (!baseToRoleName.has(base)) baseToRoleName.set(base, new Map())
            baseToRoleName.get(base)!.set(role, raw)
        }
        const desired: string[] = []
        for (const [base, roleNameMap] of baseToRoleName.entries()) {
            const groupsByRole: Partial<Record<'Learner'|'Instructor'|'OrgAdmin', GroupModel>> = {}
            const roles = roleNameMap.size > 0
                ? Array.from(roleNameMap.keys()) as Array<'Learner'|'Instructor'|'OrgAdmin'>
                : (['Learner'] as Array<'Learner'>)
            for (const r of roles) {
                const displayName = roleNameMap.get(r) || base
                const g = await this.ensureGroupWithRole(displayName, r)
                groupsByRole[r] = g
                desired.push(g._id)
            }
            await this.ensureHierarchy(groupsByRole)
        }
        const current = await RelationBDTO.getUsersGroups(userId)
        const currentIds = new Set(current.map(g => g._id))
        const desiredIds = new Set(desired)
        for (const gid of desiredIds) {
            if (!currentIds.has(gid)) {
                try { await RelationBDTO.addUserToGroup(userId, gid) } catch (_) { /* ignore */ }
            }
        }
        for (const gid of currentIds) {
            if (!desiredIds.has(gid)) {
                try { await RelationBDTO.removeUserFromGroup(userId, gid) } catch (_) { /* ignore */ }
            }
        }
    }
}




