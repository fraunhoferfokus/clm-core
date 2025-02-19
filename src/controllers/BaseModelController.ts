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
 
import express, { Handler } from 'express'
// import BaseDAO from '../models/AdapterInterface'

import BaseDAO from '../models/BaseDAO'
import BaseDatamodel from '../models/BaseDatamodel'
import BaseFrontendDTO from '../models/BaseFrontendDTO'
import { checkValidationError } from '../handlers/ExpressValidationMW'
import { matchedData } from 'express-validator'

/**
 * A controller which offers CRUD opeartions as REST-Interface on a certain resource.
 * Expects as types `DAO` which has to be of type {@link BaseDAO}, `Datamodel` of type {@link BaseDatamodel} and `FDTO` of type {@link BaseFrontendDTO} 
 * @remarks This class is to be extended by your custom resources. 
 * @public
 */
export class BaseModelController<DAO extends BaseDAO<Datamodel>, Datamodel extends BaseDatamodel, FDTO extends BaseFrontendDTO> {

    /**
     * DAO which extends {@link BaseDAO}
     */
    dao: DAO
    /**
     * The datamodel-class which extends {@link BaseDatamodel}
     */
    modelClass: new (params: any) => Datamodel
    /**
     * The frontend DTO class which extends {@link BaseFrontendDTO}. 
     * It is used to only show a subset of attributes when fetching for resources
     */
    dtoClass: new (params: any) => FDTO
    /**
     * Express-Router to add custom handlers to the standard available routes.
     *  Handlers have to be registered before {@link BaseModelController.activateStandardRouting} has been called.
     */
    router: express.Router

    constructor(dao: DAO, modelClass: new (params: any) => Datamodel, dtoClass: new (params: any) => FDTO) {
        this.dao = dao;
        this.modelClass = modelClass;
        this.dtoClass = dtoClass;
        this.router = express.Router({ mergeParams: true });

    }

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
    activateStandardRouting = () => {
        this.router.use(checkValidationError)
        this.router.route('/')
            .get(this.findAllDocuments())
            .post(this.createDocument())

        this.router.route('/:id')
            .get(this.findOneById())
            .patch(this.updateOneDocument())
            .put(this.updateOneDocument())
            .delete(this.deleteOneDocument())
    }

    /**
     * Deletes a route
     * @param path - The path ('/' | '/:id')
     * @param methods - The methods which should be deleted ('get' | 'patch' | 'put' | 'delete' | 'post')
     */
    removeRoute(path: ("/" | "/:id"), methods: ('get' | 'patch' | 'put' | 'delete' | 'post')[]) {
        for (let method of methods) {
            this.router.route(path)[method]((req, res, next) => {
                return next({ message: `Cannot ${method.toUpperCase()} ${path}`, status: 404 })
            })
        }
    }

    /**
     * Find all resources. Can be overwritten by extended classes 
     * @virtual
     */
    findAllDocuments(
        preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{ proceed: boolean }>,

        callback?: (param: FDTO[]) => express.Handler): express.Handler {
        return (async (req, res, next) => {
            if (preback) {
                const { proceed } = await preback(req, res, next)
                if (!proceed) return
            }
            try {
                let documents: Datamodel[];

                if (req.query.searchObject) {
                    let searchObject = JSON.parse(req.query.searchObject as string)
                    documents = await this.dao.findByAttributes(searchObject)
                } else {
                    documents = await this.dao.findAll()
                }

                let dtos: FDTO[] = [];
                for (const document of documents) {
                    dtos.push(new this.dtoClass(document))
                }

                if(req.requestingUser && !req.requestingUser.isSuperAdmin){
                    const usersPermissions = req.requestingUser.permissions!


                    dtos = dtos.filter((dto) =>
                        usersPermissions[dto._id]
                    )
                }

                if (callback) {
                    return callback(dtos)(req, res, next)
                } else {
                    return res.json(dtos)
                }
            } catch (err) {
                return next(err);
            }
        })

    }
    /**
     * Find a specific resource. Can be overwritten by extended classes 
     * @virtual
     */
    findOneById(preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{ proceed: boolean }>,
        callback?: (param: FDTO) => express.Handler): express.Handler {
        return async (req, res, next) => {
            if (preback) {
                const { proceed } = await preback(req, res, next)
                if (!proceed) return
            }
            try {
                const doc = new this.dtoClass(await this.dao.findById(req.params.id))
                if (req.requestingUser && !req.requestingUser.isSuperAdmin && req.minimumRoleStrength) {
                    const usersPermissions = req.requestingUser.permissions!
                    if (usersPermissions[this.dao.tableName][doc._id] < req.minimumRoleStrength) {
                        return next({ message: `You cannot update the document since you do not have eneought permissions`, status: 403 })
                    }
                }

                if (callback) {
                    return callback(doc)(req, res, next)
                } else {
                    return res.json(doc)
                }
            } catch (err) {

                return next(err);
            }
        }
    }

