import express from 'express';
import { RessourcePermissions } from '../models/Role/RoleModel';
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
     * @returns
     */
    static permissionChecker(ressource: keyof RessourcePermissions, targetedIds?: {
        in: 'path' | 'body';
        name: string;
    }[]): express.Handler[];
    /**
     * Require super-admin to access certain routes
     * @returns
     */
    static requireAdminUser: () => express.Handler[];
    private static sameUserAsId;
}
//# sourceMappingURL=AuthGuard.d.ts.map