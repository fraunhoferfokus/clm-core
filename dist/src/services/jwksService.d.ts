interface OIDCProviderConfig {
    authorization_endpoint: string;
    token_endpoint?: string;
    end_session_endpoint?: string;
    userinfo_endpoint?: string;
    jwks_uri?: string;
    issuer?: string;
}
export declare function getSigningKey(kid: string, provider: OIDCProviderConfig): Promise<string>;
export declare function verifyExternalToken(token: string): Promise<unknown>;
export declare function _clearJwksCache(): void;
export {};
//# sourceMappingURL=jwksService.d.ts.map