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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = exports.CrudAccess = void 0;
const url_pattern_1 = __importDefault(require("url-pattern"));
const RelationBDTO_1 = __importDefault(require("../models/Relation/RelationBDTO"));
const ConsumerDAO_1 = __importDefault(require("../models/ServiceConsumer/ConsumerDAO"));
const UserBDTO_1 = require("../models/User/UserBDTO");
const jwtService_1 = require("../services/jwtService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const RoleDAO_1 = __importDefault(require("../models/Role/RoleDAO"));
const GroupDAO_1 = __importDefault(require("../models/Group/GroupDAO"));
const GroupModel_1 = __importDefault(require("../models/Group/GroupModel"));
// Get enriched providers (with jwks_uri fallback)
let OIDC_PROVIDER_ENRICHED = [];
function getOIDCProviders() {
    try {
        // Import dynamically to avoid circular dependencies
        const { getEnrichedProviders } = require('../controllers/OIDCController');
        OIDC_PROVIDER_ENRICHED = getEnrichedProviders();
    }
    catch (_b) {
        OIDC_PROVIDER_ENRICHED = config_1.CONFIG.OIDC_PROVIDERS || [];
    }
    return OIDC_PROVIDER_ENRICHED;
}
// Log version when AuthGuard is imported (helps consumers using the npm package)
(() => {
    let version = 'unknown';
    try {
        // Using relative path resolution at runtime (dist structure mirrors src)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require('../../package.json');
        if (pkg === null || pkg === void 0 ? void 0 : pkg.version)
            version = pkg.version;
    }
    catch ( /* ignore */_b) { /* ignore */ }
})();
let HTTP_METHODS_CRUD_MAPPER = {
    GET: 1,
    POST: 2,
    PUT: 4,
    PATCH: 4,
    DELETE: 8,
};
var CrudAccess;
(function (CrudAccess) {
    CrudAccess[CrudAccess["Read"] = 1] = "Read";
    CrudAccess[CrudAccess["Write"] = 2] = "Write";
    CrudAccess[CrudAccess["Delete"] = 4] = "Delete";
    CrudAccess[CrudAccess["Update"] = 8] = "Update";
    CrudAccess[CrudAccess["ReadWrite"] = 3] = "ReadWrite";
    CrudAccess[CrudAccess["ReadDelete"] = 5] = "ReadDelete";
    CrudAccess[CrudAccess["ReadUpdate"] = 9] = "ReadUpdate";
    CrudAccess[CrudAccess["ReadWriteDelete"] = 7] = "ReadWriteDelete";
    CrudAccess[CrudAccess["ReadWriteUpdate"] = 11] = "ReadWriteUpdate";
    CrudAccess[CrudAccess["ReadWriteDeleteUpdate"] = 15] = "ReadWriteDeleteUpdate";
    CrudAccess[CrudAccess["WriteDelete"] = 6] = "WriteDelete";
    CrudAccess[CrudAccess["WriteUpdate"] = 10] = "WriteUpdate";
    CrudAccess[CrudAccess["WriteDeleteUpdate"] = 14] = "WriteDeleteUpdate";
    CrudAccess[CrudAccess["DeleteUpdate"] = 12] = "DeleteUpdate";
})(CrudAccess = exports.CrudAccess || (exports.CrudAccess = {}));
/**
 * Static class which exposes express-auth-middlewares
 * @public
 */
class AuthGuard {
    /**
     * Force user authentication
     * @param config - Config
     * @returns
     */
    static requireUserAuthentication(config = { sameUserAsId: false }) {
        let arr = [(req, res, next) => __awaiter(this, void 0, void 0, function* () {
                let header = req.header('x-access-token');
                const token = header && header.toLowerCase().trim() !== '' && header !== 'undefined' ? header : null;
                if (!token)
                    return next({ message: 'not valid x-access-token header!', status: 401 });
                try {
                    let decoded = jsonwebtoken_1.default.decode(token);
                    let iss = decoded.iss;
                    // Flag um zwischen internen und externen Tokens zu unterscheiden
                    let isExternalToken = false;
                    if (iss !== config_1.CONFIG.DEPLOY_URL && !config_1.CONFIG.ALLOWED_ISSUERS.includes(iss)) {
                        isExternalToken = true;
                        const providers = getOIDCProviders();
                        const provider = providers.find((provider) => provider.authorization_endpoint.includes(iss));
                        if (!provider)
                            return next({ message: `Invalid issuer: ${iss}! `, status: 401 });
                        // JWKS based verification replaces userinfo endpoint call
                        try {
                            const { verifyExternalToken } = yield Promise.resolve().then(() => __importStar(require('../services/jwksService')));
                            yield verifyExternalToken(token);
                        }
                        catch (err) {
                            console.error(err);
                            return next({ status: err.status || 401, message: err.message || 'IdP validation error with provided token...' });
                        }
                    }
                    else {
                        yield jwtService_1.jwtServiceInstance.verifyToken(token);
                    }
                    let user;
                    // Für interne Tokens: Direkter Lookup via sub (keine Fallbacks, keine Claims)
                    if (!isExternalToken) {
                        const userId = decoded.sub;
                        try {
                            user = yield UserBDTO_1.userBDTOInstance.findById(userId);
                        }
                        catch (_) {
                            return next({ status: 401, message: 'User not found for internal token subject' });
                        }
                    }
                    else {
                        // Für externe Tokens: Erweiterte Lookup-Logik mit trainingId/sub Claims
                        const trainingKey = config_1.CONFIG.OIDC_CLAIM_TRAINING_ID;
                        const subKey = config_1.CONFIG.OIDC_CLAIM_SUB;
                        const preferredId = (decoded === null || decoded === void 0 ? void 0 : decoded[trainingKey]) || (decoded === null || decoded === void 0 ? void 0 : decoded[subKey]) || decoded.sub;
                        try {
                            user = yield UserBDTO_1.userBDTOInstance.findById(preferredId);
                        }
                        catch (_) {
                            // Fallbacks to handle legacy users
                            const byIdentity = (yield UserBDTO_1.userBDTOInstance.findByAttributes({ identityId: preferredId }))[0];
                            if (byIdentity)
                                user = byIdentity;
                            if (!user) {
                                const byEmail = (yield UserBDTO_1.userBDTOInstance.findByAttributes({ email: preferredId }))[0] || (yield UserBDTO_1.userBDTOInstance.findByAttributes({ email: decoded === null || decoded === void 0 ? void 0 : decoded.email }))[0];
                                if (byEmail)
                                    user = byEmail;
                            }
                            if (!user)
                                return next({ status: 401, message: 'User not found for token subject' });
                        }
                        // Gruppen-Synchronisierung nur für externe Tokens
                        if (config_1.CONFIG.OIDC_SYNC_GROUPS_ON_AUTH) {
                            try {
                                const groupsRaw = decoded === null || decoded === void 0 ? void 0 : decoded[config_1.CONFIG.OIDC_CLAIM_GROUPS];
                                if (groupsRaw && typeof groupsRaw === 'string') {
                                    yield AuthGuard.syncGroupsAndMembershipsFromClaims(user._id, groupsRaw);
                                }
                            }
                            catch (e) {
                                // Do not block request on group sync errors
                                if (config_1.CONFIG.VERBOSE === 'true')
                                    console.error('AuthGuard group sync error:', e);
                            }
                        }
                    }
                    req.requestingUser = user;
                    // req.app.locals.user = req.locals?.user;
                    return next();
                }
                catch (err) {
                    return next({ status: 401, message: err.message });
                }
            })];
        if (config.sameUserAsId)
            arr.push(this.sameUserAsId());
        return arr;
    }
    /**
     * Ensures that a route can only accessed when a user has a specific role
     * @param role - The minimum required role to access that role {@link Role}
     * @param resources - An array of resources which need to be authorized
     * @param requiredCrud - For individual Permission which is required to execute to the target ressource
     * @returns
     */
    static permissionChecker(ressource, targetedIds = [], requiredCrud) {
        return [...this.requireUserAuthentication(),
            (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                var _b, _c;
                if ((_b = req.requestingUser) === null || _b === void 0 ? void 0 : _b.isSuperAdmin)
                    return next();
                const allRelations = yield RelationBDTO_1.default.findAll();
                const usersPermissions = yield RelationBDTO_1.default.getUsersPermissions((_c = req.requestingUser) === null || _c === void 0 ? void 0 : _c._id);
                req.requestingUser.permissions = usersPermissions;
                const method = req.method.toUpperCase();
                let crudPermission = requiredCrud || HTTP_METHODS_CRUD_MAPPER[method];
                const userIsInGroups = (yield RelationBDTO_1.default.findAll()).filter((relation) => { var _b; return relation.toId === ((_b = req.requestingUser) === null || _b === void 0 ? void 0 : _b._id) && relation.fromType === 'group'; });
                let allowedAction = false;
                for (const userIsInGroup of userIsInGroups) {
                    const groupHasRoleRelation = allRelations.find((relation) => relation.fromId === userIsInGroup.fromId && relation.toType === 'role');
                    const groupRole = yield RoleDAO_1.default.findById(groupHasRoleRelation.toId);
                    let currentCrudPermissions = groupRole.resourcePermissions[ressource];
                    if ((currentCrudPermissions & crudPermission) === crudPermission) {
                        allowedAction = true;
                        break;
                    }
                }
                if (!allowedAction) {
                    return next({ status: 403, message: `Not sufficient group-permissions to execute: ${req.url} (${method.toUpperCase()})` });
                }
                for (const targetedId of targetedIds) {
                    let id = targetedId.in === 'path' ? req.params[targetedId.name] : req.body[targetedId.name];
                    if ((usersPermissions[id] & crudPermission) !== crudPermission) {
                        return next({ status: 403, message: `Not sufficient permissions to execute: ${req.url} (${method.toUpperCase()}) to the ressource ${id}` });
                    }
                }
                return next();
            })
        ];
    }
    /** Normalize a group token by trimming and unifying delimiter spacing */
    static normalizeGroupToken(raw) {
        return (raw || '').replace(/\s*_\s*/g, config_1.CONFIG.OIDC_GROUP_ROLE_DELIMITER).replace(/\s+/g, ' ').trim();
    }
    /** Parse a single group entry into base displayName and optional suffix role token */
    static parseGroupEntry(entry) {
        const cleaned = this.normalizeGroupToken(entry);
        if (!cleaned)
            return { base: '', suffix: null };
        const delim = config_1.CONFIG.OIDC_GROUP_ROLE_DELIMITER;
        const lastIdx = cleaned.lastIndexOf(delim);
        if (lastIdx < 0)
            return { base: cleaned, suffix: null };
        const base = cleaned.substring(0, lastIdx);
        const rawSuffix = cleaned.substring(lastIdx + delim.length);
        return { base: base || cleaned, suffix: rawSuffix || null };
    }
    /** Map suffix token to internal role display name */
    static suffixToInternalRole(suffix) {
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
    }
    /** Ensure a group exists with the given role connected; create if missing */
    static ensureGroupWithRole(displayName, roleName) {
        return __awaiter(this, void 0, void 0, function* () {
            const role = yield RoleDAO_1.default.findByRoleName(roleName);
            const [groups, relations] = yield Promise.all([
                GroupDAO_1.default.findByAttributes({ displayName }),
                RelationBDTO_1.default.findAll()
            ]);
            for (const g of groups) {
                const rel = relations.find(r => r.fromType === 'group' && r.fromId === g._id && r.toType === 'role');
                if (rel && rel.toId === role._id)
                    return g;
            }
            return GroupDAO_1.default.insert(new GroupModel_1.default({ displayName }), { role: role._id });
        });
    }
    /** Ensure the hierarchy Admin -> Instructor -> Learner exists for a base group */
    static ensureHierarchy(groupsByRole) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /** Parse the claim and synchronize user's memberships */
    static syncGroupsAndMembershipsFromClaims(userId, groupsRaw) {
        return __awaiter(this, void 0, void 0, function* () {
            // Keep displayName exactly as in token; only normalize for parsing role/base
            const items = (groupsRaw || '').split(',').map(s => s.trim()).filter(Boolean);
            const baseToRoleName = new Map();
            for (const raw of items) {
                const { base, suffix } = this.parseGroupEntry(raw);
                if (!base)
                    continue;
                const role = this.suffixToInternalRole(suffix);
                if (!baseToRoleName.has(base))
                    baseToRoleName.set(base, new Map());
                baseToRoleName.get(base).set(role, raw);
            }
            const desired = [];
            for (const [base, roleNameMap] of baseToRoleName.entries()) {
                const groupsByRole = {};
                const roles = roleNameMap.size > 0
                    ? Array.from(roleNameMap.keys())
                    : ['Learner'];
                for (const r of roles) {
                    const displayName = roleNameMap.get(r) || base;
                    const g = yield this.ensureGroupWithRole(displayName, r);
                    groupsByRole[r] = g;
                    desired.push(g._id);
                }
                yield this.ensureHierarchy(groupsByRole);
            }
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
exports.AuthGuard = AuthGuard;
_a = AuthGuard;
/**
 * Force api-token authentication
 * @param excluded - Array of strings which exclude certain routes to be checked against authoriziation
 * @returns
 */
AuthGuard.requireAPIToken = (excluded) => {
    return ([_a.isAPITokenAuthenticated(excluded), _a.isAPITokenAuthorized()]);
};
AuthGuard.isAPITokenAuthenticated = (excluded) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let requestUrl = req.url.endsWith('/')
        ? req.originalUrl.slice(0, -1)
        : req.originalUrl;
    const regex = /\?.+/;
    requestUrl = requestUrl.replace(regex, '').trim();
    requestUrl = requestUrl.replace(/\./g, '');
    requestUrl = requestUrl.replace(/=/g, '');
    const match = excluded === null || excluded === void 0 ? void 0 : excluded.find((path) => new url_pattern_1.default(path).match(requestUrl));
    if (match) {
        req.byPass = true;
        return next();
    }
    const bearerOrBasic = req.get('Authorization');
    if (!bearerOrBasic)
        return next({ status: 400, message: `Authorization header has to be present!` });
    let [format, value] = bearerOrBasic.split(' ');
    if (format === 'Basic') {
        let [username, password] = Buffer.from(value, 'base64').toString('utf-8').split(':');
        value = username || password;
    }
    else if (format !== 'Bearer') {
        return next({ status: 400, message: `Invalid auth-scheme. Allowed are: [Bearer, Basic]` });
    }
    if (!value)
        return next({ status: 400, message: `API-Token cannot be empty or undefined!` });
    try {
        const token = yield ConsumerDAO_1.default.findById(value);
        req.apiToken = token;
        return next();
    }
    catch (err) {
        if (err.status === 404)
            return next({ message: `Invalid API-Token`, status: 400 });
        return next(err);
    }
});
AuthGuard.isAPITokenAuthorized = () => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        if (req.byPass)
            return next();
        let method = req.method;
        let requestUrl = req.url.endsWith('/')
            ? req.originalUrl.slice(0, -1)
            : req.originalUrl;
        //query-param
        requestUrl = requestUrl.replace(/\?.+/, '').trim();
        requestUrl = requestUrl.replace(/\./g, '');
        requestUrl = requestUrl.replace('@', '');
        try {
            let match = (_b = req.apiToken.paths) === null || _b === void 0 ? void 0 : _b.map((path) => [new url_pattern_1.default(path.route), path.scope]).find(([pattern, scope]) => pattern.match(requestUrl) && scope.includes(method.toUpperCase()));
            if (match)
                return next();
            return next({ status: 403, message: `Not sufficient permission or route does not exist: ${requestUrl} (${method.toUpperCase()})` });
        }
        catch (err) {
            return next(err);
        }
    });
};
/**
 * Require super-admin to access certain routes
 * @returns
 */
AuthGuard.requireAdminUser = () => {
    return [..._a.requireUserAuthentication(), (req, res, next) => {
            var _b;
            if (!((_b = req.requestingUser) === null || _b === void 0 ? void 0 : _b.isSuperAdmin))
                return next({ status: 400, message: `Not admin user!` });
            return next();
        }];
};
AuthGuard.sameUserAsId = () => {
    return (req, res, next) => {
        var _b, _c;
        if (((_b = req.requestingUser) === null || _b === void 0 ? void 0 : _b._id) !== req.params.id && !((_c = req.requestingUser) === null || _c === void 0 ? void 0 : _c.isSuperAdmin))
            return next({ message: 'Cannot access another user!', status: 400 });
        return next();
    };
};
