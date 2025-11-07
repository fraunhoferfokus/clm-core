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

import listEndpoints from 'express-list-endpoints';
import BaseBackendDTO from '../BaseBackendDTO';
import PathDAO from './PathDAO';
import PathModel from './PathModel';
import ConsumerDAO from '../ServiceConsumer/ConsumerDAO';
import ConsumerModel from '../ServiceConsumer/ConsumerModel';
import { CONFIG } from '../../config/config';

// if (CONFIG.ENV === 'PROD') working_dir = __dirname.replace('/dist', '')

/**
 * @public
 * Backend DTO for path. Based on {@link PathModel} 
 * The instance {@link pathBDTOInstance} is provided.
 * Uses as default {@link MariaAdapter} for persistence layer
*/
export class PathBDTO extends BaseBackendDTO<PathModel> {


   


    /**
     * Persists all existing routes of the express app in the database
     * @param app - express app
     * @param ECLUDED_PATHS - array of paths which should not be registered in the database. 
     * @returns 
     */
    async registerRoutes(app: any, ECLUDED_PATHS: string[], MGMT_TOKEN: string = CONFIG.CLM_API_KEY, userId?: string, TO_BE_PROTECTED?: string[]) {
        const expressPaths = TO_BE_PROTECTED || listEndpoints(app).map((obj) => (obj.path))


        let promises = []
        for (let path of expressPaths) {
            promises.push(
                this.findById(path).then((path) => {
                    if (ECLUDED_PATHS.includes(path.route)) return PathDAO.deleteById(path._id)
                    return true
                })
                    .then(() => true)
                    .catch((err) => {
                        if (err.status === 404) {
                            if (ECLUDED_PATHS.includes(path)) {
                                return true as any
                            } else {
                                return PathDAO.insert(new PathModel({ route: path }))
                            }
                        }
                        throw err
                    })
            )
        }
        let consumer = (await ConsumerDAO.findByAttributes({ displayName: MGMT_TOKEN }))[0]
        if (!consumer) consumer = await ConsumerDAO.insert(new ConsumerModel({ _id: MGMT_TOKEN, displayName: MGMT_TOKEN, userId: userId || "ROOT_API_TOKEN", active: true, domain: "FAME", paths: [] }))

        await Promise.all([promises])
        const paths = await PathDAO.findAll()
        return Promise.all([
            ConsumerDAO.updateById(consumer._id,
                { paths: paths.map((path) => ({ route: path.route, scope: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] })) } as ConsumerModel),
        ])
    }
}
/**
 * @public 
 * Instance of {@link PathBDTO} 
 * Uses as default {@link MariaAdapter} for persistence layer
    */
export const pathBDTOInstance = new PathBDTO(PathDAO);



