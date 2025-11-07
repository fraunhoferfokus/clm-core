import BaseDatamodel, { iBaseDatamodel } from "../BaseDatamodel";

export interface iOIDCStateModel extends iBaseDatamodel {
  state: string;
  redirectUri?: string;
  postLogoutRedirectUri?: string;
  expiresAt: Date; // when this state entry becomes invalid
  consumedAt?: Date; // when it was used (optional auditing)
}

export class OIDCStateModel extends BaseDatamodel implements iOIDCStateModel {
  state: string;
  redirectUri?: string;
  postLogoutRedirectUri?: string;
  expiresAt: Date;
  consumedAt?: Date;

  constructor(payload: Partial<iOIDCStateModel> & { state: string }) {
    super(payload);
    this.state = payload.state;
    this.redirectUri = payload.redirectUri;
    this.postLogoutRedirectUri = payload.postLogoutRedirectUri;
    this.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : new Date(Date.now() + 1000 * 60 * 10); // default 10min
    this.consumedAt = payload.consumedAt ? new Date(payload.consumedAt) : undefined;
  }
}

export default OIDCStateModel;
