import BaseBackendDTO from "../BaseBackendDTO";
import RoleDAO from "./RoleDAO";
import { RoleModel } from "./RoleModel";

class RoleBDTO extends BaseBackendDTO<RoleModel> {

}

export const roleBDTOInstance = new RoleBDTO(RoleDAO)