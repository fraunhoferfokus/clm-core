import BaseBackendDTO from '../BaseBackendDTO';
import PathModel from './PathModel';
import ConsumerModel from '../ServiceConsumer/ConsumerModel';
/**
 * @public
 * Backend DTO for path. Based on {@link PathModel}
 * The instance {@link pathBDTOInstance} is provided.
 * Uses as default {@link MariaAdapter} for persistence layer
*/
export declare class PathBDTO extends BaseBackendDTO<PathModel> {
    /**
     * Persists all existing routes of the express app in the database
     * @param app - express app
     * @param ECLUDED_PATHS - array of paths which should not be registered in the database.
     * @returns
     */
    registerRoutes(app: any, ECLUDED_PATHS: string[], MGMT_TOKEN?: string, userId?: string): Promise<[ConsumerModel]>;
}
/**
 * @public
 * Instance of {@link PathBDTO}
 * Uses as default {@link MariaAdapter} for persistence layer
    */
export declare const pathBDTOInstance: PathBDTO;
//# sourceMappingURL=PathBDTO.d.ts.map