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
import { CONFIG } from "../config/config";
import { AuthGuard } from "../handlers/AuthGuard";
import RelationBDTO from "../models/Relation/RelationBDTO";
import UserDAO from "../models/User/UserDAO";
import UserFDTO from "../models/User/UserFDTO";
import { UserModel } from "../models/User/UserModel";
import PasswordService from "../services/PasswordService";
import { createUserValidation, updateUserValidation } from "../validationSchemas/UserValidation";
import BaseModelController from "./BaseModelController";
const basePath = CONFIG.BASE_PATH || '/core'

class UserMGMTController extends BaseModelController<typeof UserDAO, UserModel, UserFDTO> {

    getUserRelations(): express.Handler {
        return async (req, res, next) => {
            try {

                const relations = (await (RelationBDTO.findAll())).filter((relation) => relation.fromId === req.requestingUser?._id)

                return res.json(relations)
            } catch (err) {
                return next(err)
            }
        }
    }

    createDocument(): express.Handler {
        return super.createDocument(undefined, (doc) => {
            return (req, res, next) => {
                return UserDAO.updateById(doc!._id, { isVerified: true } as UserModel).then(() =>
                    res.json(doc)
                ).catch((err) => next(err))
            }
        })
    }

    updateOneDocument() {
        return super.updateOneDocument(
            async (req, res, next) => {
                const user = await UserDAO.findById(req.params.id)
                if (user.isSuperAdmin && !await PasswordService.verifyPassword(req.body.oldPassword, user.password)) {
                    next({ message: "Need old password of super-admin", status: 400 })
                }
                return Promise.resolve({ proceed: true })
            }
            ,
            undefined)
    }

    deleteOneDocument(): express.Handler {
        return async (req, res, next) => {
            try {
                let targetedUser = await UserDAO.findById(req.params.id)
                if (targetedUser.isSuperAdmin) {
                    next({ message: "Cannot delete super-admin", status: 400 })
                }
                return super.deleteOneDocument()(req, res, next)
            } catch (err) {
                next(err)
            }
        }
    }
    
}

const controller = new UserMGMTController(UserDAO, UserModel, UserFDTO);

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

controller.router.get('/', AuthGuard.permissionChecker('user'))

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

controller.router.post('/', AuthGuard.permissionChecker('user'), createUserValidation)

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
controller.router.delete('/:id', AuthGuard.permissionChecker('user'),
)
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
controller.router.patch('/:id', AuthGuard.permissionChecker('user'), updateUserValidation)
controller.router.put('/:id', AuthGuard.permissionChecker('user'), updateUserValidation)

controller.activateStandardRouting();
export default controller;

