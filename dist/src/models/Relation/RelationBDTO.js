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
exports.RelationBDTO = void 0;
const GroupDAO_1 = __importDefault(require("../Group/GroupDAO"));
const RelationModel_1 = __importDefault(require("./RelationModel"));
// import CouchUserDAO from '../User/CouchUserDAO'
const UserDAO_1 = __importDefault(require("../User/UserDAO"));
const RelationDAO_1 = __importDefault(require("./RelationDAO"));
const RoleDAO_1 = __importDefault(require("../Role/RoleDAO"));
/**
 * Backend DTO for relations. Based on {@link RelationModel}
 * The instance {@link relationBDTOInstance} is provided.
 * Uses as default {@link MariaAdapter} for persistence layer
 * @public
 */
class RelationBDTO {
    constructor(adapter) {
        this.adapter = adapter;
    }
    /**
     * Creates a new relation between two nodes
     * @param relation -
     * @param checkRecursivity - Checks whether a recursive dependency exists in the graph
     * @returns
     */
    createRelationship(relation, checkRecursivity = false) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (checkRecursivity && (yield this.isRecursive(relation)))
                    throw { message: `Recursive error for id: ${relation.toId} `, status: 400 };
                return this.adapter.insert(relation).then(() => true);
            }
            catch (err) {
                throw err;
            }
        });
    }
    isRecursive(relation) {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = (yield this.adapter.findAll());
            if (relations.find((item) => item.fromId === relation.fromId && item.toId === relation.toId)) {
                throw { message: "that relation already exists", status: 400 };
            }
            const resp = yield Promise.all([this.geRecursiveParentsIds(relation), this.getRecursiveChildrenIds(relation)]);
            let ids = [...resp[0], ...resp[1]];
            if (ids.includes(relation.toId))
                throw { message: "Recursive dependecy" };
            return false;
        });
    }
    geRecursiveParentsIds(relation, opt) {
        return __awaiter(this, void 0, void 0, function* () {
            let ids = [relation.fromId];
            const [allRelations] = yield Promise.all([(opt === null || opt === void 0 ? void 0 : opt.preRelations) || RelationDAO_1.default.findAll()]);
            let resourceHasParent = allRelations.find((item) => relation.fromType === item.fromType &&
                relation.toType === item.toType &&
                relation.fromId === item.toId &&
                item.fromType === item.toType);
            if (resourceHasParent)
                ids = ids.concat(yield this.geRecursiveParentsIds(resourceHasParent));
            return ids;
        });
    }
    getRecursiveChildrenIds(relation, switchId = false, opt) {
        return __awaiter(this, void 0, void 0, function* () {
            let ids = [switchId ? relation.toId : relation.fromId];
            const [allRelations] = yield Promise.all([(opt === null || opt === void 0 ? void 0 : opt.preRelations) || RelationDAO_1.default.findAll()]);
            let resourceHasChildren = allRelations.filter((item) => {
                relation.fromType === item.fromType &&
                    relation.toType === item.toType &&
                    relation.fromId === (switchId ? relation.toId : relation.fromId);
                item.fromType === item.toType;
            });
            for (const resourceHasChild of resourceHasChildren) {
                ids = ids.concat(yield this.getRecursiveChildrenIds(resourceHasChild, !switchId, { preRelations: opt === null || opt === void 0 ? void 0 : opt.preRelations }));
            }
            return ids;
        });
    }
    /**
     * Gets the users groups
     * @param userId - The id of the user
     * @param options -
     * @returns
     */
    getUsersGroups(userId, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const [relations, groups] = yield Promise.all([options.preRelations || this.adapter.findAll(), GroupDAO_1.default.findAll()]);
            let userPermissions = yield this.usersPermissionMap(userId, { preRelations: relations });
            let groupPermissions = [];
            for (let id in userPermissions) {
                let group = groups.find((group) => group._id === id);
                if (group) {
                    let groupHasRole = relations.find((relation) => relation.fromId === id && relation.fromType === 'group' && relation.toType === 'role');
                    let role = yield RoleDAO_1.default.findById(groupHasRole.toId);
                    groupPermissions.push(Object.assign(Object.assign({}, group), { role: role.displayName.toUpperCase() }));
                }
            }
            return groupPermissions;
        });
    }
    usersPermissionMap(userId, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const [relations] = yield Promise.all([options.preRelations || this.adapter.findAll()]);
            const userIsInGroups = relations.filter((relation) => relation.toId === userId
                && relation.fromType === 'group'
                && relation.toType === 'user');
            let globalyViewed = {};
            for (const userIsInGroup of userIsInGroups) {
                let groupId = userIsInGroup.fromId;
                let groupHasRoleRelation = relations.find((relation) => relation.fromId === groupId && relation.fromType === 'group' && relation.toType === 'role');
                let role = yield RoleDAO_1.default.findById(groupHasRoleRelation.toId);
                if (!globalyViewed[`${groupId}`])
                    globalyViewed[`${groupId}`] = role.resourcePermissions.group;
                if (!globalyViewed[`${userIsInGroup.toId}`])
                    globalyViewed[`${userIsInGroup.toId}`] = role.resourcePermissions.user;
                if (!globalyViewed[`${userIsInGroup._id}`])
                    globalyViewed[`${userIsInGroup._id}`] = role.resourcePermissions.user;
                let groupHasRessources = relations.filter((relation) => relation.fromId === groupId
                    && relation.fromType === 'group'
                    && relation.toId !== userIsInGroup.toId);
                for (const resource of groupHasRessources) {
                    let crudPermission = role.resourcePermissions[resource.toType];
                    if (!globalyViewed[`${resource._id}`])
                        globalyViewed[`${resource._id}`] = crudPermission;
                    if (!globalyViewed[`${resource.toId}`])
                        globalyViewed[`${resource.toId}`] = crudPermission;
                    yield this.groupHasRessources(resource, relations, globalyViewed, role);
                }
            }
            return globalyViewed;
        });
    }
    groupHasRessources(relation, relations, globalyViewed, role) {
        return __awaiter(this, void 0, void 0, function* () {
            let { _id: relationId, fromType, toType, fromId, toId } = relation;
            if (toType === 'role')
                return;
            let resourceHasResources = relations.filter((item) => item.fromId === toId);
            let roleRelation = resourceHasResources.find((item) => item.toType === 'role');
            if (roleRelation) {
                let secondRole = yield RoleDAO_1.default.findById(roleRelation.toId);
                if (role.lineage) {
                    for (let key in secondRole.resourcePermissions) {
                        let key_ = key;
                        role.resourcePermissions[key_] = role.resourcePermissions[key_] | secondRole.resourcePermissions[key_];
                    }
                }
                else {
                    role.resourcePermissions = secondRole.resourcePermissions;
                }
            }
            for (const resource of resourceHasResources) {
                if (resource.toType === 'role')
                    continue;
                let crudPermission = role.resourcePermissions[resource.toType];
                if (!globalyViewed[`${resource._id}`])
                    globalyViewed[`${resource._id}`] = crudPermission;
                if (!globalyViewed[`${resource.toId}`])
                    globalyViewed[`${resource.toId}`] = crudPermission;
                yield this.groupHasRessources(resource, relations, globalyViewed, role);
            }
            return globalyViewed;
        });
    }
    getUserRoles(userId, isSuperAdmin = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let roles = [];
            if (isSuperAdmin)
                roles.push('SUPER-ADMIN');
            const [relations, groups] = yield Promise.all([this.adapter.findAll(), GroupDAO_1.default.findAll()]);
            const userHasGroups = relations.filter((relation) => relation.fromId === userId && relation.toType === 'group');
            for (const userHasGroup of userHasGroups) {
                const groupHasRole = relations.find((relation) => relation.toType === 'role' && relation.fromId === userHasGroup.fromId);
                roles = [...new Set([...roles, groupHasRole.toId])];
            }
            return roles;
        });
    }
    /**
     * Get all the resources that the user has access to
     *
     */
    getAllGroupRelations() {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = yield this.adapter.findAll();
            return relations.filter((relation) => relation.fromType === 'group');
        });
    }
    /**
     * Add a user to a group
     * @param userId - The id of the user
     * @param targetGroupId - The id of the group
     * @returns
     */
    addUserToGroup(userId, targetGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            let user;
            try {
                user = yield UserDAO_1.default.findById(userId);
            }
            catch (err) {
                throw { status: 202, message: err };
            }
            try {
                yield GroupDAO_1.default.findById(targetGroupId);
            }
            catch (err) {
                throw err;
            }
            try {
                const relations = yield this.getAllGroupRelations();
                if (relations.find((item) => item.toId === userId && item.fromId === targetGroupId && item.fromType === 'group'))
                    throw { status: 202, message: `already enrolled in that group!` };
            }
            catch (err) {
                throw err;
            }
            return Promise.all([]).then(() => Promise.all([
                // this.createRelationship(new RelationModel({ fromId: userId, fromType: 'user', toId: targetGroupId, toType: 'group' }), true),
                this.createRelationship(new RelationModel_1.default({ fromId: targetGroupId, fromType: 'group', toId: userId, toType: 'user' }), true)
            ]));
        });
    }
    /**
     * Remove a user from a group
     * @param userId - The id of the user
     * @param targetGroupId - The id of the group
     * @returns
     */
    removeUserFromGroup(userId, targetGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            let user;
            try {
                user = yield UserDAO_1.default.findById(userId);
            }
            catch (err) {
                throw { status: 202, message: err };
            }
            try {
                yield GroupDAO_1.default.findById(targetGroupId);
            }
            catch (err) {
                throw err;
            }
            const relations = yield this.adapter.findAll();
            // const userHasGroup = relations.find((item) => item.fromId === userId && item.toId === targetGroupId
            //     && item.fromType === 'user' && item.toType === 'group'
            // )
            const groupHasUser = relations.find((item) => item.fromId === targetGroupId && item.toId === userId
                && item.fromType === 'group' && item.toType === 'user');
            if (!groupHasUser)
                throw { status: 202, message: `User ${userId} is not enrolled in that group` };
            return this.adapter.bulkDelete([
                // { ...userHasGroup, _deleted: true } as any,
                Object.assign(Object.assign({}, groupHasUser), { _deleted: true })
            ]);
        });
    }
    /**
     * Add a group to a group
     * @param groupId - The id of the group
     * @param targetGroupId - The id of the target-group
     * @returns
     */
    addGroupToGroup(groupId, targetGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            const groupHasGroups = (yield this.adapter.findAll()).filter((item) => item.fromType === 'group' && item.fromId === groupId && item.toType === 'group');
            return this.createRelationship(new RelationModel_1.default({
                fromId: groupId, toId: targetGroupId, fromType: 'group', toType: 'group',
                order: groupHasGroups.length
            }), true);
        });
    }
    /**
     * {@inheritDoc BaseDAO.findAll}
     */
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.findAll();
        });
    }
    /**
     * {@inheritDoc BaseDAO.findById}
     */
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.findById(id);
        });
    }
    /**
     * {@inheritDoc BaseDAO.bulkDelete}
     */
    bulkDelete(docs) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.bulkDelete(docs);
        });
    }
    /**
     * {@inheritDoc BaseDAO.bulkUpdate}
     */
    bulkUpdate(docs) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.bulkUpdate(docs);
        });
    }
    /**
     * {@inheritDoc BaseDAO.bulkInsert}
     */
    bulkInsert(docs) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.bulkInsert(docs);
        });
    }
    /**
     * Creates a map of the user-permissions
     * @param relation - The relation to create
     * @param roleNumber - The role number of the user which
     * @param userPermissions - The permissions of the user
     * @param options - The options
     * @returns
     */
    mapRecursiveResources(relation, roleNumber, userPermissions, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const [relations] = yield Promise.all([options.preRelations || this.findAll()]);
            if (userPermissions[`${relation.toType}s`][relation.toId] && roleNumber < userPermissions[relation.toId])
                return;
            userPermissions[`${relation.toType}s`][relation.toId] = roleNumber;
            const resourceHasResources = relations.filter((item) => item.fromId === relation.toId &&
                item.fromType === relation.toType &&
                item.toType === relation.toType);
            for (const resourceHasResource of resourceHasResources) {
                this.mapRecursiveResources(resourceHasResource, roleNumber, userPermissions);
            }
        });
    }
    /**
     * Get the permissions of a user as a key-value map
     * @param userId - The id of the user
     * @returns
     */
    getUsersPermissions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const allRelations = yield this.findAll();
            const usersPermissions = yield this.usersPermissionMap(userId, { preRelations: allRelations });
            return usersPermissions;
        });
    }
}
exports.RelationBDTO = RelationBDTO;
/**
 * Instance of {@link RelationBDTO}
 * Uses as default {@link MariaAdapter} for persistence layer.
 * @public
 */
const relationBDTOInstance = new RelationBDTO(RelationDAO_1.default);
exports.default = relationBDTOInstance;
