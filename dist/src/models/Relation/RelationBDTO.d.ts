import RelationModel from './RelationModel';
import AdapterInterface from '../AdapterInterface';
/**
 * @public
 * The available roles. The number symbolize the strength of the role. The higher the number the stronger the role
 */
export interface Role {
    LEARNER: number;
    INSTRUCTOR: number;
    ADMIN: number;
    'SUPER-ADMIN': number;
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
    role: Role;
}
/**
 * @public
 * (Optional) payload passed to the method {@link RelationBDTO.getUsersGroups}
 */
export interface UserGroupOptions {
    /**
     * The relation-resources can be passed earlier instead
     */
    preRelations?: RelationModel[];
    /**
     * Whether to only show the root-groups of the user or not.
     *
    //  * Example A: User is enrolled in Group-1 with following hierarchy Group-1-\> Group-2 -\> Group-\> 3. Only Group 1 will be returned.
     *
     * Example B: User is enrolled in Group-1, Group-2 with following hierarchy Group-1-\> Group-2 -\> Group-\> 3. Group-1 and Group-2 will be returned.
    */
    localRootGroups?: boolean;
}
/**
 * @public
 * Payload passed to the method {@link RelationBDTO.mapRecursiveResources}
 */
export interface PreFetchOptions {
    /**
     * The relation-resources can be passed earlier instead
     */
    preRelations?: RelationModel[];
}
/**
 * Backend DTO for relations. Based on {@link RelationModel}
 * The instance {@link relationBDTOInstance} is provided.
 * Uses as default {@link MariaAdapter} for persistence layer
 * @public
 */
export declare class RelationBDTO {
    adapter: AdapterInterface<RelationModel>;
    constructor(adapter: AdapterInterface<RelationModel>);
    /**
     * {@inheritDoc BaseDAO.init}
     */
    init(): Promise<void>;
    /**
     * Creates a new relation between two nodes
     * @param relation -
     * @param checkRecursivity - Checks whether a recursive dependency exists in the graph
     * @returns
     */
    createRelationship(relation: RelationModel, checkRecursivity?: boolean): Promise<boolean>;
    private isRecursive;
    private geRecursiveParentsIds;
    private getRecursiveChildrenIds;
    /**
     * Gets the users groups
     * @param userId - The id of the user
     * @param options -
     * @returns
     */
    getUsersGroups(userId: string, options?: UserGroupOptions): Promise<GroupPermission[]>;
    private usersPermissionMap;
    private groupHasRessources;
    private getUserRoles;
    /**
     * Get all the resources that the user has access to
     *
     */
    getAllGroupRelations(): Promise<RelationModel[]>;
    /**
     * Add a user to a group
     * @param userId - The id of the user
     * @param targetGroupId - The id of the group
     * @returns
     */
    addUserToGroup(userId: string, targetGroupId: string): Promise<[boolean]>;
    /**
     * Remove a user from a group
     * @param userId - The id of the user
     * @param targetGroupId - The id of the group
     * @returns
     */
    removeUserFromGroup(userId: string, targetGroupId: string): Promise<boolean>;
    /**
     * Add a group to a group
     * @param groupId - The id of the group
     * @param targetGroupId - The id of the target-group
     * @returns
     */
    addGroupToGroup(groupId: string, targetGroupId: string): Promise<boolean>;
    /**
     * {@inheritDoc BaseDAO.findAll}
     */
    findAll(): Promise<RelationModel[]>;
    /**
     * {@inheritDoc BaseDAO.findById}
     */
    findById(id: string): Promise<RelationModel>;
    /**
     * {@inheritDoc BaseDAO.bulkDelete}
     */
    bulkDelete(docs: RelationModel[]): Promise<boolean>;
    /**
     * {@inheritDoc BaseDAO.bulkUpdate}
     */
    bulkUpdate(docs: RelationModel[]): Promise<boolean>;
    /**
     * {@inheritDoc BaseDAO.bulkInsert}
     */
    bulkInsert(docs: RelationModel[]): Promise<boolean>;
    /**
     * Creates a map of the user-permissions
     * @param relation - The relation to create
     * @param roleNumber - The role number of the user which
     * @param userPermissions - The permissions of the user
     * @param options - The options
     * @returns
     */
    mapRecursiveResources(relation: RelationModel, roleNumber: number, userPermissions: {
        [key: string]: any;
    }, options?: PreFetchOptions): Promise<void>;
    /**
     * Get the permissions of a user as a key-value map
     * @param userId - The id of the user
     * @returns
     */
    getUsersPermissions(userId: string): Promise<{
        [key: string]: any;
    }>;
}
/**
 * Instance of {@link RelationBDTO}
 * Uses as default {@link MariaAdapter} for persistence layer.
 * @public
 */
declare const relationBDTOInstance: RelationBDTO;
export default relationBDTOInstance;
//# sourceMappingURL=RelationBDTO.d.ts.map