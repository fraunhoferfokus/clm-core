import BaseDAO from "../BaseDAO";
import OIDCProviderModel from "./OIDCProviderModel";
declare class OIDCProviderDAO extends BaseDAO<OIDCProviderModel> {
    /**
     * Find OIDC provider by issuer
     */
    findByIssuer(issuer: string): Promise<OIDCProviderModel | undefined>;
    /**
     * Get all active OIDC providers
     */
    findAllActive(): Promise<OIDCProviderModel[]>;
}
declare const _default: OIDCProviderDAO;
export default _default;
//# sourceMappingURL=OIDCProviderDAO.d.ts.map