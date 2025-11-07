import BaseDatamodel, { iBaseDatamodel } from "../BaseDatamodel";
/**
 * @public
 * The payload which is passed to the constructor of {@link UserModel}
 */
export interface iUserModel extends iBaseDatamodel {
    _id?: string;
    password: string;
    familyName: string;
    givenName: string;
    email: string;
    isVerified?: boolean;
    isSuperAdmin?: boolean;
    identityId?: string;
}
/**
 * @public
 * User datamodel which is used by {@link UserBDTO}
 */
export declare class UserModel extends BaseDatamodel implements iUserModel {
    /**
     * E-Mail of the user
     */
    email: string;
    /**
     * Whether the user is verified or not (double-opt in)
     */
    isVerified: boolean;
    /**
     * The password of the user
     */
    password: string;
    /**
     * Given name of the user
     */
    givenName: string;
    /**
     * Family name of the user
     */
    familyName: string;
    /**
     * Whether the user has super-admin priveleges
     */
    isSuperAdmin: boolean;
    /**
     * If SSO is used, the identityId is the id of the user in the SSO system
     */
    identityId?: string | undefined;
    constructor(payload: iUserModel);
    /**
     * Hash the password before inserting the user
     */
    beforeInsert(): Promise<void>;
    /**
     * Hash the password before updating the user (if password is provided in the payload)
     * @param payload - Payload
     */
    beforeUpdate(payload: iUserModel): Promise<void>;
    /**
     * Verify the user
     *
     */
    verifyUser(): Promise<boolean>;
}
//# sourceMappingURL=UserModel.d.ts.map