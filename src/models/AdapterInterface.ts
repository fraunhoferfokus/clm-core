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

 import BaseDatamodel from "./BaseDatamodel";


/** Interface which database-connectors need to implement. 
 * `Datamodel` is the struture of the document which will be saved in the db. Has to extend {@link BaseDatamodel} 
 * @public 
 * @typeParam Datamodel - the struture of the document which will be saved in the db. Has to extend {@link BaseDatamodel}
 */
export default interface AdapterInterface<Datamodel extends BaseDatamodel> {
    /**
     * Whether the adapter is already initialized
     */
    isInitialized: boolean
    /**
        * The namespace where the document will be saved
    */
    tableName: string;
    /**
     * Find all the documents from the database
     * @param options - Object containing options. Options may be database specific. 
     */
    findAll(options?: any): Promise<Datamodel[]>;
    /**
     * Finds the document by id 
     * @param id - Id of the document
     * @param options - Object containing options. Options may be databse specific.
     */

    findById(id: string, options?: any): Promise<Datamodel>;
    /**
     * Finds document bt attributes
     * @param searchObject - Key Value Object which searches for a doucment by specified document parameter(s)
     */
    findByAttributes(searchObject: { [key: string]: any }): Promise<Datamodel[]>;
    /**
     * Deletes document by id
     * @param id - Id of the document
     */
    deleteById(id: string): Promise<void | boolean>;
    /**
     * Updates document by id
     * @param id - Id of the doucmnet
     * @param payload - Payload
     */
    updateById(id: string, payload: Datamodel): Promise<Datamodel>;
    /**
     * Insert a document into the database
     * @param payload - Payload
     * @param options - Object containing options. Options may be database specific
     */
    insert(payload: Datamodel, options?: any): Promise<Datamodel>;
    /**
     * Bulk inserts documents into the database
     * @param payload - Payload
     */
    bulkInsert(payload: Datamodel[]): Promise<boolean>;
    /**
     * Bulk deletes documents from the database
     * @param payload - Payload
     */
    bulkDelete(payload: Datamodel[]): Promise<boolean>;
    /**
     * Bulk updates documents from the database
     * @param payload - Payload
     */
    bulkUpdate(payload: Datamodel[]): Promise<boolean>;
    /**
     * Database specific instructions to be executed before the adapter can be used. For example creating the table with respective tablename in the database.
     * The param {@link isInitialized} must be set to true after the init function is executed.
     */
    init(): Promise<boolean>
}

