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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrudAccess = exports.roleBDTOInstance = exports.passport = exports.consumerBDTOInstance = exports.extModelFetchInstance = exports.jwtServiceInstance = exports.groupBDTOInstance = exports.errHandler = exports.pathBDTOInstance = exports.userBDTOInstance = exports.relationBDTOInstance = exports.EncryptService = exports.MariaAdapter = exports.AuthGuard = exports.PathBDTO = exports.PathModel = exports.UserBDTO = exports.ConsumerModel = exports.ConsumerBDTO = exports.GroupBDTO = exports.GroupModel = exports.JwtService = exports.BaseExtensionCtrl = exports.BaseModelController = exports.RelationModel = exports.BaseDatamodel = exports.BaseFrontendDTO = exports.BaseBackendDTO = exports.RelationBDTO = exports.BaseDAO = exports.UserModel = void 0;
const BaseModelController_1 = __importDefault(require("../controllers/BaseModelController"));
exports.BaseModelController = BaseModelController_1.default;
const BaseBackendDTO_1 = __importDefault(require("../models/BaseBackendDTO"));
exports.BaseBackendDTO = BaseBackendDTO_1.default;
const BaseDatamodel_1 = __importDefault(require("../models/BaseDatamodel"));
exports.BaseDatamodel = BaseDatamodel_1.default;
const BaseFrontendDTO_1 = __importDefault(require("../models/BaseFrontendDTO"));
exports.BaseFrontendDTO = BaseFrontendDTO_1.default;
// DTOS
const BaseExtensionCtrl_1 = require("../controllers/BaseExtensionCtrl");
Object.defineProperty(exports, "BaseExtensionCtrl", { enumerable: true, get: function () { return BaseExtensionCtrl_1.BaseExtensionCtrl; } });
const AuthGuard_1 = require("../handlers/AuthGuard");
Object.defineProperty(exports, "AuthGuard", { enumerable: true, get: function () { return AuthGuard_1.AuthGuard; } });
Object.defineProperty(exports, "CrudAccess", { enumerable: true, get: function () { return AuthGuard_1.CrudAccess; } });
const ErrorHandler_1 = __importDefault(require("../handlers/ErrorHandler"));
exports.errHandler = ErrorHandler_1.default;
const BaseDAO_1 = __importDefault(require("../models/BaseDAO"));
exports.BaseDAO = BaseDAO_1.default;
const GroupBDTO_1 = require("../models/Group/GroupBDTO");
Object.defineProperty(exports, "GroupBDTO", { enumerable: true, get: function () { return GroupBDTO_1.GroupBDTO; } });
Object.defineProperty(exports, "groupBDTOInstance", { enumerable: true, get: function () { return GroupBDTO_1.groupBDTOInstance; } });
const GroupModel_1 = __importDefault(require("../models/Group/GroupModel"));
exports.GroupModel = GroupModel_1.default;
const PathBDTO_1 = require("../models/Path/PathBDTO");
Object.defineProperty(exports, "PathBDTO", { enumerable: true, get: function () { return PathBDTO_1.PathBDTO; } });
Object.defineProperty(exports, "pathBDTOInstance", { enumerable: true, get: function () { return PathBDTO_1.pathBDTOInstance; } });
const RelationBDTO_1 = __importStar(require("../models/Relation/RelationBDTO"));
exports.relationBDTOInstance = RelationBDTO_1.default;
Object.defineProperty(exports, "RelationBDTO", { enumerable: true, get: function () { return RelationBDTO_1.RelationBDTO; } });
const RelationModel_1 = __importDefault(require("../models/Relation/RelationModel"));
exports.RelationModel = RelationModel_1.default;
const UserBDTO_1 = require("../models/User/UserBDTO");
Object.defineProperty(exports, "UserBDTO", { enumerable: true, get: function () { return UserBDTO_1.UserBDTO; } });
Object.defineProperty(exports, "userBDTOInstance", { enumerable: true, get: function () { return UserBDTO_1.userBDTOInstance; } });
const UserModel_1 = require("../models/User/UserModel");
Object.defineProperty(exports, "UserModel", { enumerable: true, get: function () { return UserModel_1.UserModel; } });
const jwtService_1 = require("../services/jwtService");
Object.defineProperty(exports, "JwtService", { enumerable: true, get: function () { return jwtService_1.JwtService; } });
Object.defineProperty(exports, "jwtServiceInstance", { enumerable: true, get: function () { return jwtService_1.jwtServiceInstance; } });
// import redisClient from '../services/redisClient'
const MariaAdapter_1 = __importDefault(require("../models/MariaAdapter"));
exports.MariaAdapter = MariaAdapter_1.default;
const PathModel_1 = __importDefault(require("../models/Path/PathModel"));
exports.PathModel = PathModel_1.default;
const ConsumerBDTO_1 = require("../models/ServiceConsumer/ConsumerBDTO");
Object.defineProperty(exports, "ConsumerBDTO", { enumerable: true, get: function () { return ConsumerBDTO_1.ConsumerBDTO; } });
Object.defineProperty(exports, "consumerBDTOInstance", { enumerable: true, get: function () { return ConsumerBDTO_1.consumerBDTOInstance; } });
const ConsumerModel_1 = __importDefault(require("../models/ServiceConsumer/ConsumerModel"));
exports.ConsumerModel = ConsumerModel_1.default;
const EncryptService_1 = __importDefault(require("../services/EncryptService"));
exports.EncryptService = EncryptService_1.default;
const passport_1 = __importDefault(require("../passport/passport"));
exports.passport = passport_1.default;
const RoleBDTO_1 = require("../models/Role/RoleBDTO");
Object.defineProperty(exports, "roleBDTOInstance", { enumerable: true, get: function () { return RoleBDTO_1.roleBDTOInstance; } });
const ExtModelFetcher_1 = require("../api/ExtModelFetcher");
Object.defineProperty(exports, "extModelFetchInstance", { enumerable: true, get: function () { return ExtModelFetcher_1.extModelFetchInstance; } });
