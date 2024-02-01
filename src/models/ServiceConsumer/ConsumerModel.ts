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

 import BaseDatamodel, { iBaseDatamodel } from '../BaseDatamodel'

/**
 * Subattribute of the payload of {@link iConsumerModel}
 * @public
 */
export interface Path {
    /**
     * The method(s) which can be executed on the express route
     */
    scope: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH')[],
    /**
     * The full path of the express route
     */
    route: string

}

/**
 * @public
 * The payload which is passed to the constructor of {@link ConsumerModel}
 */
export interface iConsumerModel extends iBaseDatamodel {
    displayName: string
    active: boolean
    userId: string
    domain: string
    paths: Path[]
}

/**
 * Cnsumer datamodel which is used by {@link ConsumerBDTO}
 * @public
 * 
 */
export default class ConsumerModel extends BaseDatamodel implements iConsumerModel {
    paths: Path[]
    constructor(payload: iConsumerModel) {
        super(payload)
        this.paths = payload.paths
        this.displayName = payload.displayName
        this.active = payload.active
        this.userId = payload.userId
        this.domain = payload.domain
    }
    /**
     * Domain where the api-token is deployed 
     */
    domain: string
    /**
     * Status whether the consumer has been confirmed by double-opt in
     */
    active: boolean
    /**
     * The user responsible for the deployment of the token
     */
    userId: string
    /**
     * Name displayed on the frontend
     */
    displayName: string;
}

