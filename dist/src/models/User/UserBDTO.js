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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userBDTOInstance = exports.UserBDTO = void 0;
const BaseBackendDTO_1 = __importDefault(require("../BaseBackendDTO"));
const UserDAO_1 = __importDefault(require("./UserDAO"));
/**
 * @public
 * Backend DTO for user. Based on {@link UserModel}
 * The instance {@link userBDTOInstance} is provided.
 * Uses as default {@link MariaAdapter} for persistence layer
*/
class UserBDTO extends BaseBackendDTO_1.default {
    insert(payload) {
        return UserDAO_1.default.insert(payload);
    }
}
exports.UserBDTO = UserBDTO;
/**
 * @public
 * Instance of {@link UserBDTO}.
 * Uses as default {@link MariaAdapter} for persistence layer.
 */
exports.userBDTOInstance = new UserBDTO(UserDAO_1.default);
