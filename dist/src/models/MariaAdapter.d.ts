import AdapterInterface from "./AdapterInterface";
import BaseDatamodel from "./BaseDatamodel";
/**
 * Adapter for MariaDB and default adapter for {@link BaseDAO}
 * @public
 */
export default class MariaAdapter<T extends BaseDatamodel> implements AdapterInterface<T> {
    tableName: string;
    Class: {
        new (configObject: any): T;
    };
    isInitialized: boolean;
    constructor(tableName: string, C: {
        new (configObject: any): T;
    }, opt: any);
    bulkInsert(payload: T[]): Promise<boolean>;
    bulkDelete(payload: T[]): Promise<boolean>;
    bulkUpdate(payload: T[]): Promise<boolean>;
    init(): Promise<boolean>;
    private query;
    findAll(options?: any): Promise<T[]>;
    findById(id: string, options?: any): Promise<T>;
    updateById(id: string, payload: T): Promise<T>;
    findByAttributes(searchObject: {
        [key: string]: any;
    }): Promise<T[]>;
    deleteById(id: string): Promise<boolean | void>;
    insert(payload: T, options?: any): Promise<T>;
}
//# sourceMappingURL=MariaAdapter.d.ts.map