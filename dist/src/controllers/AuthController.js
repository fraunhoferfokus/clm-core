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
            var _a, _b;
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
                    return res.json({
                        access_token: idp_access_token,
                        expires_in: response.data.expires_in
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
                    status: ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) || 401,
                    message: ((_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.data) || 'IdP validation error with provided token...'
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
}
const controller = new AuthController();
controller.configureRoutes();
exports.default = controller;
