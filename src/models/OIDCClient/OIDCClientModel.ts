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
 * The payload which is passed to the constructor of {@link OIDCClientModel}
 */
export interface iOIDCClientModel extends iBaseDatamodel {
    /** Unique client identifier */
    client_id: string
    /** Client secret for authentication */
    client_secret: string
    /** Array of valid redirect URIs for this client */
    valid_redirect_uris: string[]
    /** Optional JWKS URI for this client (if not provided, uses global provider jwks_uri) */
    jwks_uri?: string
    /** Display name for UI */
    displayName: string
    /** Whether this client is active */
    active: boolean
}

/**
 * OIDC Client datamodel which is used by {@link OIDCClientDAO}
 * @public
 */
export default class OIDCClientModel extends BaseDatamodel implements iOIDCClientModel {
    client_id: string
    client_secret: string
    valid_redirect_uris: string[]
    jwks_uri?: string
    displayName: string
    active: boolean

    constructor(payload: iOIDCClientModel) {
        super(payload)
        this.client_id = payload.client_id
        this.client_secret = payload.client_secret
        this.valid_redirect_uris = payload.valid_redirect_uris || []
        this.jwks_uri = payload.jwks_uri
        this.displayName = payload.displayName
        this.active = payload.active !== undefined ? payload.active : true
    }
}
