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
import { RessourcePermissions } from '../models/Role/RoleModel'
import RoleDAO from '../models/Role/RoleDAO'
import { findTrustedProviderByIssuer } from '../services/OIDCIssuerTrust'
import { syncGroupsAndMembershipsFromClaims } from '../services/OIDCGroupSyncService'


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
            requestUrl = requestUrl.replace(/[^a-zA-Z0-9\-_\/]/g, '');

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
                const decoded = jwt.decode(token) as JwtPayload | null
                const issuer = decoded?.iss
                if (!issuer) return next({ message: 'Missing issuer claim', status: 401 })

                // Flag um zwischen internen und externen Tokens zu unterscheiden
                let isExternalToken = false
                let verifiedToken: JwtPayload

                if (issuer !== CONFIG.DEPLOY_URL && !CONFIG.ALLOWED_ISSUERS.includes(issuer)) {
                    isExternalToken = true
                    const providers = getOIDCProviders()
                    const provider = findTrustedProviderByIssuer(providers, issuer)
                    if (!provider) return next({ message: `Invalid issuer: ${issuer}! `, status: 401 });
                    // JWKS based verification replaces userinfo endpoint call.
                    try {
                        verifiedToken = await jwtServiceInstance.verifyToken(token) as JwtPayload
                    } catch (err: any) {
                        console.error(err)
                        return next({ status: err.status || 401, message: err.message || 'IdP validation error with provided token...' })
                    }
                } else {
                    verifiedToken = await jwtServiceInstance.verifyToken(token) as JwtPayload
                }

                let user;

                // Internal and external flows must both use verified claims from the validated token.
                if (!isExternalToken) {
                    const userId = verifiedToken.sub as string
                    try {
                        user = await userBDTOInstance.findById(userId)
                    } catch (_) {
                        return next({ status: 401, message: 'User not found for internal token subject' })
                    }
                } else {
                    // Für externe Tokens: Erweiterte Lookup-Logik mit trainingId/sub Claims
                    const trainingKey = CONFIG.OIDC_CLAIM_TRAINING_ID
                    const subKey = CONFIG.OIDC_CLAIM_SUB
                    const preferredId = ((verifiedToken as any)?.[trainingKey] as string) || ((verifiedToken as any)?.[subKey] as string) || (verifiedToken.sub as string)
                    try {
                        user = await userBDTOInstance.findById(preferredId)
                    } catch (_) {
                        // Fallbacks to handle legacy users
                        const byIdentity = (await userBDTOInstance.findByAttributes({ identityId: preferredId }))[0]
                        if (byIdentity) user = byIdentity
                        if (!user) {
                            const byEmail = (await userBDTOInstance.findByAttributes({ email: preferredId }))[0] || (await userBDTOInstance.findByAttributes({ email: (verifiedToken as any)?.email }))[0]
                            if (byEmail) user = byEmail
                        }
                        if (!user) return next({ status: 401, message: 'User not found for token subject' })
                    }

                    // Gruppen-Synchronisierung nur für externe Tokens
                    if (CONFIG.OIDC_SYNC_GROUPS_ON_AUTH) {
                        try {
                            const groupsRaw = (verifiedToken as any)?.[CONFIG.OIDC_CLAIM_GROUPS] as string | undefined
                            if (groupsRaw && typeof groupsRaw === 'string') {
                                await syncGroupsAndMembershipsFromClaims(user._id, groupsRaw)
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
}




