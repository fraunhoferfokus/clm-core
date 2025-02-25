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
const PathBDTO_1 = require("../models/Path/PathBDTO");
const RoleDAO_1 = __importDefault(require("../models/Role/RoleDAO"));
const RoleModel_1 = require("../models/Role/RoleModel");
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const UserModel_1 = require("../models/User/UserModel");
const config_1 = require("./config");
//create Admin User if not exists
function configureDependencies(app, excludedPaths) {
    return __awaiter(this, void 0, void 0, function* () {
        const rootUser = config_1.CONFIG.CLM_ROOT_USER;
        const rootPassword = config_1.CONFIG.CLM_ROOT_PASSWORD;
        let selfRole = (yield RoleDAO_1.default.findByAttributes({ displayName: "Self" }))[0];
        if (!selfRole)
            selfRole = yield RoleDAO_1.default.insert(new RoleModel_1.RoleModel({
                displayName: "Self",
                lineage: false,
                resourcePermissions: {
                    lo: 1,
                    service: 1,
                    tool: 1,
                    group: 1,
                    role: 0,
                    consumer: 0,
                    user: 14,
                },
                strength: 0
            }));
        let learnerRole = (yield RoleDAO_1.default.findByAttributes({ displayName: "Learner" }))[0];
        if (!learnerRole)
            learnerRole = yield RoleDAO_1.default.insert(new RoleModel_1.RoleModel({
                displayName: "Learner",
                lineage: true,
                resourcePermissions: {
                    lo: 1,
                    service: 1,
                    tool: 1,
                    group: 1,
                    user: 1,
                    role: 1,
                    consumer: 0
                },
                strength: 1,
                immutable: true
            }));
        let instructorRole = (yield RoleDAO_1.default.findByAttributes({ displayName: "Instructor" }))[0];
        if (!instructorRole)
            instructorRole = yield RoleDAO_1.default.insert(new RoleModel_1.RoleModel({
                displayName: 'Instructor',
                lineage: true,
                resourcePermissions: {
                    lo: 7,
                    service: 7,
                    tool: 7,
                    group: 1,
                    user: 3,
                    role: 1,
                    consumer: 1
                },
                strength: 2,
                immutable: true
            }));
        let orgAdminRole = (yield RoleDAO_1.default.findByAttributes({ displayName: "OrgAdmin" }))[0];
        if (!orgAdminRole)
            orgAdminRole = yield RoleDAO_1.default.insert(new RoleModel_1.RoleModel({
                displayName: "OrgAdmin",
                lineage: true,
                resourcePermissions: {
                    lo: 15,
                    service: 15,
                    tool: 15,
                    group: 15,
                    user: 15,
                    role: 15,
                    consumer: 15
                },
                strength: 3,
                immutable: true
            }));
        yield PathBDTO_1.pathBDTOInstance.registerRoutes(app, excludedPaths, config_1.CONFIG.CLM_ROOT_CONSUMER_KEY, rootUser);
        let user = (yield UserDAO_1.default.findByAttributes({ email: rootUser }))[0];
        if (!user)
            UserDAO_1.default.insert(new UserModel_1.UserModel({
                'email': rootUser,
                "isVerified": true,
                "_id": rootUser,
                "familyName": "fame",
                "givenName": "fokus",
                "isSuperAdmin": true,
                "password": rootPassword
            }));
    });
}
exports.default = configureDependencies;
