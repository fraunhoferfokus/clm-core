import BaseDatamodel from './BaseDatamodel';
import AdapterInterface from './AdapterInterface';
/** DTO which exposes only READ operations
 * @remarks This class is based on Java DTO. Backend stands for the fact that this class is intended exclusively for consumption as npm package in the backend.
 * see https://www.baeldung.com/java-dto-pattern
 * @public
 */
declare abstract class BaseBackendDTO<Datamodel extends BaseDatamodel> {
    /**
     * Adapter
     */
    private adapter;
    constructor(adapter: AdapterInterface<Datamodel>);
    /**
     * @returns
     * {@inheritDoc AdapterInterface.findAll}
     */
    findAll(options?: any): Promise<Datamodel[]>;
    /**
    * @returns
    * {@inheritDoc AdapterInterface.findById}
    */
    findById(id: string, options?: any): Promise<Datamodel>;
}
export default BaseBackendDTO;
//# sourceMappingURL=BaseBackendDTO.d.ts.map