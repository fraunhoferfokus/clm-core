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


import GroupDAO from '../Group/GroupDAO'
import RelationModel from './RelationModel'
// import CouchUserDAO from '../User/CouchUserDAO'
import UserDAO from '../User/UserDAO'
import { UserModel } from '../User/UserModel'
import RelationDAO from './RelationDAO'
import BaseBackendDTO from '../BaseBackendDTO'
import AdapterInterface from '../AdapterInterface'
import RoleDAO from '../Role/RoleDAO'
import { RoleModel } from '../Role/RoleModel'







/**
 * @public
 * The available roles. The number symbolize the strength of the role. The higher the number the stronger the role
 */
export interface Role {
    LEARNER: number,
    INSTRUCTOR: number,
    ADMIN: number,
    'SUPER-ADMIN': number
}

/**
 * The permissions a user has on a group
 * @public
 */
export interface GroupPermission {
    /**
     * {@inheritDoc GroupModel.displayName}
     */
    displayName: string;
    /**
     * {@inheritDoc BaseDatamodel._id}
     */
    _id: string;
    /**
     * {@inheritDoc BaseDatamodel._rev}
     */
    _rev?: string | undefined;
    /**
     * {@inheritDoc BaseDatamodel.createdAt}
     */
    createdAt: Date;
    /**
     * {@inheritDoc BaseDatamodel.updatedAt}
     */
    updatedAt: Date;
    /**
     * The role the user has in this group. The role can be passed down from parent group.
     */
    role: Role
}

/**
 * @public
 * (Optional) payload passed to the method {@link RelationBDTO.getUsersGroups}
 */
export interface UserGroupOptions {
    /**
     * The relation-resources can be passed earlier instead
     */
    preRelations?: RelationModel[],
    /**
     * Whether to only show the root-groups of the user or not.
     * 
    //  * Example A: User is enrolled in Group-1 with following hierarchy Group-1-\> Group-2 -\> Group-\> 3. Only Group 1 will be returned.
     * 
     * Example B: User is enrolled in Group-1, Group-2 with following hierarchy Group-1-\> Group-2 -\> Group-\> 3. Group-1 and Group-2 will be returned.
    */
    localRootGroups?: boolean
}

/**
 * @public
 * Payload passed to the method {@link RelationBDTO.mapRecursiveResources}
 */
export interface PreFetchOptions {
    /**
     * The relation-resources can be passed earlier instead
     */
    preRelations?: RelationModel[],

}

/**
 * Backend DTO for relations. Based on {@link RelationModel} 
 * The instance {@link relationBDTOInstance} is provided.
 * Uses as default {@link MariaAdapter} for persistence layer
 * @public
 */

export class RelationBDTO {

    adapter: AdapterInterface<RelationModel>
    constructor(adapter: AdapterInterface<RelationModel>) {
        this.adapter = adapter
    }


    /**
     * Creates a new relation between two nodes
     * @param relation -
     * @param checkRecursivity - Checks whether a recursive dependency exists in the graph
     * @returns 
     */
    async createRelationship(
        relation: RelationModel,
        checkRecursivity = false
    ): Promise<boolean> {
        try {
            if (checkRecursivity && await this.isRecursive(relation)) throw { message: `Recursive error for id: ${relation.toId} `, status: 400 }
            return this.adapter.insert(relation).then(() => true)

        } catch (err) {

            throw err
        }
    }

    private async isRecursive(
        relation: RelationModel
    ): Promise<boolean> {
        const relations = (await this.adapter.findAll())

        if (relations.find((item) => item.fromId === relation.fromId && item.toId === relation.toId)) {
            throw { message: "that relation already exists", status: 400 }

        }


        const resp = await Promise.all([this.geRecursiveParentsIds(relation), this.getRecursiveChildrenIds(relation)])
        let ids = [...resp[0], ...resp[1]]
        if (ids.includes(relation.toId)) throw { message: "Recursive dependecy" }

        return false
    }

