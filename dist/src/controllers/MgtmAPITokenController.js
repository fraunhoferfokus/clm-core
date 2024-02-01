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
const AuthGuard_1 = require("../handlers/AuthGuard");
const ConsumerDAO_1 = __importDefault(require("../models/ServiceConsumer/ConsumerDAO"));
const ConsumerModel_1 = __importDefault(require("../models/ServiceConsumer/ConsumerModel"));
const ConsumerFDTO_1 = __importDefault(require("../models/ServiceConsumer/ConsumerFDTO"));
const ApiTokenValidation_1 = require("../validationSchemas/ApiTokenValidation");
const emailService_1 = __importDefault(require("../services/emailService"));
const config_1 = require("../config/config");
const Cryptr = require('cryptr');
const cryptr = new Cryptr('secret');
const basePath = config_1.CONFIG.BASE_PATH || '/core';
const baseLocation = `${basePath}/mgmt/consumers`;
class MgtmTokenController extends BaseModelController_1.default {
    createDocument() {
        return super.createDocument(undefined, (doc, payload) => {
            return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                const promises = [];
                // for (const path of payload.paths) {
                //     promises.push(RelationBackendDTO.createRelationship(doc!._id, 'api_token', 'HAS', path.route, 'path', { scope: path.scope }))
                // }
                return Promise.all(promises).then((resp) => {
                    return emailService_1.default.sendMail({
                        from: '"Verfication" aws_akademie@fokus.fraunhofer.de',
                        to: req.body.userId,
                        text: "Confirm your DEV-Token",
                        subject: 'Please verify your DEV-Token',
                        html: "<b>Verify DEV-Token!</b>" +
                            `
                                Your token when verified is: <b>${doc._id}</b>
                                <br>
                                <a href="${config_1.CONFIG.DEPLOY_URL || "http://localhost"}/mgmt/consumers/${cryptr.encrypt(doc._id)}/confirm" >Verfiy DEV-Token!</a>`
                    }).then(() => res.json(Object.assign(Object.assign({}, doc), { paths: payload.paths }))).catch((err) => {
                        console.error({ err });
                        next(err);
                    });
                });
            });
        });
    }
    confirmAPIKey() {
        return (req, res, next) => {
            return ConsumerDAO_1.default.findById(cryptr.decrypt(req.params.id))
                .then((token) => ConsumerDAO_1.default.updateById(token._id, ({ active: true })))
                .then(() => res.json({ message: "Successfullly confirmed API Token!" }))
                .catch((err) => {
                next(err);
            });
        };
    }
}
const controller = new MgtmTokenController(ConsumerDAO_1.default, ConsumerModel_1.default, ConsumerFDTO_1.default);
/**
 * @openapi
 * components:
 *   schemas:
 *     consumer:
 *       properties:
 *         displayName:
 *           type: string
 *           default: 'API-Token'
 *         active:
 *           type: boolean
 *           default: false
 *         userId:
 *           type: boolean
 *           description: The user who associates with that API-Token
 *           default: 'consumer@localhost.org'
 *         domain:
 *           type: string
 *           default: 'STAKEHOLDER-DOMAIN'
 *         paths:
 *           type: object
 *           properties:
 *             scope:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH']
 *               description: The HTTP methods which can be applied to the route
 *             route:
 *               type: string
 *               default: '/some/route/the/token/can/access'
 *
 * paths:
 *   /core/mgmt/consumers/{encryptedId}/confirm:
 *     get:
 *       tags:
 *         - pblc-redirect
 *       description: Double-opt in for API-Token when created.
 *       summary: Confiming API-Token
 *       parameters:
 *         - in: path
 *           name: encryptedId
 *           required: true
 *           description: The encrypted id of the API-Token
 *           schema:
 *              type: string
 *       responses:
 *         200:
 *           description: Successfully activated API-Token
 */
controller.router.get('/:id/confirm', controller.confirmAPIKey());
controller.router.use(AuthGuard_1.AuthGuard.requireAdminUser());
/**
 * @openapi
 * paths:
 *   /core/mgmt/consumers:
 *     get:
 *       tags:
 *         - mgmt-consumers
 *         - mgmt
 *       description: Super-Admin can get all API-Tokens
 *       summary: 'Get all API-Tokens [Minimum Role: SUPER-ADMIN]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         200:
 *           description: All API-Token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/consumer'
 *     post:
 *       tags:
 *         - mgmt-consumers
 *         - mgmt
 *       description: Super-Admin can get create API-Tokens
 *       summary: 'Create an API-Token [Minimum Role: SUPER-ADMIN]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         200:
 *           description: Successfully created API-Token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/consumer'
 */
controller.router.get('/', AuthGuard_1.AuthGuard.permissionChecker('consumer'));
controller.router.post('/', AuthGuard_1.AuthGuard.permissionChecker('consumer'), ApiTokenValidation_1.createApiTokenValidation);
/**
 * @openapi
 * paths:
 *  /core/mgmt/consumers/{id}:
 *     put:
 *       tags:
 *         - mgmt-consumers
 *         - mgmt
 *       description: Super-Admin can get update API-Tokens
 *       summary: 'Update an API-Token [Minimum Role: SUPER-ADMIN]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *         - in: path
 *           name: id
 *           required: true
 *           description: The id of the API-Token
 *           schema:
 *              type: string
 *       responses:
 *         200:
 *           description: Successfully updated API-Token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/consumer'
 */
controller.router.put('/:id', AuthGuard_1.AuthGuard.permissionChecker('consumer'), ApiTokenValidation_1.updateApiTokenValidation);
controller.removeRoute('/:id', ['patch']);
controller.activateStandardRouting();
exports.default = controller;
