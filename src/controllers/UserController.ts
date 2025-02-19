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
import BaseModelController from "./BaseModelController";
import { UserModel } from '../models/User/UserModel';
import UserFDTO from "../models/User/UserFDTO";
import UserDAO from "../models/User/UserDAO";
// import UserFrontendDTO from "../models/User/UserFrontendDTO";
import { Handler } from "express";
import { AuthGuard } from "../handlers/AuthGuard";
// import GroupRelationBackendDTO from '../models/Group/GroupRelationBackendDTO'
import express from 'express'
import { checkSchema } from "express-validator";
import transporter from '../services/emailService'
import RelationBDTO from "../models/Relation/RelationBDTO";
import SwaggerDefinition from "../services/SwaggerDefinition";
import { CONFIG } from "../config/config";


const Cryptr = require('cryptr');
const cryptr = new Cryptr('secret');

const basePath = CONFIG.BASE_PATH || '/core'
const baseLocation = `${basePath}/users`
class UserController extends BaseModelController<typeof UserDAO, UserModel, UserFDTO> {


    getOwnUserInformation: express.Handler = (req, res, next) => {
        try {
            return res.json(req.requestingUser)
        } catch (err) {
            return next(err)
        }
    }


    getUsersGroups(): express.Handler {
        return (req, res, next) => {
            try {
                const user = req.requestingUser
                return RelationBDTO.getUsersGroups(user?._id!).then((groups) => res.json(groups))
            } catch (err) {
                next(err)
            }
        }
    }
    getUsersRoles(): express.Handler {
        return (req, res, next) => {
            try {
                const user = req.requestingUser
                return RelationBDTO.getUsersGroups(user?._id!).then((groups) => {
                    let adminGroup = []
                    if (user?.isSuperAdmin) adminGroup.push('SUPER-ADMIN')
                    res.json([...new Set([...groups.map((group) => group.role), ...adminGroup])])
                })
            } catch (err) {
                next(err)
            }
        }
    }

    deleteOneDocument(): express.Handler {
        return (req, res, next) => {
            let user = req.requestingUser
            if (user?.isSuperAdmin) return next({ message: "Cannot delete super admin!", status: 400 })
            return super.deleteOneDocument()(req, res, next)
        }
    }

    createDocument(): Handler {
        return super.createDocument(undefined, (doc, payload) => {
            return ((req, res, next) => {
                return transporter.sendMail({
                    from: CONFIG.SMTP_FROM,
                    to: req.body.email,
                    text: "Registrierung am KI-Demonstrator der Pionierschule",
                    subject: 'Registrierung am KI-Demonstrator der Pionierschule',
                    //@ts-ignore
                    template: 'register',   // defines the template to compile for the email
                    ctx: {
                        // this is available in the template
                        firstname: doc!.givenName,
                        lastname: doc!.familyName,
                        url: `${CONFIG.DEPLOY_URL}/users/verifyToken/${cryptr.encrypt(doc!._id)}`

                    }
                }).then(() => {
                    return res.json({ message: "Check email-instruction for more information!" })
                })
            })
        })
    }

    verifyToken(): Handler {
        return (req, res, next) => {
            const id = cryptr.decrypt(req.params.tokenId)
            return UserDAO.findById(id).then((user) => {
                if (user.isVerified) throw { status: 400, message: "User already verified" }

                return user.verifyUser()
                // return userDTO.verfityUser(req.params.tokenId)
            }).then(() => res.json({ message: "Successfully registerd a user!" }))
                .catch((err) => {
                    if (err?.status === 404) return next({ message: "Invalid token!", status: 404 })
                    return next(err)
                })
        }
    }

    usersPermissions: () => Handler = () => async (req, res, next) => {
        try {
            const userPermissions = await RelationBDTO.getUsersPermissions(req.requestingUser!._id!)
            return res.json(userPermissions)
        } catch (err) {
            next(err)
        }
    }


}

const controller = new UserController(UserDAO, UserModel, UserFDTO);
controller.removeRoute('/', ['get', 'delete', 'patch'])


controller.router.use(AuthGuard.requireUserAuthentication())


/**
 * @openapi
 * /core/users/verifyToken/{tokenId}:
 *   get:
 *     tags:
 *       - pblc-redirect
 *     description: Double-opt in for user after the instructions have been sent to the email
 *     summary: Confirm user
 *     parameters:
 *       - in: path
 *         required: true
 *         name: tokenId
 *         schema:
 *             type: string
 *     responses:
 *       200:
 *         description: Successfully registered user
 */
controller.router.get('/verifyToken/:tokenId', controller.verifyToken())

/**
 * @openapi
 * /core/users/me/permissions:
 *   get:
 *     tags:
 *       - pblc
 *     description: Get the user permissions
 *     summary: Get the user permissions
 *     parameters:
 *       - $ref: '#/components/parameters/accessToken'
 *     responses:
 *       200:
 *         description: User Permissions
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                     nameOfTheResource:
 *                        description: The name of the resource
 *                        type: object
 *                        properties:
 *                            some_id:
 *                               example: 4
 *                               type: number
 *                               description: The strength of the permission over the resource
 *                         
 */
controller.router.get('/me/permissions', controller.usersPermissions())

/**
 * @openapi
 * /core/users/{userId}/permissions:
 *   get:
 *     tags:
 *       - pblc
 *     description: Get the user permissions
 *     summary: Get the user permissions
 *     parameters:
 *       - $ref: '#/components/parameters/accessToken'
 *       - in: path
 *         name: userId
 *         description: id of the user
 *         required: true
 *         schema:
 *             type: string
 *     responses:
 *       200:
 *         description: User Permissions
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                     nameOfTheResource:
 *                        description: The name of the resource
 *                        type: object
 *                        properties:
 *                            some_id:
 *                               example: 4
 *                               type: number
 *                               description: The strength of the permission over the resource
 *                         
 */
