import BaseFrontendDTO, { iBaseFrontendDTO } from "../BaseFrontendDTO";
import { RessourcePermissions, RoleNames } from "./RoleModel";
interface iRoleDTO extends iBaseFrontendDTO {
    lineage: boolean;
    resourcePermissions: RessourcePermissions;
    displayName: RoleNames;
    strength: number;
}
export default class RoleFrontendDTO extends BaseFrontendDTO implements iRoleDTO {
    constructor(paylaod: iRoleDTO);
    resourcePermissions: RessourcePermissions;
    displayName: RoleNames;
    strength: number;
    lineage: boolean;
}
export {};
//# sourceMappingURL=RoleFDTO.d.ts.map