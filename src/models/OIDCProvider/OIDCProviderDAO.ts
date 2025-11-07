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
import OIDCProviderModel from "./OIDCProviderModel";

const TABLENAME = 'oidc_providers'

class OIDCProviderDAO extends BaseDAO<OIDCProviderModel> {
    /**
     * Find OIDC provider by issuer
     */
    async findByIssuer(issuer: string): Promise<OIDCProviderModel | undefined> {
        const providers = await this.findByAttributes({ issuer })
        return providers[0]
    }

    /**
     * Get all active OIDC providers
     */
    async findAllActive(): Promise<OIDCProviderModel[]> {
        const all = await this.findAll()
        return all.filter(p => p.active)
    }
}

export default new OIDCProviderDAO(TABLENAME, OIDCProviderModel)
