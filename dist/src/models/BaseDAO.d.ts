import BaseDatamodel from './BaseDatamodel';
import AdapterInterface from './AdapterInterface';
/**
 * DAO which exposes all CRUD opeartions
 * @remarks This class is based on Java DAO. see https://www.baeldung.com/java-dao-pattern.
 * All classes with custom datamodels have to extend this class.
 * @public
 */
export default class BaseDAO<Datamodel extends BaseDatamodel> implements AdapterInterface<Datamodel> {
    /**
     * Database-specific adapter
     */
    adapter: AdapterInterface<Datamodel>;
    /**
     * The namespace of where the documents should be saved. In MariaDB the documents are persistet in tables.
     */
    tableName: string;
    isInitialized: boolean;
    /**
     * @param tableName- The namespace of where the documents should be saved. In MariaDB the documents are persistet in tables.
     * @param C - The class of the datamodel
     */
    constructor(tableName: string, C: {
        new (configObject: any): Datamodel;
    });
    /**
     * @param adapter - The database-specific adapter
     */
    constructor(adapter: AdapterInterface<Datamodel>);
    /**
     * {@inheritDoc AdapterInterface.bulkInsert}
     */
    bulkInsert(payload: Datamodel[]): Promise<boolean>;
    /**
     * {@inheritDoc AdapterInterface.bulkDelete}
     */
    bulkDelete(payload: Datamodel[]): Promise<boolean>;
    /**
     * {@inheritDoc AdapterInterface.bulkUpdate}
     */
    bulkUpdate(payload: Datamodel[]): Promise<boolean>;
    /**
     * {@inheritDoc AdapterInterface.init}
     */
    init(): Promise<boolean>;
    /**
     * {@inheritDoc AdapterInterface.findAll}
     */
    findAll(options?: any): Promise<Datamodel[]>;
    /**
     * {@inheritDoc AdapterInterface.findById}
     */
    findById(id: string, options?: any): Promise<Datamodel>;
    /**
     * {@inheritDoc AdapterInterface.findByAttributes}
     */
    findByAttributes(searchObject: {
        [key: string]: any;
    }): Promise<Datamodel[]>;
    /**
     * {@inheritDoc AdapterInterface.deleteById}
     */
    deleteById(id: string): Promise<boolean | void>;
    /**
     * {@inheritDoc AdapterInterface.updateById}
     */
    updateById(id: string, payload: Datamodel): Promise<Datamodel>;
    /**
     * {@inheritDoc AdapterInterface.insert}
     */
    insert(payload: Datamodel, options?: any): Promise<Datamodel>;
}
//# sourceMappingURL=BaseDAO.d.ts.map