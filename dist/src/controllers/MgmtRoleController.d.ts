import RoleDAO from "../models/Role/RoleDAO";
import RoleFrontendDTO from "../models/Role/RoleFDTO";
import { RoleModel } from "../models/Role/RoleModel";
import BaseModelController from "./BaseModelController";
declare class MgmtRoleController extends BaseModelController<typeof RoleDAO, RoleModel, RoleFrontendDTO> {
}
declare const controller: MgmtRoleController;
export default controller;
//# sourceMappingURL=MgmtRoleController.d.ts.map