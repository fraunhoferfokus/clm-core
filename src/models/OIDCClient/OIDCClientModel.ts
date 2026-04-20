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
