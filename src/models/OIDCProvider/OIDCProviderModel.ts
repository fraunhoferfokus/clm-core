/* -
 * Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 * All rights reserved.
 *
 * For more information please contact:
 * Fraunhofer FOKUS
 * Kaiserin-Augusta-Allee 31
 * 10589 Berlin, Germany
 * https://www.fokus.fraunhofer.de/go/fame
 * famecontact@fokus.fraunhofer.de
 * -
 */

import BaseDatamodel, { iBaseDatamodel } from '../BaseDatamodel'

/**
 * @public
 * The payload which is passed to the constructor of {@link OIDCProviderModel}
 */
export interface iOIDCProviderModel extends iBaseDatamodel {
    /** Authorization endpoint URL */
    authorization_endpoint: string
    /** Token endpoint URL */
    token_endpoint: string
    /** End session (logout) endpoint URL */
    end_session_endpoint?: string
    /** Userinfo endpoint URL */
    userinfo_endpoint?: string
    /** JWKS URI for signature verification */
    jwks_uri?: string
    /** Client ID for this CLM instance at the provider */
    client_id: string
    /** Client secret for this CLM instance at the provider */
    client_secret: string
    /** Issuer identifier (for token validation) */
    issuer?: string
    /** Display name for UI */
    displayName: string
    /** Whether this provider is active */
    active: boolean
}

/**
 * OIDC Provider datamodel which is used by {@link OIDCProviderDAO}
 * @public
 */
export default class OIDCProviderModel extends BaseDatamodel implements iOIDCProviderModel {
    authorization_endpoint: string
    token_endpoint: string
    end_session_endpoint?: string
    userinfo_endpoint?: string
    jwks_uri?: string
    client_id: string
    client_secret: string
    issuer?: string
    displayName: string
    active: boolean

    constructor(payload: iOIDCProviderModel) {
        super(payload)
        this.authorization_endpoint = payload.authorization_endpoint
        this.token_endpoint = payload.token_endpoint
        this.end_session_endpoint = payload.end_session_endpoint
        this.userinfo_endpoint = payload.userinfo_endpoint
        this.jwks_uri = payload.jwks_uri
        this.client_id = payload.client_id
        this.client_secret = payload.client_secret
        this.issuer = payload.issuer
        this.displayName = payload.displayName
        this.active = payload.active !== undefined ? payload.active : true
    }
}
