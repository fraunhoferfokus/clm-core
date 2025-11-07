import BaseDatamodel, { iBaseDatamodel } from '../BaseDatamodel';
/**
 * @public
 * The payload which is passed to the constructor of {@link PathModel}
 */
export interface iPathModel extends iBaseDatamodel {
    route: string;
}
/**
 * Path datamodel which is used by {@link PathBDTO}
 * @public
 */
export default class PathModel extends BaseDatamodel implements iPathModel {
    route: string;
    constructor(payload: iPathModel);
}
//# sourceMappingURL=PathModel.d.ts.map