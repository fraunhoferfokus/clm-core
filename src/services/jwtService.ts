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

import jwt, { JwtPayload } from 'jsonwebtoken'
import { CONFIG } from '../config/config';
import axios from 'axios';

const OIDC_PROVIDER = CONFIG.OIDC_PROVIDERS

/**
 * The payload which is passed to the methods {@link JwtService.createToken}, {@link JwtService.createAccessAndRefreshToken}
 * @public
 */
export interface TokenPayload {
    /**
     * Id of the user
     */
    _id: string,
    /**
     * Password of the user as hashed-salt
     */
    password: string
}

/**
 * @public
 *  Object which will be returned by method {@link JwtService.verifyToken}
 */
export interface TokenVerifyResult {
    /**
   * Id of the user
   */
    _id: string
    sub: string

}

/**
 * Service for creating access/refresh token for user and verify if a token is valid
 * @public 
 */

export class JwtService {

    /**
     * Time when the refresh token expires
     */
    REFRESH_EXPIRATION = '3d'
    /**
     * Time when the access token expires
     */
    ACCESS_EXPIRATION = '3h'
    /**
     * Secret for verifying or creating signature for jwt
     * @defaultValue secret
     */
    SECRET = `${CONFIG.TOKEN_SECRET}` || "secret"

    /**
     * Verify a token
     * @param token - Token to verify (which is usually provided by means of REST communication)
     * @param secret - The secret to test verify against 
     */

    async verifyToken(token: string, secret = this.SECRET) {

        let decoded = jwt.decode(token) as JwtPayload
        let iss = decoded.iss
        if (iss !== CONFIG.DEPLOY_URL) {
            const provider = OIDC_PROVIDER.find((provider: any) => provider.authorization_endpoint.includes(iss))
            if (!provider) throw ({ message: `Invalid issuer: ${iss}! `, status: 401 });
            // get userinformation from provider

            await axios.get(provider.userinfo_endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return decoded
        } else {
            try {
                const decodedToken = await (new Promise((resolve, reject) => {
                    jwt.verify(token, secret, function (err: any, decoded: any) {
                        if (err) reject({ message: "Token not valid or expired", status: 400 })
                        return resolve(decoded);
                    })
                }) as Promise<TokenVerifyResult>)
                return decodedToken
            } catch (err) {
                throw err
            }
        }

    }

    /**
     * Create a token (consumed by {@link JwtService.createAccessAndRefreshToken})
     * @param payload - {@link TokenPayload} 
     * @param expiration - Expiration of the token 
     * @param secret - Secret to create signature for token
     * @returns The token to be used by the client to authenticate a specific user against REST services
     */

    createToken(payload: TokenPayload, expiration: string | number = this.ACCESS_EXPIRATION, secret = this.SECRET): Promise<string> {
        return new Promise((resolve, reject) => {
            jwt.sign({
                _id: payload._id,
            }, secret, {
                expiresIn: expiration, subject: payload._id, issuer:
                    CONFIG.DEPLOY_URL
            }, function (err, token) {
                if (err) return reject(err)
                return resolve(token!)
            })
        })
    }

    /**
     * Create access- and refresh-token
     * @param payload - {@link TokenPayload} 
     * @returns The access-token and refresh-token
     */
    createAccessAndRefreshToken(payload: TokenPayload) {
        return Promise.all([
            this.createToken(payload, this.ACCESS_EXPIRATION),
            this.createToken(payload, this.REFRESH_EXPIRATION, this.SECRET + payload.password)
        ]) as Promise<[string, string]>
    }
}


/**
 * @public
 * Instance of {@link JwtService}
 */
export const jwtServiceInstance: JwtService = new JwtService()


