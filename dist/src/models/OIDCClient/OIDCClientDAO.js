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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDAO_1 = __importDefault(require("../BaseDAO"));
const OIDCClientModel_1 = __importDefault(require("./OIDCClientModel"));
const TABLENAME = 'oidc_clients';
class OIDCClientDAO extends BaseDAO_1.default {
    /**
     * Find OIDC client by client_id
     */
    findByClientId(client_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const clients = yield this.findByAttributes({ client_id });
            return clients[0];
        });
    }
    /**
     * Get all active OIDC clients
     */
    findAllActive() {
        return __awaiter(this, void 0, void 0, function* () {
            const all = yield this.findAll();
            return all.filter(c => c.active);
        });
    }
}
exports.default = new OIDCClientDAO(TABLENAME, OIDCClientModel_1.default);
