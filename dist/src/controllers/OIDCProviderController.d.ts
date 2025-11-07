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