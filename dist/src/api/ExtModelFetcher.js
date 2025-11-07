"use strict";
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
exports.extModelFetchInstance = void 0;
// const ADMIN_ID = process.env.ADMIN_ID || "admin@localhost.tld"
const axios_1 = __importDefault(require("axios"));
const CoreLib_1 = require("../lib/CoreLib");
const config_1 = require("../config/config");
const DEPLOY_URL = process.env.GATEWAY_URL || process.env.DEPLOY_URL;
const API_TOKEN = config_1.CONFIG.CLM_API_KEY;
class ExtModelFetcher {
    constructor() {
        this.createAccessToken = () => __awaiter(this, void 0, void 0, function* () {
            let user = (yield CoreLib_1.userBDTOInstance.findAll()).find((user) => user.isSuperAdmin);
            let token = yield CoreLib_1.jwtServiceInstance.createToken(Object.assign({}, user), '2555d');
            this.token = token;
        });
        this.findAll = (modelPath) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.token)
                    yield this.createAccessToken();
                const resp = yield axios_1.default.get(`${DEPLOY_URL}/${modelPath}`, {
                    headers: {
                        authorization: `Bearer ${API_TOKEN}`,
                        'x-access-token': this.token
                    }
                });
                return resp.data;
            }
            catch (err) {
                throw err;
            }
        });
        this.token = '';
    }
    findById(id, modelPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tools = yield this.findAll(modelPath);
                const tool = tools.find((tool) => tool._id === id);
                if (!tool)
                    throw { status: 404, message: `Model with that id not found: ${id}` };
                return tool;
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.extModelFetchInstance = new ExtModelFetcher();
