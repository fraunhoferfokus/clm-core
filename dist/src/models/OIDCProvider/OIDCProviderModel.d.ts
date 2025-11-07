import BaseDatamodel, { iBaseDatamodel } from '../BaseDatamodel';
/**
 * @public
 * The payload which is passed to the constructor of {@link OIDCProviderModel}
 */
export interface iOIDCProviderModel extends iBaseDatamodel {
    /** Authorization endpoint URL */
    authorization_endpoint: string;
    /** Token endpoint URL */
    token_endpoint: string;
    /** End session (logout) endpoint URL */
    end_session_endpoint?: string;
    /** Userinfo endpoint URL */
    userinfo_endpoint?: string;
    /** JWKS URI for signature verification */
    jwks_uri?: string;
    /** Client ID for this CLM instance at the provider */
    client_id: string;
    /** Client secret for this CLM instance at the provider */
    client_secret: string;
    /** Issuer identifier (for token validation) */
    issuer?: string;
    /** Display name for UI */
    displayName: string;
    /** Whether this provider is active */
    active: boolean;
}
/**
 * OIDC Provider datamodel which is used by {@link OIDCProviderDAO}
 * @public
 */
export default class OIDCProviderModel extends BaseDatamodel implements iOIDCProviderModel {
    authorization_endpoint: string;
    token_endpoint: string;
    end_session_endpoint?: string;
    userinfo_endpoint?: string;
    jwks_uri?: string;
    client_id: string;
    client_secret: string;
    issuer?: string;
    displayName: string;
    active: boolean;
    constructor(payload: iOIDCProviderModel);
}
//# sourceMappingURL=OIDCProviderModel.d.ts.map