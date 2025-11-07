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
    /**
     * Time when the refresh token expires
     */
    REFRESH_EXPIRATION: string;
    /**
     * Time when the access token expires
     */
    ACCESS_EXPIRATION: string;
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