"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDatamodel_1 = __importDefault(require("../BaseDatamodel"));
/**
 * OIDC Client datamodel which is used by {@link OIDCClientDAO}
 * @public
 */
class OIDCClientModel extends BaseDatamodel_1.default {
    constructor(payload) {
        super(payload);
        this.client_id = payload.client_id;
        this.client_secret = payload.client_secret;
        this.valid_redirect_uris = payload.valid_redirect_uris || [];
        this.jwks_uri = payload.jwks_uri;
        this.displayName = payload.displayName;
        this.active = payload.active !== undefined ? payload.active : true;
    }
}
exports.default = OIDCClientModel;
