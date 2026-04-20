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
import express from 'express';
import { RessourcePermissions } from '../models/Role/RoleModel';
export declare enum CrudAccess {
    Read = 1,
    Write = 2,
    Delete = 4,
    Update = 8,
    ReadWrite = 3,
    ReadDelete = 5,
    ReadUpdate = 9,
    ReadWriteDelete = 7,
    ReadWriteUpdate = 11,
    ReadWriteDeleteUpdate = 15,
    WriteDelete = 6,
    WriteUpdate = 10,
    WriteDeleteUpdate = 14,
    DeleteUpdate = 12
}
/**
 * @public
 * (Optional) payload for the method {@link AuthGuard.permissionChecker}
 */
export interface CheckResource {
    /**
     * Where the resource is contained
     */
    containedIn: ('body' | 'params');
    /**
     * The name of the resource
     */
    name: string;
    /**
     * The type of the resource
     */
    type: string;
    /**
     * Whether the resource is a relation
     */
    isRelation?: boolean;
}
/**
 * (Optional) payload for the method {@link AuthGuard.requireUserAuthentication}
 * @public
 */
export interface UserAuthenticationOptions {
    /**
     * Whether the id of the requested resource should be the same as the requesters id
     */
    sameUserAsId?: boolean;
}
/**
 * Static class which exposes express-auth-middlewares
 * @public
 */
export declare class AuthGuard {
    /**
     * Force api-token authentication
     * @param excluded - Array of strings which exclude certain routes to be checked against authoriziation
     * @returns
     */
    static requireAPIToken: (excluded?: string[]) => express.Handler[];
    private static isAPITokenAuthenticated;
    private static isAPITokenAuthorized;
    /**
     * Force user authentication
     * @param config - Config
     * @returns
     */
    static requireUserAuthentication(config?: UserAuthenticationOptions): express.Handler[];
    /**
     * Ensures that a route can only accessed when a user has a specific role
     * @param role - The minimum required role to access that role {@link Role}
     * @param resources - An array of resources which need to be authorized
     * @param requiredCrud - For individual Permission which is required to execute to the target ressource
     * @returns
     */
    static permissionChecker(ressource: keyof RessourcePermissions, targetedIds?: {
        in: 'path' | 'body';
        name: string;
    }[], requiredCrud?: CrudAccess): express.Handler[];
    /**
     * Require super-admin to access certain routes
     * @returns
     */
    static requireAdminUser: () => express.Handler[];
    private static sameUserAsId;
}
//# sourceMappingURL=AuthGuard.d.ts.map