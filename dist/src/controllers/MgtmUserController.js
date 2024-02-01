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
const config_1 = require("../config/config");
const AuthGuard_1 = require("../handlers/AuthGuard");
const RelationBDTO_1 = __importDefault(require("../models/Relation/RelationBDTO"));
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const UserFDTO_1 = __importDefault(require("../models/User/UserFDTO"));
const UserModel_1 = require("../models/User/UserModel");
const PasswordService_1 = __importDefault(require("../services/PasswordService"));
const UserValidation_1 = require("../validationSchemas/UserValidation");
const BaseModelController_1 = __importDefault(require("./BaseModelController"));
const basePath = config_1.CONFIG.BASE_PATH || '/core';
class UserMGMTController extends BaseModelController_1.default {
    getUserRelations() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const relations = (yield (RelationBDTO_1.default.findAll())).filter((relation) => { var _a; return relation.fromId === ((_a = req.requestingUser) === null || _a === void 0 ? void 0 : _a._id); });
                return res.json(relations);
            }
            catch (err) {
                return next(err);
            }
        });
    }
    createDocument() {
        return super.createDocument(undefined, (doc) => {
            return (req, res, next) => {
                return UserDAO_1.default.updateById(doc._id, { isVerified: true }).then(() => res.json(doc)).catch((err) => next(err));
            };
        });
    }
    updateOneDocument() {
        return super.updateOneDocument((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const user = yield UserDAO_1.default.findById(req.params.id);
            if (user.isSuperAdmin && !(yield PasswordService_1.default.verifyPassword(req.body.oldPassword, user.password))) {
                next({ message: "Need old password of super-admin", status: 400 });
            }
            return Promise.resolve({ proceed: true });
        }), undefined);
    }
    deleteOneDocument() {
        const _super = Object.create(null, {
            deleteOneDocument: { get: () => super.deleteOneDocument }
        });
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                let targetedUser = yield UserDAO_1.default.findById(req.params.id);
                if (targetedUser.isSuperAdmin) {
                    next({ message: "Cannot delete super-admin", status: 400 });
                }
                return _super.deleteOneDocument.call(this)(req, res, next);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
const controller = new UserMGMTController(UserDAO_1.default, UserModel_1.UserModel, UserFDTO_1.default);
/**
 * @openapi
 * components:
 *   schemas:
 *     user:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           default: 'fame@fokus.fraunhofer.de'
 *         isVerified:
 *           type: boolean
 *           default: true
 *         givenName:
 *           type: string
 *           default: 'max'
 *         familyName:
 *           type: string
 *           default: 'Mustermann'
 *         isSuperAdmin:
 *           type: boolean
 *           default: false
 */
/**
 * @openapi
 * paths:
 *   /core/mgmt/users:
 *     get:
 *       tags:
 *         - mgmt-users
 *         - mgmt
 *       description: User can get all the users he is in the same group with
 *       summary: "Get users [Minimum Role: 'LEARNER']"
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         200:
 *           description: The list of users
 *           content:
 *             application/json:
 *               schema:
 *                 items:
 *                   $ref: '#/components/schemas/user'
 */
controller.router.get('/', AuthGuard_1.AuthGuard.permissionChecker('user'));
/**
 * @openapi
 * paths:
 *   /core/mgmt/users:
 *     post:
 *       tags:
 *         - mgmt-users
 *         - mgmt
 *       description: User can create a user when he is in an admin group
 *       summary: 'Create a user [Minimum Role: "ADMIN"]'
 *       requestBody:
 *         required: true
 *         description: Payload user
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 email:
 *                   type: string
 *                   default: 'student@localhost.de'
 *                 password:
 *                   type: string
 *                   default: '12345'
 *                 givenName:
 *                   type: string
 *                   default: 'Maximillian'
 *                 familyName:
 *                   type: string
 *                   default: 'Mustermann'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         200:
 *           description: Successfully created a user
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/user'
 */
controller.router.post('/', AuthGuard_1.AuthGuard.permissionChecker('user'), UserValidation_1.createUserValidation);
/**
 * @openapi
 * paths:
 *   /core/mgmt/users/{id}:
 *     delete:
 *       tags:
 *         - mgmt-users
 *         - mgmt
 *       description: User can delete a target user if the user is admin and the target user is in a child-group of the admin group
 *       summary: 'Create a user [Minimum Role: "ADMIN"]'
 *       parameters:
 *         - in: path
 *           name: id
 *           description: email of the target user
 *           required: true
 *           schema:
 *             type: string
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         204:
 *           description: Successfully deleted a user
 */
controller.router.delete('/:id', AuthGuard_1.AuthGuard.permissionChecker('user'));
// controller.router.get('/relations', AuthHandler.requireMinimumRole('ADMIN'), controller.getUserRelations())
/**
 * @openapi
 * paths:
 *   /core/mgmt/users/{id}:
 *     patch:
 *       tags:
 *         - mgmt-users
 *       description: User can update a target user if the user is admin and the target user is in a child-group of the admin group
 *       summary: 'Update a user [Minimum Role: "ADMIN"]'
 *       requestBody:
 *         required: true
 *         description: Payload user
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 password:
 *                   type: string
 *                   default: '12345'
 *                 givenName:
 *                   type: string
 *                   default: 'Maximillian'
 *                 familyName:
 *                   type: string
 *                   default: 'Mustermann'
 *       parameters:
 *         - in: path
 *           name: id
 *           description: email of the target user
 *           required: true
 *           schema:
 *             type: string
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         200:
 *           description: The list of users
 *           content:
 *             application/json:
 *               schema:
 *                 items:
 *                   $ref: '#/components/schemas/user'
 *     put:
 *       tags:
 *         - mgmt-users
 *       description: User can update a target user if the user is admin and the target user is in a child-group of the admin group
 *       summary: 'Update a user [Minimum Role: "ADMIN"]'
 *       requestBody:
 *         required: true
 *         description: Payload user
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 password:
 *                   type: string
 *                   default: '12345'
 *                 givenName:
 *                   type: string
 *                   default: 'Maximillian'
 *                 familyName:
 *                   type: string
 *                   default: 'Mustermann'
 *       parameters:
 *         - in: path
 *           name: id
 *           description: email of the target user
 *           required: true
 *           schema:
 *             type: string
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         200:
 *           description: The list of users
 *           content:
 *             application/json:
 *               schema:
 *                 items:
 *                   $ref: '#/components/schemas/user'
 */
controller.router.patch('/:id', AuthGuard_1.AuthGuard.permissionChecker('user'), UserValidation_1.updateUserValidation);
controller.router.put('/:id', AuthGuard_1.AuthGuard.permissionChecker('user'), UserValidation_1.updateUserValidation);
controller.activateStandardRouting();
exports.default = controller;
