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