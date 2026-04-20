/* -----------------------------------------------------------------------------
 *  Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, version 3.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.  
 *
 *  No Patent Rights, Trademark Rights and/or other Intellectual Property
 *  Rights other than the rights under this license are granted.
 *  All other rights reserved.
 *
 *  For any other rights, a separate agreement needs to be closed.
 *
 *  For more information please contact:  
 *  Fraunhofer FOKUS
 *  Kaiserin-Augusta-Allee 31
 *  10589 Berlin, Germany
 *  https://www.fokus.fraunhofer.de/go/fame
 *  famecontact@fokus.fraunhofer.de
 * -----------------------------------------------------------------------------
 */
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
    registerRoutes(app: any, ECLUDED_PATHS: string[], MGMT_TOKEN?: string, userId?: string, TO_BE_PROTECTED?: string[]): Promise<[ConsumerModel]>;
}
/**
 * @public
 * Instance of {@link PathBDTO}
 * Uses as default {@link MariaAdapter} for persistence layer
    */
export declare const pathBDTOInstance: PathBDTO;
//# sourceMappingURL=PathBDTO.d.ts.map