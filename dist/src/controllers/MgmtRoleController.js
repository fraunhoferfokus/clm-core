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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuthGuard_1 = require("../handlers/AuthGuard");
const RoleDAO_1 = __importDefault(require("../models/Role/RoleDAO"));
const RoleFDTO_1 = __importDefault(require("../models/Role/RoleFDTO"));
const RoleModel_1 = require("../models/Role/RoleModel");
const BaseModelController_1 = __importDefault(require("./BaseModelController"));
const RoleValidation_1 = require("../validationSchemas/RoleValidation");
class MgmtRoleController extends BaseModelController_1.default {
}
const controller = new MgmtRoleController(RoleDAO_1.default, RoleModel_1.RoleModel, RoleFDTO_1.default);
controller.removeRoute('/', ['delete']);
/**
 * @openapi
 * paths:
 *  /core/mgmt/roles/{id}:
 *    delete:
 *      tags:
 *       - mgmt-roles
 *       - mgmt
 *      description: Delete a role
 *      summary: 'Delete a role [Minimum Role: SUPER-ADMIN]'
 *      parameters:
 *          - $ref: '#/components/parameters/accessToken'
 *          - name: id
 *            in: path
 *            required: true
 *            description: The id of the role to update
 *            schema:
 *              type: string
 *      responses:
 *          200:
 *           description: Successfully deleted role
 */
controller.router.delete('/:id', AuthGuard_1.AuthGuard.permissionChecker('role'), RoleValidation_1.deleteRoleSchemaValidator);
/**
 * @openapi
 *  /core/mgmt/roles/{id}:
 *    patch:
 *      tags:
 *       - mgmt-roles
 *       - mgmt
 *      description: Update a role
 *      summary: 'Update a role [Minimum Role: SUPER-ADMIN]'
 *      parameters:
 *          - $ref: '#/components/parameters/accessToken'
 *          - name: id
 *            in: path
 *            required: true
 *            description: The id of the role to update
 *            schema:
 *              type: string
 *      requestBody:
 *          description: The role to update
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/createUpdateRole'
 *      responses:
 *         200:
 *          description: Successfully updated role
 */
controller.router.patch('/:id', AuthGuard_1.AuthGuard.permissionChecker('role'), RoleValidation_1.updateRoleSchemaValidator);
/**
 * @openapi
 *  /core/mgmt/roles/{id}:
 *    put:
 *      tags:
 *       - mgmt-roles
 *       - mgmt
 *      description: Update a role
 *      summary: 'Update a role [Minimum Role: SUPER-ADMIN]'
 *      requestBody:
 *          description: The role to update
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/createUpdateRole'
 *      parameters:
 *          - $ref: '#/components/parameters/accessToken'
 *          - name: id
 *            in: path
 *            required: true
 *            description: The id of the role to update
 *            schema:
 *              type: string
 *      responses:
 *         200:
 *          description: Successfully updated role
 */
controller.router.put('/:id', AuthGuard_1.AuthGuard.permissionChecker('role'), RoleValidation_1.updateRoleSchemaValidator);
/**
 * @openapi
 * components:
 *   schemas:
 *     role:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: id of the group
 *           default: jaiosdjfiojifj2341dij
 *         displayName:
 *           type: string
 *           description: How to role is named
 *           default: Learner
 *         updatedAt:
 *           type: string
 *           description: when the group was last updated
 *           default: 10-10-2020
 *         createdAt:
 *           type: string
 *           description: id of the group
 *           default: 10-10-2022
 *         resourcePermissions:
 *           type: object
 *           description: The permissions of the group
 *           default: {lo: 15, service: 15, tool: 15, group: 15, user: 15, role: 15, consumer: 15}
 *         lineage:
 *           type: boolean
 *           description: If the group is a lineage group
 *           default: true
 *         strength:
 *           type: number
 *           description: The strength of the group
 *           default: 0
 *     createUpdateRole:
 *         type: object
 *         properties:
 *             lineage:
 *                type: boolean
 *                description: If the group is a lineage group
 *                default: true
 *             displayName:
 *                type: string
 *                default: Learner
 *                description: How to role is named
 *             strength:
 *                type: number
 *                description: The strength of the group
 *                default: 0
 *             resourcePermissions:
 *                type: object
 *                description: The permissions of the group
 *                properties:
 *                  lo:
 *                      type: number
 *                      description: The permission for the learning object
 *                      default: 1
 *                  service:
 *                      type: number
 *                      description: The permission for the service
 *                      default: 1
 *                  tool:
 *                      type: number
 *                      description: The permission for the tool
 *                      default: 1
 *                  group:
 *                      type: number
 *                      description: The permission for the group
 *                      default: 1
 *                  user:
 *                      type: number
 *                      description: The permission for the user
 *                      default: 1
 *                  role:
 *                      type: number
 *                      description: The permission for the role
 *                      default: 1
 *                  consumer:
 *                      type: number
 *                      description: The permission for the consumer
 *                      default: 1
 *
 *
 * paths:
 *
 *   /core/mgmt/roles:
 *      get:
 *          tags:
 *           - mgmt-roles
 *           - mgmt
 *          description: Get all roles
 *          summary: 'Get all roles in the system'
 *          responses:
 *              200:
 *               description: All roles
 *               content:
 *                  application/json:
 *                      schema:
 *                       type: array
 *                       items:
 *                          $ref: '#/components/schemas/role'
 *      post:
 *       tags:
 *         - mgmt-roles
 *         - mgmt
 *       description: Add a role to the system
 *       summary: 'Add a role to the system [Minimum Role: SUPER-ADMIN]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *       requestBody:
 *          description: The user to add to the group
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/createUpdateRole'
 *
 *
 *       responses:
 *         200:
 *           description: Successfully added user to group
 */
controller.router.post('/', AuthGuard_1.AuthGuard.permissionChecker('role'), RoleValidation_1.createRoleSchemaValidator);
controller.activateStandardRouting();
exports.default = controller;
