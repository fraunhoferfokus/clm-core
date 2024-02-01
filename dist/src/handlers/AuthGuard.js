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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const url_pattern_1 = __importDefault(require("url-pattern"));
const RelationBDTO_1 = __importDefault(require("../models/Relation/RelationBDTO"));
const ConsumerDAO_1 = __importDefault(require("../models/ServiceConsumer/ConsumerDAO"));
const UserBDTO_1 = require("../models/User/UserBDTO");
const jwtService_1 = require("../services/jwtService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const axios_1 = __importDefault(require("axios"));
const RoleDAO_1 = __importDefault(require("../models/Role/RoleDAO"));
const OIDC_PROVIDER = config_1.CONFIG.OIDC_PROVIDERS;
let HTTP_METHODS_CRUD_MAPPER = {
    GET: 1,
    POST: 2,
    PUT: 4,
    PATCH: 4,
    DELETE: 8,
};
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
                    if (iss !== config_1.CONFIG.DEPLOY_URL) {
                        const provider = OIDC_PROVIDER.find((provider) => provider.authorization_endpoint.includes(iss));
                        if (!provider)
                            return next({ message: `Invalid issuer: ${iss}! `, status: 401 });
                        // get userinformation from provider
                        yield axios_1.default.get(provider.userinfo_endpoint, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }).catch((err) => {
                            var _b, _c;
                            console.error(err);
                            return next({ status: ((_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.status) || 401, message: ((_c = err === null || err === void 0 ? void 0 : err.response) === null || _c === void 0 ? void 0 : _c.data) || 'IdP validation error with provided token...' });
                        });
                    }
                    else {
                        yield jwtService_1.jwtServiceInstance.verifyToken(token);
                    }
                    let user = yield UserBDTO_1.userBDTOInstance.findById(decoded.sub);
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
     * @returns
     */
    static permissionChecker(ressource, targetedIds = []) {
        return [...this.requireUserAuthentication(),
            (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                var _b, _c;
                if ((_b = req.requestingUser) === null || _b === void 0 ? void 0 : _b.isSuperAdmin)
                    return next();
                const allRelations = yield RelationBDTO_1.default.findAll();
                const usersPermissions = yield RelationBDTO_1.default.getUsersPermissions((_c = req.requestingUser) === null || _c === void 0 ? void 0 : _c._id);
                req.requestingUser.permissions = usersPermissions;
                const method = req.method.toUpperCase();
                let crudPermission = HTTP_METHODS_CRUD_MAPPER[method];
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
