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
