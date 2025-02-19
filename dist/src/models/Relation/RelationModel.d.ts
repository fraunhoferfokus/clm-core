import BaseDatamodel, { iBaseDatamodel } from "../BaseDatamodel";
/**
 * @public
 * The payload which is passed to the constructor of {@link RelationModel}
 */
export interface iRelationModel extends iBaseDatamodel {
    /**
    * The id of the from node
    */
    fromId: string;
    /**
         * The id of the to node
         */
    toId: string;
    /**
    * The type of the from node
    */
    fromType: string;
    /**
   * The type of the to node
   */
    toType: string;
    /**
     * The order of the relation
     */
    order?: number;
    /**
     *
     */
    relationType?: string;
}
/**
 * @public
 * Relation datamodel which is used by {@link RelationBDTO}
 */
export default class RelationModel extends BaseDatamodel implements iRelationModel {
    fromId: string;
    toId: string;
    fromType: string;
    toType: string;
    order?: number;
    constructor(payload: iRelationModel);
    relationType: string;
}
//# sourceMappingURL=RelationModel.d.ts.map