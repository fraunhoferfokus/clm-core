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
import express from 'express';
import BaseDAO from '../models/BaseDAO';
import BaseDatamodel from '../models/BaseDatamodel';
import BaseFrontendDTO from '../models/BaseFrontendDTO';
/**
 * A controller which offers CRUD opeartions as REST-Interface on a certain resource.
 * Expects as types `DAO` which has to be of type {@link BaseDAO}, `Datamodel` of type {@link BaseDatamodel} and `FDTO` of type {@link BaseFrontendDTO}
 * @remarks This class is to be extended by your custom resources.
 * @public
 */
export declare class BaseModelController<DAO extends BaseDAO<Datamodel>, Datamodel extends BaseDatamodel, FDTO extends BaseFrontendDTO> {
    /**
     * DAO which extends {@link BaseDAO}
     */
    dao: DAO;
    /**
     * The datamodel-class which extends {@link BaseDatamodel}
     */
    modelClass: new (params: any) => Datamodel;
    /**
     * The frontend DTO class which extends {@link BaseFrontendDTO}.
     * It is used to only show a subset of attributes when fetching for resources
     */
    dtoClass: new (params: any) => FDTO;
    /**
     * Express-Router to add custom handlers to the standard available routes.
     *  Handlers have to be registered before {@link BaseModelController.activateStandardRouting} has been called.
     */
    router: express.Router;
    constructor(dao: DAO, modelClass: new (params: any) => Datamodel, dtoClass: new (params: any) => FDTO);
    /**
     * Activates the standard CRUD operations on a resource. The following convention is assumed:
     *
     * GET / - find all resources
     *
     * POST / - create a resource
     *
     * GET /:id - find a specific resource by id
     *
     * PATCH /:id - update a specific resource by id
     *
     * PUT /:id - update a specific resource by id
     *
     * DELETE /:id - delete a specific resource by id
     * @public
     */
    activateStandardRouting: () => void;
    /**
     * Deletes a route
     * @param path - The path ('/' | '/:id')
     * @param methods - The methods which should be deleted ('get' | 'patch' | 'put' | 'delete' | 'post')
     */
    removeRoute(path: ("/" | "/:id"), methods: ('get' | 'patch' | 'put' | 'delete' | 'post')[]): void;
    /**
     * Find all resources. Can be overwritten by extended classes
     * @virtual
     */
    findAllDocuments(preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{
        proceed: boolean;
    }>, callback?: (param: FDTO[]) => express.Handler): express.Handler;
    /**
     * Find a specific resource. Can be overwritten by extended classes
     * @virtual
     */
    findOneById(preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{
        proceed: boolean;
    }>, callback?: (param: FDTO) => express.Handler): express.Handler;
    /**
     * Delete a specific resource. Can be overwritten by extended classes
     * @virtual
     */
    deleteOneDocument(preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{
        proceed: boolean;
    }>, callback?: (param?: FDTO) => express.Handler): express.Handler;
    /**
     * Update a specific resource. Can be overwritten by extended classes
     * @virtual
     */
    updateOneDocument(preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{
        proceed: boolean;
    }>, callback?: (param?: FDTO, payload?: any, data?: any) => express.Handler): express.Handler;
    /**
     * Create a specific resource. Can be overwritten by extended classes
     * @virtual
     */
    createDocument(preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{
        proceed: boolean;
    }>, callback?: (param?: FDTO, payload?: any, data?: any) => express.Handler): express.Handler;
}
export default BaseModelController;
//# sourceMappingURL=BaseModelController.d.ts.map