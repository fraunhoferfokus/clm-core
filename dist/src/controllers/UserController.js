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
const BaseModelController_1 = __importDefault(require("./BaseModelController"));
const UserModel_1 = require("../models/User/UserModel");
const UserFDTO_1 = __importDefault(require("../models/User/UserFDTO"));
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const AuthGuard_1 = require("../handlers/AuthGuard");
const express_validator_1 = require("express-validator");
const emailService_1 = __importDefault(require("../services/emailService"));
const RelationBDTO_1 = __importDefault(require("../models/Relation/RelationBDTO"));
const config_1 = require("../config/config");
const Cryptr = require('cryptr');
const cryptr = new Cryptr('secret');
const basePath = config_1.CONFIG.BASE_PATH || '/core';
const baseLocation = `${basePath}/users`;
class UserController extends BaseModelController_1.default {
    constructor() {
        super(...arguments);
        this.getOwnUserInformation = (req, res, next) => {
            try {
                return res.json(req.requestingUser);
            }
            catch (err) {
                return next(err);
            }
        };
        this.usersPermissions = () => (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userPermissions = yield RelationBDTO_1.default.getUsersPermissions(req.requestingUser._id);
                return res.json(userPermissions);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getUsersGroups() {
        return (req, res, next) => {
            try {
                const user = req.requestingUser;
                return RelationBDTO_1.default.getUsersGroups(user === null || user === void 0 ? void 0 : user._id).then((groups) => res.json(groups));
            }
            catch (err) {
                next(err);
            }
        };
    }
    getUsersRoles() {
        return (req, res, next) => {
            try {
                const user = req.requestingUser;
                return RelationBDTO_1.default.getUsersGroups(user === null || user === void 0 ? void 0 : user._id).then((groups) => {
                    let adminGroup = [];
                    if (user === null || user === void 0 ? void 0 : user.isSuperAdmin)
                        adminGroup.push('SUPER-ADMIN');
                    res.json([...new Set([...groups.map((group) => group.role), ...adminGroup])]);
                });
            }
            catch (err) {
                next(err);
            }
        };
    }
    deleteOneDocument() {
        return (req, res, next) => {
            let user = req.requestingUser;
            if (user === null || user === void 0 ? void 0 : user.isSuperAdmin)
                return next({ message: "Cannot delete super admin!", status: 400 });
            return super.deleteOneDocument()(req, res, next);
        };
    }
    createDocument() {
        return super.createDocument(undefined, (doc, payload) => {
            return ((req, res, next) => {
                return emailService_1.default.sendMail({
                    from: config_1.CONFIG.SMTP_FROM,
                    to: req.body.email,
                    text: "Registrierung am KI-Demonstrator der Pionierschule",
                    subject: 'Registrierung am KI-Demonstrator der Pionierschule',
                    //@ts-ignore
                    template: 'register',
                    ctx: {
                        // this is available in the template
                        firstname: doc.givenName,
                        lastname: doc.familyName,
                        url: `${config_1.CONFIG.DEPLOY_URL}/users/verifyToken/${cryptr.encrypt(doc._id)}`
                    }
                }).then(() => {
                    return res.json({ message: "Check email-instruction for more information!" });
                });
            });
        });
    }
    verifyToken() {
        return (req, res, next) => {
            const id = cryptr.decrypt(req.params.tokenId);
            return UserDAO_1.default.findById(id).then((user) => {
                if (user.isVerified)
                    throw { status: 400, message: "User already verified" };
                return user.verifyUser();
                // return userDTO.verfityUser(req.params.tokenId)
            }).then(() => res.json({ message: "Successfully registerd a user!" }))
                .catch((err) => {
                if ((err === null || err === void 0 ? void 0 : err.status) === 404)
                    return next({ message: "Invalid token!", status: 404 });
                return next(err);
            });
        };
    }
}
const controller = new UserController(UserDAO_1.default, UserModel_1.UserModel, UserFDTO_1.default);
controller.removeRoute('/', ['get', 'delete', 'patch']);
controller.router.use(AuthGuard_1.AuthGuard.requireUserAuthentication());
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
controller.router.get('/verifyToken/:tokenId', controller.verifyToken());
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
controller.router.get('/me/permissions', controller.usersPermissions());
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
controller.router.get('/:id/permissions', controller.usersPermissions());
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
controller.router.get('/userInfo', controller.getOwnUserInformation);
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
controller.router.get('/me/groups', controller.getUsersGroups());
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
controller.router.get('/:id/groups', controller.getUsersGroups());
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
controller.router.get('/me/roles', controller.getUsersRoles());
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
controller.router.get('/:id/roles', controller.getUsersRoles());
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
controller.router.post('/', (0, express_validator_1.checkSchema)({
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
                return UserDAO_1.default.findById(value).then((user) => Promise.reject({ message: `Username: ${value} already exists. Please choose another name!`, status: 400 }))
                    .catch((err) => {
                    if (err.status === 404)
                        return Promise.resolve(true);
                    return Promise.reject(err.message || err);
                });
            },
            errorMessage: 'E-Mail already registered!'
        }
    }
}));
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
controller.router.use('/:id', AuthGuard_1.AuthGuard.requireUserAuthentication({ sameUserAsId: true }));
controller.activateStandardRouting();
exports.default = controller;
