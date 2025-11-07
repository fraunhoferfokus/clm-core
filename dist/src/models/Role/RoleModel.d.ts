export type RoleNames = 'Instructor' | 'Learner' | 'Self' | 'OrgAdmin';
export interface RessourcePermissions {
    lo: CrudPermission;
    service: CrudPermission;
    tool: CrudPermission;
    group: CrudPermission;
    user: CrudPermission;
    role: CrudPermission;
    consumer: CrudPermission;
    mcp_server: CrudPermission;
}
export declare enum CrudPermission {
    NONE = 0,
    CREATE = 1,
    READ = 2,
    UPDATE = 4,
    DELETE = 8,
    CREATE_READ = 3,
    CREATE_UPDATE = 5,
    CREATE_DELETE = 9,
    READ_UPDATE = 6,
    READ_DELETE = 10,
    UPDATE_DELETE = 12,
    CREATE_READ_UPDATE = 7,
    CREATE_READ_DELETE = 11,
    CREATE_UPDATE_DELETE = 13,
    READ_UPDATE_DELETE = 14,
    CREATE_READ_UPDATE_DELETE = 15
}
import BaseDatamodel, { iBaseDatamodel } from "../BaseDatamodel";
export interface iRoleModel extends iBaseDatamodel {
    lineage: boolean;
    resourcePermissions: RessourcePermissions;
    displayName: RoleNames;
    strength: number;
    immutable?: boolean;
}
export declare class RoleModel extends BaseDatamodel implements iRoleModel {
    constructor(payload: iRoleModel);
    immutable?: boolean | undefined;
    strength: number;
    displayName: RoleNames;
    lineage: boolean;
    resourcePermissions: RessourcePermissions;
}
//# sourceMappingURL=RoleModel.d.ts.map