import BaseDatamodel from "./BaseDatamodel";
/** Interface which database-connectors need to implement.
 * `Datamodel` is the struture of the document which will be saved in the db. Has to extend {@link BaseDatamodel}
 * @public
 * @typeParam Datamodel - the struture of the document which will be saved in the db. Has to extend {@link BaseDatamodel}
 */
export default interface AdapterInterface<Datamodel extends BaseDatamodel> {
    /**
     * Whether the adapter is already initialized
     */
    isInitialized: boolean;
    /**
        * The namespace where the document will be saved
    */
    tableName: string;
    /**
     * Find all the documents from the database
     * @param options - Object containing options. Options may be database specific.
     */
    findAll(options?: any): Promise<Datamodel[]>;
    /**
     * Finds the document by id
     * @param id - Id of the document
     * @param options - Object containing options. Options may be databse specific.
     */
    findById(id: string, options?: any): Promise<Datamodel>;
    /**
     * Finds document bt attributes
     * @param searchObject - Key Value Object which searches for a doucment by specified document parameter(s)
     */
    findByAttributes(searchObject: {
        [key: string]: any;
    }): Promise<Datamodel[]>;
    /**
     * Deletes document by id
     * @param id - Id of the document
     */
    deleteById(id: string): Promise<void | boolean>;
    /**
     * Updates document by id
     * @param id - Id of the doucmnet
     * @param payload - Payload
     */
    updateById(id: string, payload: Datamodel): Promise<Datamodel>;
    /**
     * Insert a document into the database
     * @param payload - Payload
     * @param options - Object containing options. Options may be database specific
     */
    insert(payload: Datamodel, options?: any): Promise<Datamodel>;
    /**
     * Bulk inserts documents into the database
     * @param payload - Payload
     */
    bulkInsert(payload: Datamodel[]): Promise<boolean>;
    /**
     * Bulk deletes documents from the database
     * @param payload - Payload
     */
    bulkDelete(payload: Datamodel[]): Promise<boolean>;
    /**
     * Bulk updates documents from the database
     * @param payload - Payload
     */
    bulkUpdate(payload: Datamodel[]): Promise<boolean>;
    /**
     * Database specific instructions to be executed before the adapter can be used. For example creating the table with respective tablename in the database.
     * The param {@link isInitialized} must be set to true after the init function is executed.
     */
    init(): Promise<boolean>;
}
//# sourceMappingURL=AdapterInterface.d.ts.map