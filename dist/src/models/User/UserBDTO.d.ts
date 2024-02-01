import BaseBackendDTO from "../BaseBackendDTO";
import { UserModel } from "./UserModel";
/**
 * @public
 * Backend DTO for user. Based on {@link UserModel}
 * The instance {@link userBDTOInstance} is provided.
 * Uses as default {@link MariaAdapter} for persistence layer
*/
export declare class UserBDTO extends BaseBackendDTO<UserModel> {
    insert(payload: UserModel): Promise<UserModel>;
}
/**
 * @public
 * Instance of {@link UserBDTO}.
 * Uses as default {@link MariaAdapter} for persistence layer.
 */
export declare const userBDTOInstance: UserBDTO;
//# sourceMappingURL=UserBDTO.d.ts.map