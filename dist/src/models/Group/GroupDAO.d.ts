import BaseDAO from "../BaseDAO";
import GroupModel from './GroupModel';
declare class GroupDAO extends BaseDAO<GroupModel> {
    insert(model: GroupModel, payload?: {
        [key: string]: any;
    }): Promise<GroupModel>;
    deleteById(id: string): Promise<boolean>;
}
declare const _default: GroupDAO;
export default _default;
//# sourceMappingURL=GroupDAO.d.ts.map