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
import passport from '../passport/passport'
import { jwtServiceInstance } from '../services/jwtService'
import jwt from 'jsonwebtoken'
import UserDAO from '../models/User/UserDAO';
import SwaggerDefinition from '../services/SwaggerDefinition';
import { CONFIG } from '../config/config';
import axios from 'axios';
import GroupDAO from '../models/Group/GroupDAO';
import GroupModel from '../models/Group/GroupModel';
import RoleDAO from '../models/Role/RoleDAO';
import RelationBDTO from '../models/Relation/RelationBDTO';
const OIDC_PROVIDERS = CONFIG.OIDC_PROVIDERS


const basePath = CONFIG.BASE_PATH || '/core'
const baseLocation = `${basePath}/authentication`



class AuthController {

    router: express.Router;

    constructor() {
        this.router = express.Router()
    }

    configureRoutes() {
        /**
 * @openapi
 * paths:
 *   /core/authentication:  # Replace with your actual baseLocation value
 *     post:
 *       tags:
 *         - pblc
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   default: fame@fokus.fraunhofer.de
 *                 password:
 *                   type: string
 *                   default: 12345
 *               required:
 *                 - email
 *       responses:
 *         200:
 *           description: Successfully logged in
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   accessToken:
 *                     $ref: '#/components/parameters/accessToken'
 *                   refreshToken:
 *                     $ref: '#/components/parameters/accessToken'
 *                   accessTokenExpiresIn:
 *                     type: string
 *                     default: 12/10/2022
 *                   refreshTokenExpiresIn:
 *                     type: string
 *                     default: 12/10/2022
 */

        this.router.post('/', this.authenticateUser)

        /**
 * @openapi
 * paths:
 *   /core/authentication/refresh:  # Replace with your actual baseLocation value
 *     get:
 *       tags:
 *         - pblc
 *       security:
 *         - bearerAuth: []
 *         - refreshAuth: []
 *       responses:
 *         200:
 *           description: Refreshe access token
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   accessToken:
 *                     $ref: '#/components/parameters/accessToken'
 */

        this.router.get('/refresh', this.refreshSession)
    }

    authenticateUser: express.Handler = (req, res, next) => {
        passport.authenticate(['local'], async (err: any, user: any, info: any) => {
            if (err) return next(err)
            if (!user) return next({ status: 401, message: `Wrong username or password` })
            try {
                const [accessToken, refreshToken] = await jwtServiceInstance.createAccessAndRefreshToken(user);
                let decodedA: any = jwt.decode(accessToken);
                let decodedR: any = jwt.decode(refreshToken);
                let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
                let refreshTokenExpiresIn = new Date(1000 * decodedR.exp).toJSON();
                return res.json({ accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn, userId: user._id })
            } catch (err) {
                return next(err)
            }

        })(req, res, next)
    }