    /**
     * Delete a specific resource. Can be overwritten by extended classes 
     * @virtual
     */
    deleteOneDocument(preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{ proceed: boolean }>,
        callback?: (param?: FDTO) => express.Handler): express.Handler {
        return async (req, res, next) => {
            if (preback) {
                const { proceed } = await preback(req, res, next)
                if (!proceed) return
            }
            try {
                const doc = await this.dao.findById(req.params.id)
                await this.dao.deleteById(req.params.id)
                await doc.executeAfterDeleteDependencies()
                if (callback) {
                    return callback()(req, res, next)
                } else {
                    return res.status(204).send()
                }
            } catch (err) {
                return next(err);
            }
        }
    }

    /**
     * Update a specific resource. Can be overwritten by extended classes 
     * @virtual
     */
    updateOneDocument(preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{ proceed: boolean }>,
        callback?: (param?: FDTO, payload?: any, data?: any) => express.Handler): express.Handler {
        return async (req, res, next) => {
            if (preback) {
                const { proceed } = await preback(req, res, next)
                if (!proceed) return
            }
            try {
                let potentialPayload = matchedData(req, { locations: ['body', 'params'] })
                const payload = Object.keys(potentialPayload).length > 0 ? potentialPayload : req.body
                req.payload = payload
                const doc = new this.dtoClass(await this.dao.updateById(req.params.id, payload as any))
                if (callback) {
                    callback(doc, payload)(req, res, next)
                } else {
                    return res.json(doc)
                }
            } catch (err) {

                return next(err);
            }
        }
    }

    /**
     * Create a specific resource. Can be overwritten by extended classes 
     * @virtual
     */
    createDocument(preback?: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<{ proceed: boolean }>,
        callback?: (param?: FDTO, payload?: any, data?: any) => express.Handler): express.Handler {
        return (async (req, res, next) => {
            if (preback) {
                const { proceed } = await preback(req, res, next)
                if (!proceed) return
            }
            let potentialPayload = matchedData(req, { locations: ['body', 'params'] })
            const payload = Object.keys(potentialPayload).length > 0 ? potentialPayload : req.body

            req.payload = payload

            try {

                const doc = await this.dao.insert(new this.modelClass(payload), payload)

                // if (req.requestingUser && !req.requestingUser.isSuperAdmin) {
                //     await RelationBDTO.createRelationship(new RelationModel({
                //         fromId: req.requestingUser._id,
                //         fromType: 'group',
                //         toType: 'user',
                //         toId: doc._id
                //     }))
                // }

                const data = await doc.executeAfterCreateDependencies()
                const dto = new this.dtoClass(doc)

                if (callback) {
                    callback(dto, payload, data)(req, res, next)
                } else {
                    return res.json(dto)
                }

            } catch (err) {

                return next(err);
            }
        })
    }



}

export default BaseModelController;

