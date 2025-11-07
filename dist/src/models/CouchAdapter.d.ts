import AdapterInterface from './AdapterInterface';
import BaseDatamodel from './BaseDatamodel';
import { DocumentInfer, ViewDocument } from 'nano';
export default class CouchDAO<T extends BaseDatamodel> implements AdapterInterface<T> {
    private db;
    viewDocument: ViewDocument<T>;
    tableName: string;
    Class: {
        new (configObject: any): T;
    };
    constructor(tableName: string, C: {
        new (configObject: any): T;
    }, views?: {
        [key: string]: DocumentInfer<T>;
    });
    isInitialized: boolean;
    bulkInsert(payload: T[]): Promise<boolean>;
    bulkDelete(payload: T[]): Promise<boolean>;
    bulkUpdate(payload: T[]): Promise<boolean>;
    init(): Promise<boolean>;
    findAll(options?: {
        view: string;
    }): Promise<T[]>;
    findById(id: string, options?: {
        view: string;
    }): Promise<T>;
    findByAttributes(searchObject: {
        [key: string]: any;
    }): Promise<T[]>;
    deleteById(id: string): Promise<boolean>;
    updateById(id: string, payload: T): Promise<T>;
    insert(payload: T, options?: any): Promise<T>;
}
//# sourceMappingURL=CouchAdapter.d.ts.map