import BaseDAO from "../BaseDAO";
import { RoleModel, RoleNames } from "./RoleModel";
declare class RoleDAO extends BaseDAO<RoleModel> {
    findByRoleName(roleName: RoleNames): Promise<RoleModel>;
}
declare const _default: RoleDAO;
export default _default;
//# sourceMappingURL=RoleDAO.d.ts.map