import BaseDAO from "../BaseDAO";
import OIDCStateModel from "./OIDCStateModel";
declare class OIDCStateDAO extends BaseDAO<OIDCStateModel> {
    consume(state: string): Promise<OIDCStateModel | undefined>;
    purgeExpired(): Promise<number>;
}
declare const _default: OIDCStateDAO;
export default _default;
//# sourceMappingURL=OIDCStateDAO.d.ts.map