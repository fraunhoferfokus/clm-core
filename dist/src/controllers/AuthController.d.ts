import express from 'express';
declare class AuthController {
    router: express.Router;
    constructor();
    configureRoutes(): void;
    authenticateUser: express.Handler;
    refreshSession: express.Handler;
}
declare const controller: AuthController;
export default controller;
//# sourceMappingURL=AuthController.d.ts.map