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
const OIDCProviderModel_1 = __importDefault(require("./OIDCProviderModel"));
const TABLENAME = 'oidc_providers';
class OIDCProviderDAO extends BaseDAO_1.default {
    /**
     * Find OIDC provider by issuer
     */
    findByIssuer(issuer) {
        return __awaiter(this, void 0, void 0, function* () {
            const providers = yield this.findByAttributes({ issuer });
            return providers[0];
        });
    }
    /**
     * Get all active OIDC providers
     */
    findAllActive() {
        return __awaiter(this, void 0, void 0, function* () {
            const all = yield this.findAll();
            return all.filter(p => p.active);
        });
    }
}
exports.default = new OIDCProviderDAO(TABLENAME, OIDCProviderModel_1.default);
