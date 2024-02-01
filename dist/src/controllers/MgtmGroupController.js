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
const GroupValidation_1 = require("../validationSchemas/GroupValidation");
const AuthGuard_1 = require("../handlers/AuthGuard");
// import groupRelationBackendDTO from "../models/Group/GroupRelationBackendDTO";
const GroupDAO_1 = __importDefault(require("../models/Group/GroupDAO"));
const RelationBDTO_1 = __importDefault(require("../models/Relation/RelationBDTO"));
const GroupModel_1 = __importDefault(require("../models/Group/GroupModel"));
const GroupFDTO_1 = __importDefault(require("../models/Group/GroupFDTO"));
const config_1 = require("../config/config");
const basePath = config_1.CONFIG.BASE_PATH || '/core';
const baseLocation = `${basePath}/mgmt/groups`;
class MgtmGroupController extends BaseModelController_1.default {
    getAllGroupRelations() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                let groupRelations = yield RelationBDTO_1.default.getAllGroupRelations();
                let userPermissions = (_a = req.requestingUser) === null || _a === void 0 ? void 0 : _a.permissions;
                if (!((_b = req.requestingUser) === null || _b === void 0 ? void 0 : _b.isSuperAdmin) && userPermissions) {
                    groupRelations = groupRelations
                        .filter((relation) => userPermissions === null || userPermissions === void 0 ? void 0 : userPermissions[relation._id]);
                }
                return res.json(groupRelations);
            }
            catch (err) {
                return next(err);
            }
        });
    }
    addUserToGroup() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield RelationBDTO_1.default.addUserToGroup(req.params.userId, req.params.id);
                return res.json({ message: `Added user: ${req.params.userId} to group: ${req.params.id}!` });
            }
            catch (err) {
                return next(err);
            }
        });
    }
    deleteUserFromGroup() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield RelationBDTO_1.default.removeUserFromGroup(req.params.userId, req.params.id);
                return res.status(204).send();
            }
            catch (err) {
                return next(err);
            }
        });
    }
    addGroupToGroup() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield RelationBDTO_1.default.addGroupToGroup(req.params.id, req.params.childGroupId);
                return res.json({ message: "Succesfully added group to group" });
            }
            catch (err) {
                return next(err);
            }
        });
    }
}
const controller = new MgtmGroupController(GroupDAO_1.default, GroupModel_1.default, GroupFDTO_1.default);
controller.router.use(AuthGuard_1.AuthGuard.requireUserAuthentication());
/**
 * @openapi
 * components:
 *   schemas:
 *     group:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: id of the group
 *           default: jaiosdjfiojifj2341dij
 *         displayName:
 *           type: string
 *           description: how the group should be displayed
 *           default: Example-Group
 *         updatedAt:
 *           type: string
 *           description: when the group was last updated
 *           default: 10-10-2020
 *         createdAt:
 *           type: string
 *           description: id of the group
 *           default: 10-10-2022
 *
 * paths:
 *   /core/mgmt/groups/{groupId}/users/{userId}:
 *     post:
 *       tags:
 *         - mgmt-groups
 *         - mgmt
 *       description: Add user can add a target user to a group if the user is admin and the target user in a child-group of the admin group
 *       summary: 'Add user to a group [Minimum Role: ADMIN]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *         - in: path
 *           name: groupId
 *           description: The id of the group
 *           required: true
 *           schema:
 *              type: string
 *         - in: path
 *           name: userId
 *           description: The userId of the group
 *           required: true
 *           schema:
 *              type: string
 *       responses:
 *         200:
 *           description: Successfully added user to group
 */
controller.router.post('/:id/users/:userId', AuthGuard_1.AuthGuard.permissionChecker('group', [{
        in: 'path',
        name: 'id',
    },
    {
        in: 'path',
        name: 'userId',
    }
]), controller.addUserToGroup());
/**
 * @openapi
 * paths:
 *   /core/mgmt/groups/{groupId}/users/{userId}:
 *     delete:
 *       tags:
 *         - mgmt-groups
 *         - mgmt
 *       description: A user can delete a target user from a group if the user is admin and the target user in a child-group of the admin group
 *       summary: 'Remove user from a group [Minimum Role: ADMIN]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *         - in: path
 *           name: groupId
 *           description: The id of the group
 *           required: true
 *           schema:
 *              type: string
 *         - in: path
 *           name: userId
 *           description: The userId of the group
 *           required: true
 *           schema:
 *              type: string
 *       responses:
 *         204:
 *           description: Successfully removed user from group
 *   /core/mgmt/groups:
 *     get:
 *       tags:
 *         - mgmt-groups
 *         - mgmt
 *       description: A user can access all his groups and subgroups
 *       summary: 'Get all groups [Minimum Role: LEARNER]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         200:
 *           description: Successfully removed user from group
 *           content:
 *             application/json:
 *               schema:
 *                 items:
 *                   $ref: "#/components/schemas/group"
 *     post:
 *       tags:
 *         - mgmt-groups
 *         - mgmt
 *       description: A user can create a group if hes atleast ADMIN in another group
 *       summary: 'Create group [Minimum Role: ADMIN]'
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 displayName:
 *                   type: string
 *                   description: how the group should be named
 *                   default: Example-Group
 *                 role:
 *                   type: string
 *                   enum:
 *                     - LEARNER
 *                     - INSTRUCTOR
 *                     - ADMIN
 *                   description: The role you want to give the group
 *                   default: LEARNER
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         200:
 *           description: Successfully removed user from group
 *           content:
 *             application/json:
 *               schema:
 *                 items:
 *                   $ref: "#/components/schemas/group"
 */
