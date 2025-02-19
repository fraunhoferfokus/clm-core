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
 * The payload which is passed to the constructor of {@link RelationModel}
 */
export interface iRelationModel extends iBaseDatamodel {
    /**
    * The id of the from node
    */
    fromId: string
    /**
         * The id of the to node
         */
    toId: string
    /**
    * The type of the from node
    */
    fromType: string
    /**
   * The type of the to node
   */
    toType: string
    /**
     * The order of the relation
     */
    order?: number
    /**
     * 
     */

    relationType?: string

}
/**
 * @public
 * Relation datamodel which is used by {@link RelationBDTO}
 */
export default class RelationModel extends BaseDatamodel implements iRelationModel {

    fromId: string

    toId: string

    fromType: string

    toType: string

    order?: number

    constructor(payload: iRelationModel) {
        super(payload)
        this.fromId = payload.fromId
        this.toId = payload.toId
        this.fromType = payload.fromType
        this.toType = payload.toType
        this.order = payload.order
        this.relationType = payload.relationType || 'have'
    }
    relationType: string;

}


