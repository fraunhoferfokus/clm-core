import express from 'express';
/**
 * Controller for managing OIDC clients in the database
 */
declare class OIDCClientController {
    router: express.Router;
    constructor();
    init(): void;
    /**
     * GET /core/mgmt/oidc-clients
     * Fetch all OIDC clients
     */
    getAllClients: express.Handler;
    /**
     * GET /core/mgmt/oidc-clients/:id
     * Fetch a single OIDC client by id
     */
    getClientById: express.Handler;
    /**
     * POST /core/mgmt/oidc-clients
     * Create a new OIDC client
     */
    createClient: express.Handler;
    /**
     * PUT /core/mgmt/oidc-clients/:id
     * Update an existing OIDC client
     */
    updateClient: express.Handler;
    /**
     * DELETE /core/mgmt/oidc-clients/:id
     * Delete an OIDC client
     */
    deleteClient: express.Handler;
}
declare const _default: OIDCClientController;
export default _default;
//# sourceMappingURL=OIDCClientController.d.ts.map