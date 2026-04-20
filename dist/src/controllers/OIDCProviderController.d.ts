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
import express from 'express';
/**
 * Controller for managing OIDC providers in the database
 */
declare class OIDCProviderController {
    router: express.Router;
    constructor();
    init(): void;
    /**
     * GET /core/mgmt/oidc-providers
     * Fetch all OIDC providers
     */
    getAllProviders: express.Handler;
    /**
     * GET /core/mgmt/oidc-providers/:id
     * Fetch a single OIDC provider by id
     */
    getProviderById: express.Handler;
    /**
     * POST /core/mgmt/oidc-providers
     * Create a new OIDC provider
     */
    createProvider: express.Handler;
    /**
     * PUT /core/mgmt/oidc-providers/:id
     * Update an existing OIDC provider
     */
    updateProvider: express.Handler;
    /**
     * DELETE /core/mgmt/oidc-providers/:id
     * Delete an OIDC provider
     */
    deleteProvider: express.Handler;
}
declare const _default: OIDCProviderController;
export default _default;
//# sourceMappingURL=OIDCProviderController.d.ts.map