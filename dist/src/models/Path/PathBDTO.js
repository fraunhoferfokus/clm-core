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
exports.pathBDTOInstance = exports.PathBDTO = void 0;
const express_list_endpoints_1 = __importDefault(require("express-list-endpoints"));
const BaseBackendDTO_1 = __importDefault(require("../BaseBackendDTO"));
const PathDAO_1 = __importDefault(require("./PathDAO"));
const PathModel_1 = __importDefault(require("./PathModel"));
const ConsumerDAO_1 = __importDefault(require("../ServiceConsumer/ConsumerDAO"));
const ConsumerModel_1 = __importDefault(require("../ServiceConsumer/ConsumerModel"));
// if (CONFIG.ENV === 'PROD') working_dir = __dirname.replace('/dist', '')
/**
 * @public
 * Backend DTO for path. Based on {@link PathModel}
 * The instance {@link pathBDTOInstance} is provided.
 * Uses as default {@link MariaAdapter} for persistence layer
*/
class PathBDTO extends BaseBackendDTO_1.default {
    /**
     * Persists all existing routes of the express app in the database
     * @param app - express app
     * @param ECLUDED_PATHS - array of paths which should not be registered in the database.
     * @returns
     */
    registerRoutes(app, ECLUDED_PATHS, MGMT_TOKEN = 'MGMT_SERVICE', userId = "fame@fokus.fraunhofer.de") {
        return __awaiter(this, void 0, void 0, function* () {
            yield PathDAO_1.default.init();
            const expressPaths = (0, express_list_endpoints_1.default)(app).map((obj) => obj.path);
            let promises = [];
            for (let path of expressPaths) {
                promises.push(this.findById(path).then((path) => {
                    if (ECLUDED_PATHS.includes(path.route))
                        return PathDAO_1.default.deleteById(path._id);
                    return true;
                })
                    .then(() => true)
                    .catch((err) => {
                    if (err.status === 404) {
                        if (ECLUDED_PATHS.includes(path)) {
                            return true;
                        }
                        else {
                            return PathDAO_1.default.insert(new PathModel_1.default({ route: path }));
                        }
                    }
                    throw err;
                }));
            }
            let consumer = (yield ConsumerDAO_1.default.findByAttributes({ displayName: MGMT_TOKEN }))[0];
            if (!consumer)
                consumer = yield ConsumerDAO_1.default.insert(new ConsumerModel_1.default({ _id: MGMT_TOKEN, displayName: MGMT_TOKEN, userId, active: true, domain: "FAME", paths: [] }));
            yield Promise.all([promises]);
            const paths = yield PathDAO_1.default.findAll();
            return Promise.all([
                ConsumerDAO_1.default.updateById(consumer._id, { paths: paths.map((path) => ({ route: path.route, scope: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] })) }),
            ]);
        });
    }
}
exports.PathBDTO = PathBDTO;
/**
 * @public
 * Instance of {@link PathBDTO}
 * Uses as default {@link MariaAdapter} for persistence layer
    */
exports.pathBDTOInstance = new PathBDTO(PathDAO_1.default);
