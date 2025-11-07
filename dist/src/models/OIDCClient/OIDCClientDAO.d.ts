import BaseDAO from "../BaseDAO";
import OIDCClientModel from "./OIDCClientModel";
declare class OIDCClientDAO extends BaseDAO<OIDCClientModel> {
    /**
     * Find OIDC client by client_id
     */
    findByClientId(client_id: string): Promise<OIDCClientModel | undefined>;
    /**
     * Get all active OIDC clients
     */
    findAllActive(): Promise<OIDCClientModel[]>;
}
declare const _default: OIDCClientDAO;
export default _default;
//# sourceMappingURL=OIDCClientDAO.d.ts.map