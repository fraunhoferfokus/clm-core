"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OIDCStateModel = void 0;
const BaseDatamodel_1 = __importDefault(require("../BaseDatamodel"));
class OIDCStateModel extends BaseDatamodel_1.default {
    constructor(payload) {
        super(payload);
        this.state = payload.state;
        this.redirectUri = payload.redirectUri;
        this.postLogoutRedirectUri = payload.postLogoutRedirectUri;
        this.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : new Date(Date.now() + 1000 * 60 * 10); // default 10min
        this.consumedAt = payload.consumedAt ? new Date(payload.consumedAt) : undefined;
    }
}
exports.OIDCStateModel = OIDCStateModel;
exports.default = OIDCStateModel;
