"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModelController = void 0;
const express_1 = __importDefault(require("express"));
const ExpressValidationMW_1 = require("../handlers/ExpressValidationMW");
const express_validator_1 = require("express-validator");
/**
 * A controller which offers CRUD opeartions as REST-Interface on a certain resource.
 * Expects as types `DAO` which has to be of type {@link BaseDAO}, `Datamodel` of type {@link BaseDatamodel} and `FDTO` of type {@link BaseFrontendDTO}
 * @remarks This class is to be extended by your custom resources.
 * @public
 */
class BaseModelController {
    constructor(dao, modelClass, dtoClass) {
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
        this.activateStandardRouting = () => {
            this.router.use(ExpressValidationMW_1.checkValidationError);
            this.router.route('/')
                .get(this.findAllDocuments())
                .post(this.createDocument());
            this.router.route('/:id')
                .get(this.findOneById())
                .patch(this.updateOneDocument())
                .put(this.updateOneDocument())
                .delete(this.deleteOneDocument());
        };
        this.dao = dao;
        this.modelClass = modelClass;
        this.dtoClass = dtoClass;
        this.router = express_1.default.Router({ mergeParams: true });
    }
    /**
     * Deletes a route
     * @param path - The path ('/' | '/:id')
     * @param methods - The methods which should be deleted ('get' | 'patch' | 'put' | 'delete' | 'post')
     */
    removeRoute(path, methods) {
        for (let method of methods) {
            this.router.route(path)[method]((req, res, next) => {
                return next({ message: `Cannot ${method.toUpperCase()} ${path}`, status: 404 });
            });
        }
    }
    /**
     * Find all resources. Can be overwritten by extended classes
     * @virtual
     */
    findAllDocuments(preback, callback) {
        return ((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (preback) {
                const { proceed } = yield preback(req, res, next);
                if (!proceed)
                    return;
            }
            try {
                let documents;
                if (req.query.searchObject) {
                    let searchObject = JSON.parse(req.query.searchObject);
                    documents = yield this.dao.findByAttributes(searchObject);
                }
                else {
                    documents = yield this.dao.findAll();
                }
                let dtos = [];
                for (const document of documents) {
                    dtos.push(new this.dtoClass(document));
                }
                if (req.requestingUser && !req.requestingUser.isSuperAdmin) {
                    const usersPermissions = req.requestingUser.permissions;
                    dtos = dtos.filter((dto) => usersPermissions[dto._id]);
                }
                if (callback) {
                    return callback(dtos)(req, res, next);
                }
                else {
                    return res.json(dtos);
                }
            }
            catch (err) {
                return next(err);
            }
        }));
    }
    /**
     * Find a specific resource. Can be overwritten by extended classes
     * @virtual
     */
    findOneById(preback, callback) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (preback) {
                const { proceed } = yield preback(req, res, next);
                if (!proceed)
                    return;
            }
            try {
                const doc = new this.dtoClass(yield this.dao.findById(req.params.id));
                if (req.requestingUser && !req.requestingUser.isSuperAdmin && req.minimumRoleStrength) {
                    const usersPermissions = req.requestingUser.permissions;
                    if (usersPermissions[this.dao.tableName][doc._id] < req.minimumRoleStrength) {
                        return next({ message: `You cannot update the document since you do not have eneought permissions`, status: 403 });
                    }
                }
                if (callback) {
                    return callback(doc)(req, res, next);
                }
                else {
                    return res.json(doc);
                }
            }
            catch (err) {
                return next(err);
            }
        });
    }
    /**
     * Delete a specific resource. Can be overwritten by extended classes
     * @virtual
     */
    deleteOneDocument(preback, callback) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (preback) {
                const { proceed } = yield preback(req, res, next);
                if (!proceed)
                    return;
            }
            try {
                const doc = yield this.dao.findById(req.params.id);
                yield this.dao.deleteById(req.params.id);
                yield doc.executeAfterDeleteDependencies();
                if (callback) {
                    return callback()(req, res, next);
                }
                else {
                    return res.status(204).send();
                }
            }
            catch (err) {
                return next(err);
            }
        });
    }
    /**
     * Update a specific resource. Can be overwritten by extended classes
     * @virtual
     */
    updateOneDocument(preback, callback) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (preback) {
                const { proceed } = yield preback(req, res, next);
                if (!proceed)
                    return;
            }
            try {
                let potentialPayload = (0, express_validator_1.matchedData)(req, { locations: ['body', 'params'] });
                const payload = Object.keys(potentialPayload).length > 0 ? potentialPayload : req.body;
                req.payload = payload;
                const doc = new this.dtoClass(yield this.dao.updateById(req.params.id, payload));
                if (callback) {
                    callback(doc, payload)(req, res, next);
                }
                else {
                    return res.json(doc);
                }
            }
            catch (err) {
                return next(err);
            }
        });
    }
    /**
     * Create a specific resource. Can be overwritten by extended classes
     * @virtual
     */
    createDocument(preback, callback) {
        return ((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (preback) {
                const { proceed } = yield preback(req, res, next);
                if (!proceed)
                    return;
            }
            let potentialPayload = (0, express_validator_1.matchedData)(req, { locations: ['body', 'params'] });
            const payload = Object.keys(potentialPayload).length > 0 ? potentialPayload : req.body;
            req.payload = payload;
            try {
                const doc = yield this.dao.insert(new this.modelClass(payload), payload);
                // if (req.requestingUser && !req.requestingUser.isSuperAdmin) {
                //     await RelationBDTO.createRelationship(new RelationModel({
                //         fromId: req.requestingUser._id,
                //         fromType: 'group',
                //         toType: 'user',
                //         toId: doc._id
                //     }))
                // }
                const data = yield doc.executeAfterCreateDependencies();
                const dto = new this.dtoClass(doc);
                if (callback) {
                    callback(dto, payload, data)(req, res, next);
                }
                else {
                    return res.json(dto);
                }
            }
            catch (err) {
                return next(err);
            }
        }));
    }
}
exports.BaseModelController = BaseModelController;
exports.default = BaseModelController;
