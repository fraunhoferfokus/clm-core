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
const config_1 = require("../config/config");
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const CoreLib_1 = require("../lib/CoreLib");
const crypto_1 = require("crypto");
// get executing diretory of node-process
const OIDC_PROVIDER = config_1.CONFIG.OIDC_PROVIDERS;
const OIDC_CLIENTS = config_1.CONFIG.ODIC_CLIENTS;
const firstProvider = OIDC_PROVIDER[0];
let authorization_endpoint, token_endpoint, client_id, client_secret, end_session_endpoint, userinfo_endpoint;
if (firstProvider) {
    [authorization_endpoint, token_endpoint, client_id, client_secret, end_session_endpoint, userinfo_endpoint] = [firstProvider.authorization_endpoint, firstProvider.token_endpoint, firstProvider.client_id, firstProvider.client_secret, firstProvider.end_session_endpoint, firstProvider.userinfo_endpoint];
}
let oidc_state = {};
class OIDController {
    constructor() {
        this.brokerLogout = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { post_logout_redirect_uri: oidc_client_post_logout_redirect_uri, client_id: odic_client_client_id } = req.query;
                if (!oidc_client_post_logout_redirect_uri || !odic_client_client_id)
                    return next({ status: 400, message: 'post_logout_redirect_uri, client_id required' });
                const oidc_client = OIDC_CLIENTS.find((oidc_client) => oidc_client.client_id === odic_client_client_id);
                if (!oidc_client.valid_redirect_uris.includes(oidc_client_post_logout_redirect_uri))
                    return next({ status: 400, message: 'Invalid post_logout_redirect_uri' });
                let broker_post_logout_uri = config_1.CONFIG.DEPLOY_URL + '/core/sso/oidc/broker/logout/redirect';
                const url = new URL(end_session_endpoint);
                url.searchParams.set('state', (0, crypto_1.randomUUID)());
                url.searchParams.append('response_type', 'code');
                url.searchParams.append('scope', 'openid');
                url.searchParams.append('client_id', client_id);
                url.searchParams.append('post_logout_redirect_uri', broker_post_logout_uri);
                oidc_state[url.searchParams.get('state')] = {
                    post_logout_redirect_uri: oidc_client_post_logout_redirect_uri,
                };
                return res.redirect(url.toString());
            }
            catch (err) {
                return next(err);
            }
        });
        this.brokerLogoutRedirect = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { state } = req.query;
                const oidc_client = oidc_state[state];
                if (!oidc_client)
                    return next({ status: 400, message: 'Invalid state' });
                const { post_logout_redirect_uri } = oidc_client;
                return res.redirect(post_logout_redirect_uri);
            }
            catch (err) {
                return next(err);
            }
        });
        this.ssoLanding = (req, res, next) => {
            try {
                const { client_id: oidc_client_id, scope: oidc_client_scope, redirect_uri: oidc_redirect_uri } = req.query;
                if (oidc_client_id || oidc_client_scope || oidc_redirect_uri) {
                    if (!oidc_client_id || !oidc_client_scope || !oidc_redirect_uri)
                        return res.status(400).json({
                            message: 'client_id, scope, redirect_uri required'
                        });
                    let oidc_client = OIDC_CLIENTS.find((oidc_client) => oidc_client.client_id === oidc_client_id);
                    if (oidc_client) {
                        let valid_redirect_uri = oidc_client.valid_redirect_uris.find((valid_redirect_uri) => valid_redirect_uri === oidc_redirect_uri);
                        let state = (0, crypto_1.randomUUID)();
                        oidc_state[state] = { redirect_uri: oidc_redirect_uri };
                        if (valid_redirect_uri) {
                            const oidc_url = `${authorization_endpoint}?response_type=code&client_id=${client_id}&scope=openid&redirect_uri=${config_1.CONFIG.DEPLOY_URL}/core/sso/oidc/backend/login&state=${state}`;
                            return res.redirect(oidc_url);
                        }
                        return res.status(500).json({
                            message: 'Invalid redirect_uri'
                        });
                    }
                    else {
                        return res.status(500).json({
                            message: 'Invalid client_id'
                        });
                    }
                }
                const oidc_url = `${authorization_endpoint}?response_type=code&client_id=${client_id}&scope=openid&redirect_uri=${config_1.CONFIG.DEPLOY_URL}/core/sso/oidc/backend/login`;
                if (firstProvider) {
                    return res.render('login', {
                        oidc_url
                    });
                }
                return res.status(500).json({
                    message: 'No OIDC Provider configured'
                });
            }
            catch (err) {
                return res.status(err.status || 500).json({
                    message: err.message || err
                });
            }
        };
        this.ssoBackendLogin = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { state } = req.query;
                const { code } = req.query;
                if (state) {
                    const oidc_client = oidc_state[state];
                    if (!oidc_client)
                        return res.status(400).json({
                            message: 'Invalid state'
                        });
                    const { redirect_uri } = oidc_client;
                    delete oidc_state[state];
                    return res.redirect(`${redirect_uri}?code=${code}`);
                }
                // let full_logout_endpoint = `${lougout_endpoint}?response_type=code&scope=openid&client_id=${process.env.KEYCLOAK_CLIENT_ID}&id_token_hint=${id_token_hint}&post_logout_redirect_uri=${post_logout_redirect_uri}`
                let { access_token: idp_access_token, refresh_token: idp_refresh_token, expires_in: idp_access_token_expires_in, refresh_expires_in: idp_refresh_token_expires_in, user } = yield this.codeAuthFlow(code);
                const [accessToken, refreshToken] = yield CoreLib_1.jwtServiceInstance.createAccessAndRefreshToken(user);
                let decodedA = jsonwebtoken_1.default.decode(accessToken);
                let decodedR = jsonwebtoken_1.default.decode(refreshToken);
                let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
                let refreshTokenExpiresIn = new Date(1000 * decodedR.exp).toJSON();
                return res.redirect(`${config_1.CONFIG.DEPLOY_URL}/core/sso/oidc/success?id=${user._id}&access_token_expires_in=${accessTokenExpiresIn}&refresh_token_expires_in=${refreshTokenExpiresIn}&idp_access_token=${idp_access_token}&idp_refresh_token=${idp_refresh_token}&idp_access_token_expires_in=${idp_access_token_expires_in}&idp_refresh_token_expires_in=${idp_refresh_token_expires_in}
                `);
            }
            catch (err) {
                return res.status(err.status || 500).json({
                    message: err.message || err
                });
            }
        });
        this.codeAuthFlow = (code) => __awaiter(this, void 0, void 0, function* () {
            try {
                const keycloak_response = yield (0, axios_1.default)(token_endpoint, {
                    method: 'POST',
                    data: {
                        grant_type: 'authorization_code',
                        client_id,
                        client_secret,
                        code,
                        redirect_uri: `${config_1.CONFIG.DEPLOY_URL}/core/sso/oidc/backend/login`
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                const { access_token, refresh_token, expires_in, refresh_expires_in, } = keycloak_response.data;
                // get sub from access token
                const decoded = jsonwebtoken_1.default.decode(access_token);
                let user;
                user = (yield UserDAO_1.default.findByAttributes({
                    identityId: decoded === null || decoded === void 0 ? void 0 : decoded.sub
                }))[0];
                if (!user)
                    user = yield UserDAO_1.default.insert(new CoreLib_1.UserModel({
                        isVerified: true,
                        password: (0, crypto_1.randomUUID)(),
                        familyName: decoded === null || decoded === void 0 ? void 0 : decoded.sub,
                        givenName: decoded === null || decoded === void 0 ? void 0 : decoded.sub,
                        email: decoded === null || decoded === void 0 ? void 0 : decoded.sub,
                        identityId: decoded === null || decoded === void 0 ? void 0 : decoded.sub,
                    }));
                return {
                    user,
                    access_token,
                    refresh_token,
                    expires_in,
                    refresh_expires_in
                };
            }
            catch (err) {
                throw err;
            }
        });
        this.getAccessTokenByCode = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { code, client_id, client_secret, redirect_uri } = req.body;
                if (!client_id || !client_secret || !redirect_uri)
                    return res.status(400).json({
                        message: 'client_id, client_secret, redirect_uri required'
                    });
                let oidc_client = OIDC_CLIENTS.find((oidc_client) => oidc_client.client_id === client_id);
                if (!oidc_client)
                    return res.status(400).json({
                        message: 'Invalid client_id'
                    });
                if (!oidc_client.valid_redirect_uris.includes(redirect_uri))
                    return res.status(400).json({
                        message: 'Invalid redirect_uri'
                    });
                if (oidc_client.client_secret !== client_secret)
                    return res.status(400).json({
                        message: 'Invalid client_secret'
                    });
                const { access_token, refresh_token, expires_in, refresh_expires_in } = yield this.codeAuthFlow(code);
                return res.json({
                    access_token,
                    refresh_token,
                    expires_in,
                    refresh_expires_in
                });
            }
            catch (err) {
                console.error((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data);
                return next(err);
            }
        });
        this.ssoSuccess = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, idp_access_token, idp_refresh_token, idp_access_token_expires_in, idp_refresh_token_expires_in } = req.query;
                const user = yield UserDAO_1.default.findById(id);
                // return res.json({
                //     access_token,
                //     user,
                //     idp_access_token,
                //     idp_refresh_token
                // })
                let gateway_url = config_1.CONFIG.DEPLOY_URL.includes('localhost') ? 'http://gateway/api' : config_1.CONFIG.DEPLOY_URL;
                const course_structure_url = `${gateway_url}/learningObjects/users/${user._id}/courses`;
                const course_structure = (yield axios_1.default.get(course_structure_url, {
                    headers: {
                        Authorization: `Bearer MGMT_SERVICE`,
                        'x-access-token': idp_access_token
                    }
                })).data;
                return res.render('success', {
                    access_token: idp_access_token,
                    access_token_expires_in: idp_access_token_expires_in,
                    refresh_token: idp_refresh_token,
                    refresh_token_expires_in: idp_refresh_token_expires_in,
                    course_structure,
                    user,
                    end_session_endpoint: end_session_endpoint + '?post_logout_redirect_uri=' + config_1.CONFIG.DEPLOY_URL + '/core/sso/oidc' + '&client_id=' + client_id
                });
            }
            catch (err) {
                return res.status(err.status || 500).json({
                    message: err.message || err
                });
            }
        });
        this.router = express_1.default.Router();
        this.init();
    }
    init() {
        this.router.use((express_1.default.urlencoded({ extended: true })));
        this.router.get('/', this.ssoLanding);
        this.router.get('/backend/login', this.ssoBackendLogin);
        this.router.get('/success', this.ssoSuccess);
        this.router.post('/access_token_by_code', this.getAccessTokenByCode);
        this.router.get('/broker/logout', this.brokerLogout);
        this.router.get('/broker/logout/redirect', this.brokerLogoutRedirect);
    }
}
exports.default = new OIDController();
