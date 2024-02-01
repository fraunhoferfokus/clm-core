import BaseBackendDTO from "../BaseBackendDTO";
import GroupModel from "./GroupModel";
/**
 * @public
 * Backend DTO for user. Based on {@link GroupModel}
 * The instance {@link groupBDTOInstance} is provided.
 * Uses as default {@link MariaAdapter} for persistence layer
 */
export declare class GroupBDTO extends BaseBackendDTO<GroupModel> {
}
/**
 * @public
 * Instance of {@link GroupBDTO}.
 * Uses as default {@link MariaAdapter} for persistence layer
 */
export declare const groupBDTOInstance: GroupBDTO;
//# sourceMappingURL=GroupBDTO.d.ts.map