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

 import { v4 as uuidv4 } from 'uuid';


/** 
 *  The payload which is passed to the constructor of {@link BaseDatamodel} 
 * @public
 */

export interface iBaseDatamodel {
    /**
     * Unique id which identifies the document
     */
    _id?: string
    /**
     * Couch-DB specific parameter
     */
    _rev?: string
    /**
     * Time the document was created
     */
    createdAt?: Date
    /**
     * Time the document was updated
     */
    updatedAt?: Date
}


/** The base-datamodel defines attributes which every document in the database has in common 
 * @remarks Every instance of the base-datamodel (db -\> application layer) should contain standard methods  
 * @public 
 */
export default class BaseDatamodel implements iBaseDatamodel {

    _id: string
    _rev?: string
    createdAt: Date
    updatedAt: Date


    constructor(payload: iBaseDatamodel) {
        this._rev = payload._rev
        this._id = payload._id ?? uuidv4()
        this.createdAt = payload.createdAt ?? new Date();
        this.updatedAt = payload.updatedAt ?? this.createdAt;
    }

    /**
     * Execute steps after the document has been created. Will be executed by {@link BaseDAO}.
     * and should not be executed by it's own.
     * Similar to mongoose post-save-hook
     * @returns 
     * @virtual
     */
    async executeAfterCreateDependencies(): Promise<any> {
        return Promise.resolve()
    }

    /**
     * Execute steps after the document has been deleted. Will be executed by {@link BaseDAO}.
     * and should not be executed by it's own.
     * Similar to mongoose post-delete-hook
     * @returns 
     * @virtual
     */
    async executeAfterDeleteDependencies(): Promise<any> {
        return Promise.resolve()
    }

    /**
         * Execute steps before the document will be inserted. Will be executed by {@link BaseDAO} 
         * and should not be executed by it's own.
         * Similar to mongoose pre-save-hook
         * @returns 
         * @virtual
         */

    async beforeInsert(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Execute steps before the document has been updated. Will be executed by {@link BaseDAO} 
     * and should not be executed by it's own. The 'updateAt' attribute of the document will be changed by default.
     * Similar to mongoose pre-update-hook
     * @returns 
     * @virtual
     */
    async beforeUpdate(payload: iBaseDatamodel): Promise<void> {
        this.updatedAt = new Date();
        return Promise.resolve();
    }

}

