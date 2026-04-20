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