    private async geRecursiveParentsIds(relation: RelationModel, opt?: { preRelations?: RelationModel[] }) {

        let ids: string[] = [relation.fromId]
        const [allRelations] = await Promise.all([opt?.preRelations || RelationDAO.findAll()])
        let resourceHasParent = allRelations.find((item) =>
            relation.fromType === item.fromType &&
            relation.toType === item.toType &&
            relation.fromId === item.toId &&
            item.fromType === item.toType
        )!
        if (resourceHasParent) ids = ids.concat(await this.geRecursiveParentsIds(resourceHasParent!))
        return ids;
    }


    private async getRecursiveChildrenIds(relation: RelationModel, switchId = false, opt?: { preRelations?: RelationModel[] }) {
        let ids: string[] = [switchId ? relation.toId : relation.fromId]
        const [allRelations] = await Promise.all([opt?.preRelations || RelationDAO.findAll()])
        let resourceHasChildren = allRelations.filter((item) => {
            relation.fromType === item.fromType &&
                relation.toType === item.toType &&
                relation.fromId === (switchId ? relation.toId : relation.fromId)
            item.fromType === item.toType

        })
        for (const resourceHasChild of resourceHasChildren) {
            ids = ids.concat(await this.getRecursiveChildrenIds(resourceHasChild, !switchId, { preRelations: opt?.preRelations }))
        }
        return ids;

    }

    /**
     * Gets the users groups
     * @param userId - The id of the user
     * @param options -
     * @returns 
     */
    async getUsersGroups(
        userId: string,
        options: UserGroupOptions = {}
    ): Promise<GroupPermission[]> {
        const [relations, groups] = await Promise.all([options.preRelations || this.adapter.findAll(), GroupDAO.findAll()])

        let userPermissions = await this.usersPermissionMap(userId, { preRelations: relations });
        let groupPermissions: GroupPermission[] = []
        for (let id in userPermissions) {
            let group = groups.find((group) => group._id === id)

            if (group) {
                let groupHasRole = relations.find((relation) => relation.fromId === id && relation.fromType === 'group' && relation.toType === 'role')            
                let role = await RoleDAO.findById(groupHasRole!.toId)

                groupPermissions.push({ ...group, role: role.displayName.toUpperCase() as any })
            }
        }
        return groupPermissions
    }

    private async usersPermissionMap(
        userId: string,
        options: { preRelations?: RelationModel[] } = {}
    ) {
        const [relations] = await Promise.all([options.preRelations || this.adapter.findAll()])

        const userIsInGroups = relations.filter((relation) =>
            relation.toId === userId
            && relation.fromType === 'group'
            && relation.toType === 'user'
        )

        let globalyViewed: { [key: string]: any } = {};

        for (const userIsInGroup of userIsInGroups) {
            let groupId = userIsInGroup.fromId
            let groupHasRoleRelation = relations.find((relation) => relation.fromId === groupId && relation.fromType === 'group' && relation.toType === 'role')
            let role = await RoleDAO.findById(groupHasRoleRelation!.toId)

            if (!globalyViewed[`${groupId}`]) globalyViewed[`${groupId}`] = role.resourcePermissions.group
            if (!globalyViewed[`${userIsInGroup.toId}`]) globalyViewed[`${userIsInGroup.toId}`] = role.resourcePermissions.user
            if (!globalyViewed[`${userIsInGroup._id}`]) globalyViewed[`${userIsInGroup._id}`] = role.resourcePermissions.user

            let groupHasRessources = relations.filter(
                (relation) =>
                    relation.fromId === groupId
                    && relation.fromType === 'group'
                    && relation.toId !== userIsInGroup.toId
            )

            for (const resource of groupHasRessources) {
                let crudPermission = role.resourcePermissions[resource.toType as keyof typeof role.resourcePermissions]
                if(!globalyViewed[`${resource._id}`]) globalyViewed[`${resource._id}`] = crudPermission
                if (!globalyViewed[`${resource.toId}`]) globalyViewed[`${resource.toId}`] = crudPermission
                await this.groupHasRessources(resource, relations, globalyViewed, role)
            }
        }
        return globalyViewed
    }

