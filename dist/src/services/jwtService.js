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
exports.jwtServiceInstance = exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const axios_1 = __importDefault(require("axios"));
const OIDC_PROVIDER = config_1.CONFIG.OIDC_PROVIDERS;
/**
 * Service for creating access/refresh token for user and verify if a token is valid
 * @public
 */
class JwtService {
    constructor() {
        /**
         * Time when the refresh token expires
         */
        this.REFRESH_EXPIRATION = '3d';
        /**
         * Time when the access token expires
         */
        this.ACCESS_EXPIRATION = '3h';
        /**
         * Secret for verifying or creating signature for jwt
         * @defaultValue secret
         */
        this.SECRET = `${config_1.CONFIG.TOKEN_SECRET}` || "secret";
    }
    /**
     * Verify a token
     * @param token - Token to verify (which is usually provided by means of REST communication)
     * @param secret - The secret to test verify against
     */
    verifyToken(token, secret = this.SECRET) {
        return __awaiter(this, void 0, void 0, function* () {
            let decoded = jsonwebtoken_1.default.decode(token);
            let iss = decoded.iss;
            if (iss !== config_1.CONFIG.DEPLOY_URL) {
                const provider = OIDC_PROVIDER.find((provider) => provider.authorization_endpoint.includes(iss));
                if (!provider)
                    throw ({ message: `Invalid issuer: ${iss}! `, status: 401 });
                // get userinformation from provider
                yield axios_1.default.get(provider.userinfo_endpoint, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return decoded;
            }
            else {
                try {
                    const decodedToken = yield new Promise((resolve, reject) => {
                        jsonwebtoken_1.default.verify(token, secret, function (err, decoded) {
                            if (err)
                                reject({ message: "Token not valid or expired", status: 400 });
                            return resolve(decoded);
                        });
                    });
                    return decodedToken;
                }
                catch (err) {
                    throw err;
                }
            }
        });
    }
    /**
     * Create a token (consumed by {@link JwtService.createAccessAndRefreshToken})
     * @param payload - {@link TokenPayload}
     * @param expiration - Expiration of the token
     * @param secret - Secret to create signature for token
     * @returns The token to be used by the client to authenticate a specific user against REST services
     */
    createToken(payload, expiration = this.ACCESS_EXPIRATION, secret = this.SECRET) {
        return new Promise((resolve, reject) => {
            jsonwebtoken_1.default.sign({
                _id: payload._id,
            }, secret, {
                expiresIn: expiration, subject: payload._id, issuer: config_1.CONFIG.DEPLOY_URL
            }, function (err, token) {
                if (err)
                    return reject(err);
                return resolve(token);
            });
        });
    }
    /**
     * Create access- and refresh-token
     * @param payload - {@link TokenPayload}
     * @returns The access-token and refresh-token
     */
    createAccessAndRefreshToken(payload) {
        return Promise.all([
            this.createToken(payload, this.ACCESS_EXPIRATION),
            this.createToken(payload, this.REFRESH_EXPIRATION, this.SECRET + payload.password)
        ]);
    }
}
exports.JwtService = JwtService;
/**
 * @public
 * Instance of {@link JwtService}
 */
exports.jwtServiceInstance = new JwtService();
