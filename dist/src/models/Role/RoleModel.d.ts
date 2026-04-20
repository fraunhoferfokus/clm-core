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