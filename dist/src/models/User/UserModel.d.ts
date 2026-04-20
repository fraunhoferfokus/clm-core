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