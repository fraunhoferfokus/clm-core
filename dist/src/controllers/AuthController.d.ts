import express from 'express';
declare class AuthController {
    router: express.Router;
    constructor();
    configureRoutes(): void;
    authenticateUser: express.Handler;
    refreshSession: express.Handler;
    /**
     * Synchronize groups/memberships for a user based on a raw groups claim string.
     * displayName is kept exactly as provided by the token; hierarchy is built by base name.
     */
    private syncGroupsAndMembershipsFromClaims;
}
declare const controller: AuthController;
export default controller;
//# sourceMappingURL=AuthController.d.ts.map