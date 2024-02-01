import express from 'express';
import { UserModel } from '../lib/CoreLib';
declare class OIDController {
    router: express.Router;
    constructor();
    init(): void;
    brokerLogout: express.Handler;
    brokerLogoutRedirect: express.Handler;
    ssoLanding: express.Handler;
    ssoBackendLogin: express.Handler;
    codeAuthFlow: (code: string) => Promise<{
        user: UserModel;
        access_token: any;
        refresh_token: any;
        expires_in: any;
        refresh_expires_in: any;
    }>;
    getAccessTokenByCode: express.Handler;
    ssoSuccess: express.Handler;
}
declare const _default: OIDController;
export default _default;
//# sourceMappingURL=OIDCController.d.ts.map