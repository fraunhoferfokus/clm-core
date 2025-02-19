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
const express_1 = __importDefault(require("express"));
const CoreLib_1 = require("../lib/CoreLib");
const AuthController_1 = __importDefault(require("./AuthController"));
const MgtmAPITokenController_1 = __importDefault(require("./MgtmAPITokenController"));
const MgtmGroupController_1 = __importDefault(require("./MgtmGroupController"));
const MgtmUserController_1 = __importDefault(require("./MgtmUserController"));
const UserController_1 = __importDefault(require("./UserController"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const OIDCController_1 = __importDefault(require("./OIDCController"));
const MgmtRoleController_1 = __importDefault(require("./MgmtRoleController"));
const ResourceController_1 = __importDefault(require("./ResourceController"));
const AuthGuard_1 = require("../handlers/AuthGuard");
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
const options = {
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
                        "default": `${config_1.CONFIG.PORT}`
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
};
const swaggerSpecification = (0, swagger_jsdoc_1.default)(options);
const basePath = config_1.CONFIG.BASE_PATH || '/core';
const EntryPointController = express_1.default.Router();
const EXCLUDED_PATHS = [
    `${basePath}/swagger`,
    `${basePath}/roles`,
    `${basePath}/roles/:id`,
    `${basePath}/users/verifyToken/:tokenId`,
    `${basePath}/mgmt/consumers/:id/confirm`,
    `${basePath}/sso/oidc`,
    `${basePath}/sso/success`,
    `${basePath}/sso/oidc/backend/login`,
    `${basePath}/sso/oidc/access_token_by_code`,
    `/health`
];
EntryPointController.use('/sso/oidc', OIDCController_1.default.router);
EntryPointController.use(CoreLib_1.AuthGuard.requireAPIToken(EXCLUDED_PATHS));
EntryPointController.use('/resources', ResourceController_1.default.router);
// CONFIG.DISABLE_LEGACCY_FINDOO = true
EntryPointController.get('/mgmt/users/:id/token', config_1.CONFIG.DISABLE_LEGACCY_FINDOO ?
    CoreLib_1.AuthGuard.permissionChecker('user', [{
            in: 'path',
            name: 'id'
        }], AuthGuard_1.CrudAccess.ReadWriteDeleteUpdate) :
    ((req, res, next) => { return next(); }), ((req, res, next) => {
    return UserDAO_1.default.findById(req.params.id)
        .then((user) => CoreLib_1.jwtServiceInstance.createToken(user))
        .then((token) => {
        let decodedA = jsonwebtoken_1.default.decode(token);
        let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
        return res.json({ accessToken: token, accessTokenExpiresIn });
    })
        .catch((err) => next(err));
}));
EntryPointController.use('/mgmt/users', MgtmUserController_1.default.router);
EntryPointController.use('/mgmt/consumers', MgtmAPITokenController_1.default.router);
EntryPointController.use('/mgmt/groups', MgtmGroupController_1.default.router);
EntryPointController.use('/mgmt/roles', MgmtRoleController_1.default.router);
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
EntryPointController.get('/mgmt/paths', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () { return res.json((yield CoreLib_1.pathBDTOInstance.findAll()).map((item) => item._id).filter((item) => !EXCLUDED_PATHS.includes(item))); }));
EntryPointController.use('/users', UserController_1.default.router);
EntryPointController.use('/authentication', AuthController_1.default.router);
EntryPointController.get('/swagger', (req, res, next) => {
    try {
        res.json(swaggerSpecification);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json(err);
    }
});
exports.default = EntryPointController;
