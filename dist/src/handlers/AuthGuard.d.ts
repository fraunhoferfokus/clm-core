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
    /** Normalize a group token by trimming and unifying delimiter spacing */
    private static normalizeGroupToken;
    /** Parse a single group entry into base displayName and optional suffix role token */
    private static parseGroupEntry;
    /** Map suffix token to internal role display name */
    private static suffixToInternalRole;
    /** Ensure a group exists with the given role connected; create if missing */
    private static ensureGroupWithRole;
    /** Ensure the hierarchy Admin -> Instructor -> Learner exists for a base group */
    private static ensureHierarchy;
    /** Parse the claim and synchronize user's memberships */
    private static syncGroupsAndMembershipsFromClaims;
}
//# sourceMappingURL=AuthGuard.d.ts.map