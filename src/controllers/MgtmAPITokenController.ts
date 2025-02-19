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

 
import { Handler } from 'express';
import BaseModelController from './BaseModelController'
import { AuthGuard } from '../handlers/AuthGuard'
import ConsumerDAO from '../models/ServiceConsumer/ConsumerDAO';
import ConsumerModel from '../models/ServiceConsumer/ConsumerModel';
import ConsumerFDTO from '../models/ServiceConsumer/ConsumerFDTO';
import { createApiTokenValidation, updateApiTokenValidation } from '../validationSchemas/ApiTokenValidation';
import transporter from '../services/emailService';
import express from 'express'
import SwaggerDefinition from '../services/SwaggerDefinition';
import { Schema } from 'swagger-jsdoc';
import { CONFIG } from '../config/config';


const Cryptr = require('cryptr');
const cryptr = new Cryptr('secret');
const basePath = CONFIG.BASE_PATH || '/core'
const baseLocation = `${basePath}/mgmt/consumers`


class MgtmTokenController extends BaseModelController<typeof ConsumerDAO, ConsumerModel, ConsumerFDTO>{

    createDocument() {
        return super.createDocument(undefined, (doc, payload) => {
            return async (req, res, next) => {
                const promises: any[] = []
                // for (const path of payload.paths) {
                //     promises.push(RelationBackendDTO.createRelationship(doc!._id, 'api_token', 'HAS', path.route, 'path', { scope: path.scope }))
                // }
                return Promise.all(promises).then((resp) => {
                    return transporter.sendMail(
                        {
                            from: '"Verfication" aws_akademie@fokus.fraunhofer.de',
                            to: req.body.userId,
                            text: "Confirm your DEV-Token",
                            subject: 'Please verify your DEV-Token',
                            html: "<b>Verify DEV-Token!</b>" +
                                `
                                Your token when verified is: <b>${doc!._id}</b>
                                <br>
                                <a href="${CONFIG.DEPLOY_URL || "http://localhost"}/mgmt/consumers/${cryptr.encrypt(doc!._id)}/confirm" >Verfiy DEV-Token!</a>`
                        }
                    ).then(() => res.json({ ...doc, paths: payload.paths })).catch((err) => {
                        console.error({ err })
                        next(err)
                    })

                })
            }
        })
    }

    confirmAPIKey(): express.Handler {
        return (req, res, next) => {
            return ConsumerDAO.findById(cryptr.decrypt(req.params.id))
                .then((token) => ConsumerDAO.updateById(token._id!, ({ active: true }) as ConsumerModel))
                .then(() => res.json({ message: "Successfullly confirmed API Token!" }))
                .catch((err) => {

                    next(err)
                })
        }
    }


}


const controller = new MgtmTokenController(ConsumerDAO, ConsumerModel, ConsumerFDTO)


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
controller.router.get('/:id/confirm', controller.confirmAPIKey())
controller.router.use(AuthGuard.requireAdminUser())



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


controller.router.get('/', AuthGuard.permissionChecker('consumer'))
controller.router.post('/', AuthGuard.permissionChecker('consumer'), createApiTokenValidation)

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

controller.router.put('/:id', AuthGuard.permissionChecker('consumer'), updateApiTokenValidation)

controller.removeRoute('/:id', ['patch'])
controller.activateStandardRouting()


export default controller

