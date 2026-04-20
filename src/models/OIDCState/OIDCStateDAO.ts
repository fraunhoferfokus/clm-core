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
import OIDCStateModel from "./OIDCStateModel";

const TABLENAME = "oidc_states";

class OIDCStateDAO extends BaseDAO<OIDCStateModel> {
  async consume(state: string): Promise<OIDCStateModel | undefined> {
    const found = (await this.findByAttributes({ state }))[0];
    if (!found) return undefined;
    // single-use: delete after read
    try { await this.deleteById(found._id); } catch (_) {}
    return found;
  }

  async purgeExpired(): Promise<number> {
    const all = await this.findAll();
    const now = Date.now();
    const expired = all.filter(s => new Date(s.expiresAt).getTime() < now);
    if (!expired.length) return 0;
    await this.bulkDelete(expired.map(e => ({ ...e, _deleted: true }) as any));
    return expired.length;
  }
}

export default new OIDCStateDAO(TABLENAME, OIDCStateModel);