controller.router.delete('/:id/users/:userId', AuthGuard_1.AuthGuard.permissionChecker('group', [{
        in: 'path',
        name: 'userId',
    },
    {
        name: 'id',
        in: 'path'
    }
]), controller.deleteUserFromGroup());
controller.router.get('/', AuthGuard_1.AuthGuard.permissionChecker('group'));
controller.router.post('/', AuthGuard_1.AuthGuard.permissionChecker('group'), GroupValidation_1.createGroupValidation);
/**
 * @openapi
 * paths:
 *   /core/mgmt/groups/relations:
 *     get:
 *       tags:
 *         - mgmt-groups
 *       description: Getting all relations of the groups the user is part of
 *       summary: 'Get group-relations [Minimum Role: LEARNER]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *       responses:
 *         200:
 *           description: Successfully added group to a group
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/relation'
 * */
controller.router.get('/relations', AuthGuard_1.AuthGuard.permissionChecker('group'), controller.getAllGroupRelations());
/**
 * @openapi
 * paths:
 *   /core/mgmt/groups/{groupId}:
 *     patch:
 *       tags:
 *         - mgmt-groups
 *         - mgmt
 *       description: A user can update a group if he has admin privileges on that group
 *       summary: 'Updating a specific group [Minimum Role: ADMIN]'
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 displayName:
 *                   type: string
 *                   description: how the group should be named
 *                   default: Example-Group
 *                 role:
 *                   type: string
 *                   enum:
 *                     - LEARNER
 *                     - INSTRUCTOR
 *                     - ADMIN
 *                   description: The role you want to give the group
 *                   default: LEARNER
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *         - in: path
 *           required: true
 *           name: groupId
 *           description: the id of the group
 *           schema:
 *              type: string
 *       responses:
 *         200:
 *           description: Successfully updated a group
 *           content:
 *             application/json:
 *               schema:
 *                 items:
 *                   $ref: '#/components/schemas/group'
 *     delete:
 *       tags:
 *         - mgmt-groups
 *         - mgmt
 *       description: A user can delete a group if he has admin privileges on that group
 *       summary: 'Delete a specific group [Minimum Role: ADMIN]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *         - in: path
 *           required: true
 *           name: groupId
 *           description: the id of the group
 *           schema:
 *              type: string
 *       responses:
 *         204:
 *           description: Successfully deleted a group
 */
controller.router.put('/:id', AuthGuard_1.AuthGuard.permissionChecker('group'), GroupValidation_1.updateGroupValidation);
controller.router.patch('/:id', AuthGuard_1.AuthGuard.permissionChecker('group'), GroupValidation_1.updateGroupValidation);
controller.router.delete('/:id', AuthGuard_1.AuthGuard.permissionChecker('group'));
/**
 * @openapi
 * paths:
 *  /core/mgmt/groups/{groupId}/groups/{childGroupId}:
 *      post:
 *       tags:
 *         - mgmt-groups
 *         - mgmt
 *       description: A user can add a group to a group if he has has admin privileges on the from group and the target group
 *       summary: 'Add group to group [Minimum Role: ADMIN]'
 *       parameters:
 *         - $ref: '#/components/parameters/accessToken'
 *         - in: path
 *           name: groupId
 *           description: the id of the group
 *           required: true
 *           schema:
 *              type: string
 *         - in: path
 *           name: childGroupId
 *           description: the id of the child-group
 *           required: true
 *           schema:
 *              type: string
 *       responses:
 *         204:
 *           description: Successfully added a group to a group
 */
controller.router.post('/:id/groups/:childGroupId', AuthGuard_1.AuthGuard.permissionChecker('group', [{ in: 'path', name: 'id' },
    { in: 'path', name: 'childGroupId' }
]), controller.addGroupToGroup());
controller.activateStandardRouting();
exports.default = controller;