controller.router.get('/:id/permissions', controller.usersPermissions())


/**
 * @openapi
 * /core/users/userInfo:
 *   get:
 *     tags:
 *       - pblc
 *     description: Get own user information
 *     summary: Get own user information
 *     parameters:
 *       - $ref: '#/components/parameters/accessToken'
 *     responses:
 *       200:
 *         description: Getting user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user'
 */
controller.router.get('/userInfo', controller.getOwnUserInformation)




/**
 * @openapi
 * /core/users/me/groups:
 *   get:
 *     tags:
 *       - pblc
 *     description: Get the groups the user is part of
 *     summary: Get the groups the user is part of
 *     parameters:
 *       - $ref: '#/components/parameters/accessToken'
 *     responses:
 *       200:
 *         description: User groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - properties:
 *                       role:
 *                         type: string
 *                         enum: [LEARNER, INSTRUCTOR, ADMIN, SUPER-ADMIN]
 *                         description: the role the user has on this group
 *                   - $ref: '#/components/schemas/group'
 */
controller.router.get('/me/groups', controller.getUsersGroups())


/**
 * @openapi
 * /core/users/{userId}/groups:
 *   get:
 *     tags:
 *       - pblc
 *     description: Get the groups the user is part of
 *     summary: Get the groups the user is part of
 *     parameters:
 *       - $ref: '#/components/parameters/accessToken'
 *       - in: path
 *         name: userId
 *         description: id of the user
 *         required: true
 *         schema:
 *              type: string
 *     responses:
 *       200:
 *         description: User groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - properties:
 *                       role:
 *                         type: string
 *                         enum: [LEARNER, INSTRUCTOR, ADMIN, SUPER-ADMIN]
 *                         description: the role the user has on this group
 *                   - $ref: '#/components/schemas/group'
 */
controller.router.get('/:id/groups', controller.getUsersGroups())


/**
 * @openapi
 * /core/users/me/roles:
 *   get:
 *     tags:
 *       - pblc
 *     description: Get the roles of the user (descends from the groups)
 *     summary: Get the roles of the user
 *     parameters:
 *       - $ref: '#/components/parameters/accessToken'
 *     responses:
 *       200:
 *         description: User roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - properties:
 *                       roles:
 *                         type: array
 *                         description: the roles the user has
 *                         items:
 *                           type: string
 *                           enum: [LEARNER, INSTRUCTOR, ADMIN, SUPER-ADMIN]
 *                   - $ref: '#/components/schemas/group'
 */
controller.router.get('/me/roles', controller.getUsersRoles())
/**
 * @openapi
 * /core/users/{userId}/roles:
 *   get:
 *     tags:
 *       - pblc
 *     description: Get the roles of the user (descends from the groups)
 *     summary: Get the roles of the user
 *     parameters:
 *       - $ref: '#/components/parameters/accessToken'
 *       - in: path
 *         name: userId
 *         description: id of the user
 *         required: true
 *         schema:
 *              type: string
 *     responses:
 *       200:
 *         description: User roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - properties:
 *                       roles:
 *                         type: array
 *                         description: the roles the user has
 *                         items:
 *                           type: string
 *                           enum: [LEARNER, INSTRUCTOR, ADMIN, SUPER-ADMIN]
 *                   - $ref: '#/components/schemas/group'
 */
controller.router.get('/:id/roles', controller.getUsersRoles())

/**
 * @openapi
 * /core/users:
 *   post:
 *     tags:
 *       - pblc
 *     description: Register user. The instructions will send to the email provided in the payload
 *     summary: Register user. The instructions will send to the email provided in the payload
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               givenName:
 *                 type: string
 *                 default: Max
 *               familyName:
 *                 type: string
 *                 default: Mustermann
 *               password:
 *                 type: string
 *                 default: 12345
 *               email:
 *                 type: string
 *                 default: Max@Mustermann.de
 *     responses:
 *       200:
 *         description: Successfully registerd user (not yet activated). Instructions will be sent to the provided E-Mail
 */
controller.router.post('/', checkSchema({
    familyName: {
        exists: true,

        isString: true
    },
    givenName: {
        exists: true,
        isString: true
    },
    password: {
        exists: true,
        isString: true,
        isLength: {
            options: { min: 5 }
        }
    },
    email: {
        exists: true,
        isString: true,
        isEmail: {
            bail: true
        },
        custom: {
            options: (value, { req }) => {
                return UserDAO.findById(value).then((user) => Promise.reject({ message: `Username: ${value} already exists. Please choose another name!`, status: 400 }))
                    .catch((err) => {
                        if (err.status === 404) return Promise.resolve(true)
                        return Promise.reject(err.message || err)
                    })
            },
            errorMessage: 'E-Mail already registered!'
        }

    }


}))

/**
 * @openapi
 * /core/users/{userId}:
 *   get:
 *     tags:
 *       - pblc
 *     description: Get own user information
 *     summary: Get own user information
 *     parameters:
 *       - $ref: '#/components/parameters/accessToken'
 *       - in: path
 *         name: userId
 *         description: id of the user
 *         required: true
 *         schema:
 *            type: string
 *     responses:
 *       200:
 *         description: Getting user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user'
 */
controller.router.use('/:id', AuthGuard.requireUserAuthentication({ sameUserAsId: true }))


controller.activateStandardRouting();
export default controller;

