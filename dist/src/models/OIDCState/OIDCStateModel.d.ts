import BaseDatamodel, { iBaseDatamodel } from "../BaseDatamodel";
export interface iOIDCStateModel extends iBaseDatamodel {
    state: string;
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    expiresAt: Date;
    consumedAt?: Date;
}
export declare class OIDCStateModel extends BaseDatamodel implements iOIDCStateModel {
    state: string;
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    expiresAt: Date;
    consumedAt?: Date;
    constructor(payload: Partial<iOIDCStateModel> & {
        state: string;
    });
}
export default OIDCStateModel;
//# sourceMappingURL=OIDCStateModel.d.ts.map