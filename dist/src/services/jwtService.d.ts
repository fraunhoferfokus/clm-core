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
import jwt from 'jsonwebtoken';
/**
 * The payload which is passed to the methods {@link JwtService.createToken}, {@link JwtService.createAccessAndRefreshToken}
 * @public
 */
export interface TokenPayload {
    /**
     * Id of the user
     */
    _id: string;
    /**
     * Password of the user as hashed-salt
     */
    password: string;
}
/**
 * @public
 *  Object which will be returned by method {@link JwtService.verifyToken}
 */
export interface TokenVerifyResult {
    /**
   * Id of the user
   */
    _id: string;
    sub: string;
}
/**
 * Service for creating access/refresh token for user and verify if a token is valid
 * @public
 */
export declare class JwtService {
    INTERNAL_JWT_ALGORITHMS: jwt.Algorithm[];
    /**
     * Time when the refresh token expires
     */
    REFRESH_EXPIRATION: string;
    /**
     * Time when the access token expires
     */
    ACCESS_EXPIRATION: string;
    REFRESH_SECRET: string;
    /**
     * Secret for verifying or creating signature for jwt
     * @defaultValue secret
     */
    SECRET: string;
    /**
     * Verify a token
     * @param token - Token to verify (which is usually provided by means of REST communication)
     * @param secret - The secret to test verify against
     */
    verifyToken(token: string, secret?: string): Promise<any>;
    /**
     * Create a token (consumed by {@link JwtService.createAccessAndRefreshToken})
     * @param payload - {@link TokenPayload}
     * @param expiration - Expiration of the token
     * @param secret - Secret to create signature for token
     * @returns The token to be used by the client to authenticate a specific user against REST services
     */
    createToken(payload: TokenPayload, expiration?: string | number, secret?: string): Promise<string>;
    /**
     * Create access- and refresh-token
     * @param payload - {@link TokenPayload}
     * @returns The access-token and refresh-token
     */
    createAccessAndRefreshToken(payload: TokenPayload): Promise<[string, string]>;
}
/**
 * @public
 * Instance of {@link JwtService}
 */
export declare const jwtServiceInstance: JwtService;
//# sourceMappingURL=jwtService.d.ts.map