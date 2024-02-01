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

import express from 'express'
import jwt from 'jsonwebtoken'
import swaggerJsdoc from 'swagger-jsdoc'
import { CONFIG } from '../config/config'
import { AuthGuard, jwtServiceInstance, pathBDTOInstance } from '../lib/CoreLib'
import UserDAO from '../models/User/UserDAO'
import controller from './AuthController'
import MgmtRoleController from './MgmtRoleController'
import MgtmAPITokenController from './MgtmAPITokenController'
import MgtmGroupController from './MgtmGroupController'
import MgtmUserController from './MgtmUserController'
import UserController from './UserController'
/**
 * @openapi
 * components:
 *   schemas:
 *     relation:
 *       type: object
 *       properties:
 *         fromType:
 *           type: string
 *           description: The type of the node
 *           default: fromTypeNode
 *         toType:
 *           type: string
 *           description: The type of the target node
 *           default: toTypeNode
 *         fromId:
 *           type: string
 *           description: The id of the node
 *           default: fromNodeId
 *         toId:
 *           type: string
 *           description: The id of the target node
 *           default: toNodeId
 *         order:
 *           type: number
 *           description: The order of the relation. Used for example ordering the enrollments of a group/user
 *           default: 0
 *   parameters:
 *     accessToken:
 *       name: x-access-token
 *       in: header
 *       description: The access token
 *       required: true
 *       example: exampleAccessToken
 *       schema:
 *         type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *     refreshAuth:
 *       type: apiKey
 *       in: header
 *       name: x-refresh-token
 */

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CLM-Core',
            version: '1.0.0',
            description: 'API endpoints the clm-core module offers',
        },
        servers: [
            {
                "url": "{scheme}://{hostname}:{port}{path}",
                "description": "The production API server",
                "variables": {
                    "hostname": {
                        "default": "localhost",
                    },
                    "port": {
                        "default": `${CONFIG.PORT}`
                    },
                    "path": {
                        "default": ""
                    },
                    "scheme": {
                        "default": "http",
                    }
                }
            }
        ],
        security: [{
            bearerAuth: [],
        }]
    },
    apis: [
        './src/controllers/*.ts'
    ]
}
const swaggerSpecification = swaggerJsdoc(options)
const basePath = CONFIG.BASE_PATH || '/core'
const EntryPointController = express.Router()
const EXCLUDED_PATHS = [
    `${basePath}/swagger`,
    `${basePath}/roles`,
    `${basePath}/roles/:id`,
    `${basePath}/users/verifyToken/:tokenId`,
    `${basePath}/mgmt/consumers/:id/confirm`,
    `${basePath}/sso/success`,
    `/health`
]


EntryPointController.use(AuthGuard.requireAPIToken(EXCLUDED_PATHS))
EntryPointController.get('/mgmt/users/:id/token', (req, res, next) => {
    return UserDAO.findById(req.params.id)
        .then((user) => jwtServiceInstance.createToken(user))
        .then((token) => {
            let decodedA: any = jwt.decode(token);
            let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
            return res.json({ accessToken: token, accessTokenExpiresIn })
        })
        .catch((err) => next(err))
})
EntryPointController.use('/mgmt/users', MgtmUserController.router)
EntryPointController.use('/mgmt/consumers', MgtmAPITokenController.router)
EntryPointController.use('/mgmt/groups', MgtmGroupController.router)
EntryPointController.use('/mgmt/roles', MgmtRoleController.router)

/**
 * @openapi
 * components:
 *   schemas:
 *     relation:
 *       type: object
 *       properties:
 *         fromType:
 *           type: string
 *           description: The type of the node
 *           default: fromTypeNode
 *         toType:
 *           type: string
 *           description: The type of the target node
 *           default: toTypeNode
 *         fromId:
 *           type: string
 *           description: The id of the node
 *           default: fromNodeId
 *         toId:
 *           type: string
 *           description: The id of the target node
 *           default: toNodeId
 *         order:
 *           type: number
 *           description: The order of the relation. Used for example ordering the enrollments of a group/user
 *           default: 0
 *   parameters:
 *     accessToken:
 *       name: x-access-token
 *       in: header
 *       description: The access token
 *       required: true
 *       example: exampleAccessToken
 *       schema:
 *         type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *     refreshAuth:
 *       type: apiKey
 *       in: header
 *       name: x-refresh-token
 */


/**
 * @openapi
 * /core/mgmt/paths:
 *   get:
 *     tags:
 *       - mgmt-paths
 *       - mgmt
 *     description: Gets all available paths CLM offers
 *     summary: Gets all available paths CLM offers
 *     parameters: []
 *     responses:
 *       200:
 *         description: Successfully got all paths
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: the id of the path. Same as the route attribute
 *                   default: 'IdOfThePath'
 *                 route:
 *                   type: string
 *                   description: the route of the path
 *                   default: '/route/of/the/path'
 */
EntryPointController.get('/mgmt/paths', async (req, res, next) =>
    res.json((await pathBDTOInstance.findAll()).map((item) => item._id).filter((item) => !EXCLUDED_PATHS.includes(item))))
EntryPointController.use('/users', UserController.router)
EntryPointController.use('/authentication', controller.router)
EntryPointController.get('/swagger', (req, res, next) => {
    try {
        res.json(swaggerSpecification)
    } catch (err) {
        console.error(err)
        return res.status(500).json(err)
    }
})

export default EntryPointController

