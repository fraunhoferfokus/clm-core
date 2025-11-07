import BaseDAO from "../BaseDAO";
import { UserModel } from "./UserModel";
declare class UserDAO extends BaseDAO<UserModel> {
    insert(payload: UserModel): Promise<UserModel>;
    deleteById(id: string): Promise<boolean>;
}
declare const _default: UserDAO;
export default _default;
//# sourceMappingURL=UserDAO.d.ts.map