    private async groupHasRessources
        (
            relation: RelationModel,
            relations: RelationModel[],
            globalyViewed: { [key: string]: any },
            role: RoleModel
        ) {
        let { _id: relationId, fromType, toType, fromId, toId } = relation

        if (toType === 'role') return

        let resourceHasResources = relations.filter((item) =>
            item.fromId === toId
        )

        let roleRelation = resourceHasResources.find((item) => item.toType === 'role')
        if (roleRelation) {
            let secondRole = await RoleDAO.findById(roleRelation.toId)
            if (role.lineage) {
                for (let key in secondRole.resourcePermissions) {
                    let key_ = key as keyof typeof role.resourcePermissions
                    role.resourcePermissions[key_] = role.resourcePermissions[key_] | secondRole.resourcePermissions[key_]
                }
            } else {
                role.resourcePermissions = secondRole.resourcePermissions
            }
        }

        for (const resource of resourceHasResources) {
            if (resource.toType === 'role') continue
            let crudPermission = role.resourcePermissions[resource.toType as keyof typeof role.resourcePermissions]
            if(!globalyViewed[`${resource._id}`]) globalyViewed[`${resource._id}`] = crudPermission
            if (!globalyViewed[`${resource.toId}`]) globalyViewed[`${resource.toId}`] = crudPermission
            await this.groupHasRessources(resource, relations, globalyViewed, role)
        }
        return globalyViewed
    }

    private async getUserRoles(
        userId: string,
        isSuperAdmin = false
    ) {
        let roles: string[] = []
        if (isSuperAdmin) roles.push('SUPER-ADMIN')
        const [relations, groups] = await Promise.all([this.adapter.findAll(), GroupDAO.findAll()])
        const userHasGroups = relations.filter((relation) => relation.fromId === userId && relation.toType === 'group')
        for (const userHasGroup of userHasGroups) {
            const groupHasRole = relations.find((relation) => relation.toType === 'role' && relation.fromId === userHasGroup.fromId)!
            roles = [...new Set([...roles, groupHasRole.toId])]
        }
        return roles
    }

    /**
     * Get all the resources that the user has access to
     * 
     */
    async getAllGroupRelations() {
        const relations = await this.adapter.findAll()
        return relations.filter((relation) => relation.fromType === 'group')
    }

    /**
     * Add a user to a group
     * @param userId - The id of the user
     * @param targetGroupId - The id of the group
     * @returns 
     */
    async addUserToGroup(
        userId: string,
        targetGroupId: string
    ) {
        let user: UserModel;

        try {
            user = await UserDAO.findById(userId)
        } catch (err: any) {
            throw { status: 202, message: err }
        }

        try {
            await GroupDAO.findById(targetGroupId)
        } catch (err) {
            throw err
        }

        try {
            const relations = await this.getAllGroupRelations()
            if (relations.find((item) => item.toId === userId && item.fromId === targetGroupId && item.fromType === 'group')) throw { status: 202, message: `already enrolled in that group!` }
        } catch (err) {
            throw err
        }


        return Promise.all([]).then(() =>
            Promise.all([
                // this.createRelationship(new RelationModel({ fromId: userId, fromType: 'user', toId: targetGroupId, toType: 'group' }), true),
                this.createRelationship(new RelationModel({ fromId: targetGroupId, fromType: 'group', toId: userId, toType: 'user' }), true)
            ])
        )

    }

