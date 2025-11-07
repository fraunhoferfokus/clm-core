import BaseDatamodel, { iBaseDatamodel } from "../BaseDatamodel";
/**
 * @public
 * The payload which is passed to the constructor of {@link GroupModel}
 */
export interface iGroupModel extends iBaseDatamodel {
    /**
     * The name the group should be called (frontend)
     */
    displayName: string;
}
/**
 * Group datamodel which is used by {@link GroupBDTO}
 * @public
 */
export default class GroupModel extends BaseDatamodel implements iGroupModel {
    /**
     *
     * {@inheritDoc iGroupModel.displayName}
     */
    displayName: string;
    constructor(payload: iGroupModel);
}
//# sourceMappingURL=GroupModel.d.ts.map