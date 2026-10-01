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
import { Logger } from '../../lib/utils/logger'

const logger = new Logger({ name: 'RelationBDTO', level: (process.env.LOG_LEVEL as any) || 'info' })







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

    private buildRelationsByFromId(relations: RelationModel[]) {
        const relationsByFromId = new Map<string, RelationModel[]>()

        for (const relation of relations) {
            const key = `${relation.fromType}:${relation.fromId}`
            const current = relationsByFromId.get(key)
            if (current) current.push(relation)
            else relationsByFromId.set(key, [relation])
        }

        return relationsByFromId
    }

    private cloneRole(role: RoleModel): RoleModel {
        return new RoleModel({
            ...role,
            resourcePermissions: { ...role.resourcePermissions }
        })
    }

    private getRelationVisitKey(relation: RelationModel) {
        return `${relation.fromType}:${relation.fromId}->${relation.toType}:${relation.toId}`
    }

    private async getRoleById(roleId: string, cache: Map<string, Promise<RoleModel>>) {
        if (!cache.has(roleId)) cache.set(roleId, RoleDAO.findById(roleId))
        return cache.get(roleId)!
    }

    private updatePermissionMap(
        permissionMap: { [key: string]: any },
        key: string,
        permission: number
    ) {
        const current = permissionMap[key]
        if (current === undefined || current <= permission) permissionMap[key] = permission
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
            logger.debug(`createRelationship: ${relation.fromId} (${relation.fromType}) -> ${relation.toId} (${relation.toType})`)
            await this.adapter.insert(relation)
            return true
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

    private async geRecursiveParentsIds(
        relation: RelationModel,
        opt?: { preRelations?: RelationModel[] },
        visited = new Set<string>()
    ) {

        const visitKey = this.getRelationVisitKey(relation)
        if (visited.has(visitKey)) return []
        visited.add(visitKey)

        let ids: string[] = [relation.fromId]
        const allRelations = opt?.preRelations || await RelationDAO.findAll()
        const resourceHasParents = allRelations.filter((item) =>
            relation.fromType === item.fromType &&
            relation.toType === item.toType &&
            relation.fromId === item.toId &&
            item.fromType === item.toType
        )

        for (const resourceHasParent of resourceHasParents) {
            ids = ids.concat(await this.geRecursiveParentsIds(resourceHasParent, { preRelations: allRelations }, visited))
        }

        return [...new Set(ids)];
    }


    private async getRecursiveChildrenIds(
        relation: RelationModel,
        switchId = false,
        opt?: { preRelations?: RelationModel[] },
        visited = new Set<string>()
    ) {
        const visitKey = `${this.getRelationVisitKey(relation)}:${switchId ? 'to' : 'from'}`
        if (visited.has(visitKey)) return []
        visited.add(visitKey)

        const currentId = switchId ? relation.toId : relation.fromId
        let ids: string[] = [currentId]
        const allRelations = opt?.preRelations || await RelationDAO.findAll()
        const resourceHasChildren = allRelations.filter((item) =>
            item.fromType === item.toType &&
            item.fromType === relation.fromType &&
            item.fromId === currentId
        )

        for (const resourceHasChild of resourceHasChildren) {
            ids = ids.concat(await this.getRecursiveChildrenIds(resourceHasChild, !switchId, { preRelations: allRelations }, visited))
        }

        return [...new Set(ids)];

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
        const relations = options.preRelations || await this.adapter.findAll()
        const relationsByFromId = this.buildRelationsByFromId(relations)
        const roleCache = new Map<string, Promise<RoleModel>>()
        const groupRoleRelationByGroupId = new Map(
            relations
                .filter((relation) => relation.fromType === 'group' && relation.toType === 'role')
                .map((relation) => [relation.fromId, relation] as const)
        )

        const userIsInGroups = relations.filter((relation) =>
            relation.toId === userId
            && relation.fromType === 'group'
            && relation.toType === 'user'
        )

        let globalyViewed: { [key: string]: any } = {};

        for (const userIsInGroup of userIsInGroups) {
            let groupId = userIsInGroup.fromId
            let groupHasRoleRelation = groupRoleRelationByGroupId.get(groupId)
            if (!groupHasRoleRelation) continue
            let role = this.cloneRole(await this.getRoleById(groupHasRoleRelation.toId, roleCache))

            this.updatePermissionMap(globalyViewed, `${groupId}`, role.resourcePermissions.group)
            this.updatePermissionMap(globalyViewed, `${userIsInGroup.toId}`, role.resourcePermissions.user)
            this.updatePermissionMap(globalyViewed, `${userIsInGroup._id}`, role.resourcePermissions.user)

            let groupHasRessources = (relationsByFromId.get(`group:${groupId}`) || []).filter(
                (relation) => relation.toId !== userIsInGroup.toId && relation.toType !== 'role'
            )

            for (const resource of groupHasRessources) {
                let crudPermission = role.resourcePermissions[resource.toType as keyof typeof role.resourcePermissions]
                this.updatePermissionMap(globalyViewed, `${resource._id}`, crudPermission)
                this.updatePermissionMap(globalyViewed, `${resource.toId}`, crudPermission)

                await this.groupHasRessources(resource, relationsByFromId, globalyViewed, role, roleCache, new Set())
            }
        }
        return globalyViewed
    }

    private async groupHasRessources
        (
            relation: RelationModel,
            relationsByFromId: Map<string, RelationModel[]>,
            globalyViewed: { [key: string]: any },
            role: RoleModel,
            roleCache: Map<string, Promise<RoleModel>>,
            visited: Set<string>
        ) {
        const visitKey = this.getRelationVisitKey(relation)
        if (visited.has(visitKey)) return globalyViewed
        visited.add(visitKey)

        let { toType, toId } = relation

        if (toType === 'role') return

        let resourceHasResources = relationsByFromId.get(`${toType}:${toId}`) || []

        let roleRelation = resourceHasResources.find((item) => item.toType === 'role')
        if (roleRelation) {
            let secondRole = this.cloneRole(await this.getRoleById(roleRelation.toId, roleCache))
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
            this.updatePermissionMap(globalyViewed, `${resource._id}`, crudPermission)
            this.updatePermissionMap(globalyViewed, `${resource.toId}`, crudPermission)
            await this.groupHasRessources(resource, relationsByFromId, globalyViewed, this.cloneRole(role), roleCache, new Set(visited))
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
     * Get the raw group-membership relations for a user (group -\> user), including relationType.
     * Unlike {@link getUsersGroups}, this returns the actual relation records instead of a flattened
     * permission view, so callers can distinguish who/what created each membership.
     * @param userId - The id of the user
     * @returns
     */
    async getUserGroupRelations(userId: string): Promise<RelationModel[]> {
        const relations = await this.adapter.findAll()
        return relations.filter((relation) =>
            relation.fromType === 'group' && relation.toType === 'user' && relation.toId === userId
        )
    }

    /**
     * Add a user to a group
     * @param userId - The id of the user
     * @param targetGroupId - The id of the group
     * @param relationType - Optional marker for who/what created this membership (e.g. 'oidc-managed').
     *        Defaults to RelationModel's own default ('have') when omitted.
     * @returns
     */
    async addUserToGroup(
        userId: string,
        targetGroupId: string,
        relationType?: string
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
                this.createRelationship(new RelationModel({
                    fromId: targetGroupId, fromType: 'group', toId: userId, toType: 'user',
                    ...(relationType ? { relationType } : {})
                }), true).catch((e) => {
                    // Re-throw so callers see the error; the original lost this silently.
                    throw e
                })
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
    async getUsersPermissions(userId: string, options: PreFetchOptions = {}) {
        const allRelations = options.preRelations || await this.findAll()
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