    /**
     * Remove a user from a group
     * @param userId - The id of the user
     * @param targetGroupId - The id of the group
     * @returns 
     */
    async removeUserFromGroup(
        userId: string,
        targetGroupId: string
    ) {
        let user: UserModel;

        try {
            user = await UserDAO.findById(userId)
        } catch (err: any) {
            throw { status: 202, message: err }
        }

        try {
            await GroupDAO.findById(targetGroupId)
        } catch (err) {
            throw err
        }

        const relations = await this.adapter.findAll()
        // const userHasGroup = relations.find((item) => item.fromId === userId && item.toId === targetGroupId
        //     && item.fromType === 'user' && item.toType === 'group'
        // )
        const groupHasUser = relations.find((item) => item.fromId === targetGroupId && item.toId === userId
            && item.fromType === 'group' && item.toType === 'user'
        )


        if (!groupHasUser) throw { status: 202, message: `User ${userId} is not enrolled in that group` }


        return this.adapter.bulkDelete([
            // { ...userHasGroup, _deleted: true } as any,
            { ...groupHasUser, _deleted: true } as any
        ])

    }

    /**
     * Add a group to a group
     * @param groupId - The id of the group
     * @param targetGroupId - The id of the target-group
     * @returns 
     */
    async addGroupToGroup(
        groupId: string,
        targetGroupId: string
    ) {
        const groupHasGroups = (await this.adapter.findAll()).filter((item) =>
            item.fromType === 'group' && item.fromId === groupId && item.toType === 'group')

        return this.createRelationship(new RelationModel({
            fromId: groupId, toId: targetGroupId, fromType: 'group', toType: 'group',
            order: groupHasGroups.length
        }), true)
    }

    /**
     * {@inheritDoc BaseDAO.findAll}
     */
    async findAll() {
        return this.adapter.findAll()
    }


    /**
     * {@inheritDoc BaseDAO.findById}
     */
    async findById(id: string) {
        return this.adapter.findById(id)
    }


    /**
     * {@inheritDoc BaseDAO.bulkDelete}
     */
    async bulkDelete(docs: RelationModel[]) {
        return this.adapter.bulkDelete(docs)
    }


    /**
     * {@inheritDoc BaseDAO.bulkUpdate}
     */
    async bulkUpdate(docs: RelationModel[]) {
        return this.adapter.bulkUpdate(docs)
    }


    /**
     * {@inheritDoc BaseDAO.bulkInsert}
     */
    async bulkInsert(docs: RelationModel[]) {
        return this.adapter.bulkInsert(docs)
    }

    /**
     * Creates a map of the user-permissions
     * @param relation - The relation to create
     * @param roleNumber - The role number of the user which
     * @param userPermissions - The permissions of the user
     * @param options - The options
     * @returns 
     */
    async mapRecursiveResources(
        relation: RelationModel,
        roleNumber: number,
        userPermissions: { [key: string]: any },
        options: PreFetchOptions = {}
    ) {
        const [relations] = await Promise.all([options.preRelations || this.findAll()]);
        if (userPermissions[`${relation.toType}s`][relation.toId] && roleNumber < userPermissions[relation.toId]) return

        userPermissions[`${relation.toType}s`][relation.toId] = roleNumber
        const resourceHasResources = relations.filter((item) =>
            item.fromId === relation.toId &&
            item.fromType === relation.toType &&
            item.toType === relation.toType
        )
        for (const resourceHasResource of resourceHasResources) {
            this.mapRecursiveResources(resourceHasResource, roleNumber, userPermissions)
        }
    }

    /**
     * Get the permissions of a user as a key-value map
     * @param userId - The id of the user
     * @returns 
     */
    async getUsersPermissions(userId: string) {
        const allRelations = await this.findAll()
        const usersPermissions = await this.usersPermissionMap(userId, { preRelations: allRelations })
        return usersPermissions
    }




}

/**
 * Instance of {@link RelationBDTO}
 * Uses as default {@link MariaAdapter} for persistence layer.
 * @public 
 */
const relationBDTOInstance = new RelationBDTO(RelationDAO)

export default relationBDTOInstance