    refreshSession: express.Handler = async (req, res, next) => {
        let header: string | undefined = req.header('x-refresh-token');
        const token = header && header.toLowerCase().trim() !== '' && header !== 'undefined' ? header : null;
        if (!token) return next({ message: 'not valid x-refresh-token header!', status: 401 })

        let decodedJWT: any = jwt.decode(token)
        let iss = decodedJWT.iss
        try {
            if (iss !== CONFIG.DEPLOY_URL) {
                const provider = OIDC_PROVIDERS.find((provider: any) => provider.authorization_endpoint.includes(iss))
                if (!provider) return next({ message: `Invalid issuer: ${iss}! `, status: 401 });
                // get userinformation from provider

                const response = await axios.post(provider.token_endpoint,
                    {
                        grant_type: 'refresh_token',
                        client_id: provider.client_id,
                        client_secret: provider.client_secret,
                        refresh_token: token,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                )

                const idp_access_token = response.data.access_token

                // Optionally synchronize groups during refresh using returned id_token or access_token
                try {
                    if (CONFIG.OIDC_SYNC_GROUPS_ON_REFRESH) {
                        const idp_id_token = response.data.id_token
                        const decoded: any = idp_id_token ? jwt.decode(idp_id_token) : (idp_access_token ? jwt.decode(idp_access_token) : undefined)
                        if (decoded) {
                            const claimGroupsKey = CONFIG.OIDC_CLAIM_GROUPS
                            const claimSubKey = CONFIG.OIDC_CLAIM_SUB
                            const claimTrainingKey = CONFIG.OIDC_CLAIM_TRAINING_ID
                            const groupsRaw = decoded?.[claimGroupsKey] as string | undefined
                            if (groupsRaw && typeof groupsRaw === 'string') {
                                // Identify user by preferred identityId (trainingId fallback to sub)
                                const subject = (decoded?.[claimSubKey] ?? decoded?.sub) as string
                                const identityId = (decoded?.[claimTrainingKey] ?? subject) as string
                                const user = (await UserDAO.findByAttributes({ identityId }))[0]
                                if (user) {
                                    await this.syncGroupsAndMembershipsFromClaims(user._id, groupsRaw)
                                }
                            }
                        }
                    }
                } catch (e) {
                    // Non-fatal; continue returning refreshed tokens
                    if (CONFIG.VERBOSE === 'true') console.error('Refresh-time group sync error:', e)
                }
                return res.json({
                    access_token: idp_access_token,
                    expires_in: response.data.expires_in,
                    refresh_token: response?.data?.refresh_token,
                    refres_token_expires_in: response?.data?.refresh_token_expires_in
                })
            } else {
                return UserDAO.findById(decodedJWT.sub)
                    .then((user) => Promise.all([jwtServiceInstance.verifyToken(token, jwtServiceInstance.SECRET + user.password), user]))
                    .then(([, user]) => jwtServiceInstance.createToken(user))
                    .then((token) => {
                        let decodedA: any = jwt.decode(token);
                        let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
                        return res.json({ accessToken: token, accessTokenExpiresIn })
                    })
                    .catch((err) => next(err))
            }
        } catch (err: any) {
            return next({
                status: err?.response?.status || 401,
                message: err?.response?.data || 'IdP validation error with provided token...'
            })
        }






    }

    /**
     * Synchronize groups/memberships for a user based on a raw groups claim string.
     * displayName is kept exactly as provided by the token; hierarchy is built by base name.
     */
    private async syncGroupsAndMembershipsFromClaims(userId: string, groupsRaw: string) {
        // Parse comma-separated groups; keep raw entry for displayName
        const items = (groupsRaw || '').split(',').map(s => s.trim()).filter(Boolean)

        // Helper: normalize for parsing and split into base + suffix
        const normalize = (raw: string): string => (raw || '').replace(/\s*_\s*/g, CONFIG.OIDC_GROUP_ROLE_DELIMITER).replace(/\s+/g, ' ').trim()
        const parse = (entry: string): { base: string, suffix: string | null } => {
            const cleaned = normalize(entry)
            if (!cleaned) return { base: '', suffix: null }
            const delim = CONFIG.OIDC_GROUP_ROLE_DELIMITER
            const lastIdx = cleaned.lastIndexOf(delim)
            if (lastIdx < 0) return { base: cleaned, suffix: null }
            const base = cleaned.substring(0, lastIdx)
            const rawSuffix = cleaned.substring(lastIdx + delim.length)
            return { base: base || cleaned, suffix: rawSuffix || null }
        }
        const suffixToRole = (suffix: string | null): 'Learner'|'Instructor'|'OrgAdmin' => {
            const s = (suffix || '').trim().toLowerCase()
            const sufLearner = CONFIG.OIDC_GROUP_SUFFIX_LEARNER.toLowerCase()
            const sufInstructor = CONFIG.OIDC_GROUP_SUFFIX_INSTRUCTOR.toLowerCase()
            const sufAdmin = CONFIG.OIDC_GROUP_SUFFIX_ADMIN.toLowerCase()
            if (s === sufInstructor) return (CONFIG.OIDC_ROLEMAP_INSTRUCTOR as 'Instructor')
            if (s === sufAdmin) return (CONFIG.OIDC_ROLEMAP_ADMIN as 'OrgAdmin')
            if (s === sufLearner) return (CONFIG.OIDC_ROLEMAP_LEARNER as 'Learner')
            return (CONFIG.OIDC_ROLEMAP_LEARNER as 'Learner')
        }

        // Base -> (role -> raw displayName)
        const baseToRoleName = new Map<string, Map<'Learner'|'Instructor'|'OrgAdmin', string>>()
        for (const raw of items) {
            const { base, suffix } = parse(raw)
            if (!base) continue
            const role = suffixToRole(suffix)
            if (!baseToRoleName.has(base)) baseToRoleName.set(base, new Map())
            baseToRoleName.get(base)!.set(role, raw)
        }

        // Ensure groups and hierarchy
        const desired: string[] = []
        for (const [base, roleNameMap] of baseToRoleName.entries()) {
            const groupsByRole: Partial<Record<'Learner'|'Instructor'|'OrgAdmin', GroupModel>> = {}
            const roles = roleNameMap.size > 0
                ? Array.from(roleNameMap.keys()) as Array<'Learner'|'Instructor'|'OrgAdmin'>
                : (['Learner'] as Array<'Learner'>)
            for (const r of roles) {
                const displayName = roleNameMap.get(r) || base
                const roleModel = await RoleDAO.findByRoleName(r)
                // Try to find group by displayName with correct attached role
                const [groups, relations] = await Promise.all([
                    GroupDAO.findByAttributes({ displayName }),
                    RelationBDTO.findAll()
                ])
                let g = groups.find(grp => {
                    const rel = relations.find(rn => rn.fromType === 'group' && rn.fromId === grp._id && rn.toType === 'role')
                    return rel && rel.toId === roleModel._id
                })
                if (!g) {
                    g = await GroupDAO.insert(new GroupModel({ displayName }), { role: roleModel._id })
                }
                groupsByRole[r] = g
                desired.push(g._id)
            }
            // Ensure hierarchy: Admin -> Instructor -> Learner
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

        // Sync user membership
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

const controller = new AuthController()
controller.configureRoutes()

export default controller

