"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("../passport/passport"));
const jwtService_1 = require("../services/jwtService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const config_1 = require("../config/config");
const axios_1 = __importDefault(require("axios"));
const GroupDAO_1 = __importDefault(require("../models/Group/GroupDAO"));
const GroupModel_1 = __importDefault(require("../models/Group/GroupModel"));
const RoleDAO_1 = __importDefault(require("../models/Role/RoleDAO"));
const RelationBDTO_1 = __importDefault(require("../models/Relation/RelationBDTO"));
const OIDC_PROVIDERS = config_1.CONFIG.OIDC_PROVIDERS;
const basePath = config_1.CONFIG.BASE_PATH || '/core';
const baseLocation = `${basePath}/authentication`;
class AuthController {
    constructor() {
        this.authenticateUser = (req, res, next) => {
            passport_1.default.authenticate(['local'], (err, user, info) => __awaiter(this, void 0, void 0, function* () {
                if (err)
                    return next(err);
                if (!user)
                    return next({ status: 401, message: `Wrong username or password` });
                try {
                    const [accessToken, refreshToken] = yield jwtService_1.jwtServiceInstance.createAccessAndRefreshToken(user);
                    let decodedA = jsonwebtoken_1.default.decode(accessToken);
                    let decodedR = jsonwebtoken_1.default.decode(refreshToken);
                    let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
                    let refreshTokenExpiresIn = new Date(1000 * decodedR.exp).toJSON();
                    return res.json({ accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn, userId: user._id });
                }
                catch (err) {
                    return next(err);
                }
            }))(req, res, next);
        };
        this.refreshSession = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            let header = req.header('x-refresh-token');
            const token = header && header.toLowerCase().trim() !== '' && header !== 'undefined' ? header : null;
            if (!token)
                return next({ message: 'not valid x-refresh-token header!', status: 401 });
            let decodedJWT = jsonwebtoken_1.default.decode(token);
            let iss = decodedJWT.iss;
            try {
                if (iss !== config_1.CONFIG.DEPLOY_URL) {
                    const provider = OIDC_PROVIDERS.find((provider) => provider.authorization_endpoint.includes(iss));
                    if (!provider)
                        return next({ message: `Invalid issuer: ${iss}! `, status: 401 });
                    // get userinformation from provider
                    const response = yield axios_1.default.post(provider.token_endpoint, {
                        grant_type: 'refresh_token',
                        client_id: provider.client_id,
                        client_secret: provider.client_secret,
                        refresh_token: token,
                    }, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                    const idp_access_token = response.data.access_token;
                    // Optionally synchronize groups during refresh using returned id_token or access_token
                    try {
                        if (config_1.CONFIG.OIDC_SYNC_GROUPS_ON_REFRESH) {
                            const idp_id_token = response.data.id_token;
                            const decoded = idp_id_token ? jsonwebtoken_1.default.decode(idp_id_token) : (idp_access_token ? jsonwebtoken_1.default.decode(idp_access_token) : undefined);
                            if (decoded) {
                                const claimGroupsKey = config_1.CONFIG.OIDC_CLAIM_GROUPS;
                                const claimSubKey = config_1.CONFIG.OIDC_CLAIM_SUB;
                                const claimTrainingKey = config_1.CONFIG.OIDC_CLAIM_TRAINING_ID;
                                const groupsRaw = decoded === null || decoded === void 0 ? void 0 : decoded[claimGroupsKey];
                                if (groupsRaw && typeof groupsRaw === 'string') {
                                    // Identify user by preferred identityId (trainingId fallback to sub)
                                    const subject = ((_a = decoded === null || decoded === void 0 ? void 0 : decoded[claimSubKey]) !== null && _a !== void 0 ? _a : decoded === null || decoded === void 0 ? void 0 : decoded.sub);
                                    const identityId = ((_b = decoded === null || decoded === void 0 ? void 0 : decoded[claimTrainingKey]) !== null && _b !== void 0 ? _b : subject);
                                    const user = (yield UserDAO_1.default.findByAttributes({ identityId }))[0];
                                    if (user) {
                                        yield this.syncGroupsAndMembershipsFromClaims(user._id, groupsRaw);
                                    }
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Non-fatal; continue returning refreshed tokens
                        if (config_1.CONFIG.VERBOSE === 'true')
                            console.error('Refresh-time group sync error:', e);
                    }
                    return res.json({
                        access_token: idp_access_token,
                        expires_in: response.data.expires_in,
                        refresh_token: (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.refresh_token,
                        refres_token_expires_in: (_d = response === null || response === void 0 ? void 0 : response.data) === null || _d === void 0 ? void 0 : _d.refresh_token_expires_in
                    });
                }
                else {
                    return UserDAO_1.default.findById(decodedJWT.sub)
                        .then((user) => Promise.all([jwtService_1.jwtServiceInstance.verifyToken(token, jwtService_1.jwtServiceInstance.SECRET + user.password), user]))
                        .then(([, user]) => jwtService_1.jwtServiceInstance.createToken(user))
                        .then((token) => {
                        let decodedA = jsonwebtoken_1.default.decode(token);
                        let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
                        return res.json({ accessToken: token, accessTokenExpiresIn });
                    })
                        .catch((err) => next(err));
                }
            }
            catch (err) {
                return next({
                    status: ((_e = err === null || err === void 0 ? void 0 : err.response) === null || _e === void 0 ? void 0 : _e.status) || 401,
                    message: ((_f = err === null || err === void 0 ? void 0 : err.response) === null || _f === void 0 ? void 0 : _f.data) || 'IdP validation error with provided token...'
                });
            }
        });
        this.router = express_1.default.Router();
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
        this.router.post('/', this.authenticateUser);
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
        this.router.get('/refresh', this.refreshSession);
    }
    /**
     * Synchronize groups/memberships for a user based on a raw groups claim string.
     * displayName is kept exactly as provided by the token; hierarchy is built by base name.
     */
    syncGroupsAndMembershipsFromClaims(userId, groupsRaw) {
        return __awaiter(this, void 0, void 0, function* () {
            // Parse comma-separated groups; keep raw entry for displayName
            const items = (groupsRaw || '').split(',').map(s => s.trim()).filter(Boolean);
            // Helper: normalize for parsing and split into base + suffix
            const normalize = (raw) => (raw || '').replace(/\s*_\s*/g, config_1.CONFIG.OIDC_GROUP_ROLE_DELIMITER).replace(/\s+/g, ' ').trim();
            const parse = (entry) => {
                const cleaned = normalize(entry);
                if (!cleaned)
                    return { base: '', suffix: null };
                const delim = config_1.CONFIG.OIDC_GROUP_ROLE_DELIMITER;
                const lastIdx = cleaned.lastIndexOf(delim);
                if (lastIdx < 0)
                    return { base: cleaned, suffix: null };
                const base = cleaned.substring(0, lastIdx);
                const rawSuffix = cleaned.substring(lastIdx + delim.length);
                return { base: base || cleaned, suffix: rawSuffix || null };
            };
            const suffixToRole = (suffix) => {
                const s = (suffix || '').trim().toLowerCase();
                const sufLearner = config_1.CONFIG.OIDC_GROUP_SUFFIX_LEARNER.toLowerCase();
                const sufInstructor = config_1.CONFIG.OIDC_GROUP_SUFFIX_INSTRUCTOR.toLowerCase();
                const sufAdmin = config_1.CONFIG.OIDC_GROUP_SUFFIX_ADMIN.toLowerCase();
                if (s === sufInstructor)
                    return config_1.CONFIG.OIDC_ROLEMAP_INSTRUCTOR;
                if (s === sufAdmin)
                    return config_1.CONFIG.OIDC_ROLEMAP_ADMIN;
                if (s === sufLearner)
                    return config_1.CONFIG.OIDC_ROLEMAP_LEARNER;
                return config_1.CONFIG.OIDC_ROLEMAP_LEARNER;
            };
            // Base -> (role -> raw displayName)
            const baseToRoleName = new Map();
            for (const raw of items) {
                const { base, suffix } = parse(raw);
                if (!base)
                    continue;
                const role = suffixToRole(suffix);
                if (!baseToRoleName.has(base))
                    baseToRoleName.set(base, new Map());
                baseToRoleName.get(base).set(role, raw);
            }
            // Ensure groups and hierarchy
            const desired = [];
            for (const [base, roleNameMap] of baseToRoleName.entries()) {
                const groupsByRole = {};
                const roles = roleNameMap.size > 0
                    ? Array.from(roleNameMap.keys())
                    : ['Learner'];
                for (const r of roles) {
                    const displayName = roleNameMap.get(r) || base;
                    const roleModel = yield RoleDAO_1.default.findByRoleName(r);
                    // Try to find group by displayName with correct attached role
                    const [groups, relations] = yield Promise.all([
                        GroupDAO_1.default.findByAttributes({ displayName }),
                        RelationBDTO_1.default.findAll()
                    ]);
                    let g = groups.find(grp => {
                        const rel = relations.find(rn => rn.fromType === 'group' && rn.fromId === grp._id && rn.toType === 'role');
                        return rel && rel.toId === roleModel._id;
                    });
                    if (!g) {
                        g = yield GroupDAO_1.default.insert(new GroupModel_1.default({ displayName }), { role: roleModel._id });
                    }
                    groupsByRole[r] = g;
                    desired.push(g._id);
                }
                // Ensure hierarchy: Admin -> Instructor -> Learner
                const admin = groupsByRole['OrgAdmin'];
                const instructor = groupsByRole['Instructor'];
                const learner = groupsByRole['Learner'];
                if (admin && instructor) {
                    try {
                        yield RelationBDTO_1.default.addGroupToGroup(admin._id, instructor._id);
                    }
                    catch (_) { /* ignore */ }
                }
                else if (admin && learner) {
                    try {
                        yield RelationBDTO_1.default.addGroupToGroup(admin._id, learner._id);
                    }
                    catch (_) { /* ignore */ }
                }
                if (instructor && learner) {
                    try {
                        yield RelationBDTO_1.default.addGroupToGroup(instructor._id, learner._id);
                    }
                    catch (_) { /* ignore */ }
                }
            }
            // Sync user membership
            const current = yield RelationBDTO_1.default.getUsersGroups(userId);
            const currentIds = new Set(current.map(g => g._id));
            const desiredIds = new Set(desired);
            for (const gid of desiredIds) {
                if (!currentIds.has(gid)) {
                    try {
                        yield RelationBDTO_1.default.addUserToGroup(userId, gid);
                    }
                    catch (_) { /* ignore */ }
                }
            }
            for (const gid of currentIds) {
                if (!desiredIds.has(gid)) {
                    try {
                        yield RelationBDTO_1.default.removeUserFromGroup(userId, gid);
                    }
                    catch (_) { /* ignore */ }
                }
            }
        });
    }
}
const controller = new AuthController();
controller.configureRoutes();
exports.default = controller;
