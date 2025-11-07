/* -
 * Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 * All rights reserved.
 *
 * For more information please contact:
 * Fraunhofer FOKUS
 * Kaiserin-Augusta-Allee 31
 * 10589 Berlin, Germany
 * https://www.fokus.fraunhofer.de/go/fame
 * famecontact@fokus.fraunhofer.de
 * -
 */

import BaseDAO from "../BaseDAO";
import OIDCClientModel from "./OIDCClientModel";

const TABLENAME = 'oidc_clients'

class OIDCClientDAO extends BaseDAO<OIDCClientModel> {
    /**
     * Find OIDC client by client_id
     */
    async findByClientId(client_id: string): Promise<OIDCClientModel | undefined> {
        const clients = await this.findByAttributes({ client_id })
        return clients[0]
    }

    /**
     * Get all active OIDC clients
     */
    async findAllActive(): Promise<OIDCClientModel[]> {
        const all = await this.findAll()
        return all.filter(c => c.active)
    }
}

export default new OIDCClientDAO(TABLENAME, OIDCClientModel)
