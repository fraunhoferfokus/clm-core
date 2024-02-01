/**
 *  The payload which is passed to the constructor of {@link BaseDatamodel}
 * @public
 */
export interface iBaseDatamodel {
    /**
     * Unique id which identifies the document
     */
    _id?: string;
    /**
     * Couch-DB specific parameter
     */
    _rev?: string;
    /**
     * Time the document was created
     */
    createdAt?: Date;
    /**
     * Time the document was updated
     */
    updatedAt?: Date;
}
/** The base-datamodel defines attributes which every document in the database has in common
 * @remarks Every instance of the base-datamodel (db -\> application layer) should contain standard methods
 * @public
 */
export default class BaseDatamodel implements iBaseDatamodel {
    _id: string;
    _rev?: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(payload: iBaseDatamodel);
    /**
     * Execute steps after the document has been created. Will be executed by {@link BaseDAO}.
     * and should not be executed by it's own.
     * Similar to mongoose post-save-hook
     * @returns
     * @virtual
     */
    executeAfterCreateDependencies(): Promise<any>;
    /**
     * Execute steps after the document has been deleted. Will be executed by {@link BaseDAO}.
     * and should not be executed by it's own.
     * Similar to mongoose post-delete-hook
     * @returns
     * @virtual
     */
    executeAfterDeleteDependencies(): Promise<any>;
    /**
         * Execute steps before the document will be inserted. Will be executed by {@link BaseDAO}
         * and should not be executed by it's own.
         * Similar to mongoose pre-save-hook
         * @returns
         * @virtual
         */
    beforeInsert(): Promise<void>;
    /**
     * Execute steps before the document has been updated. Will be executed by {@link BaseDAO}
     * and should not be executed by it's own. The 'updateAt' attribute of the document will be changed by default.
     * Similar to mongoose pre-update-hook
     * @returns
     * @virtual
     */
    beforeUpdate(payload: iBaseDatamodel): Promise<void>;
}
//# sourceMappingURL=BaseDatamodel.d.ts.map