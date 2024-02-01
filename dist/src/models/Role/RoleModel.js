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
exports.RoleModel = exports.CrudPermission = void 0;
var CrudPermission;
(function (CrudPermission) {
    CrudPermission[CrudPermission["NONE"] = 0] = "NONE";
    CrudPermission[CrudPermission["CREATE"] = 1] = "CREATE";
    CrudPermission[CrudPermission["READ"] = 2] = "READ";
    CrudPermission[CrudPermission["UPDATE"] = 4] = "UPDATE";
    CrudPermission[CrudPermission["DELETE"] = 8] = "DELETE";
    CrudPermission[CrudPermission["CREATE_READ"] = 3] = "CREATE_READ";
    CrudPermission[CrudPermission["CREATE_UPDATE"] = 5] = "CREATE_UPDATE";
    CrudPermission[CrudPermission["CREATE_DELETE"] = 9] = "CREATE_DELETE";
    CrudPermission[CrudPermission["READ_UPDATE"] = 6] = "READ_UPDATE";
    CrudPermission[CrudPermission["READ_DELETE"] = 10] = "READ_DELETE";
    CrudPermission[CrudPermission["UPDATE_DELETE"] = 12] = "UPDATE_DELETE";
    CrudPermission[CrudPermission["CREATE_READ_UPDATE"] = 7] = "CREATE_READ_UPDATE";
    CrudPermission[CrudPermission["CREATE_READ_DELETE"] = 11] = "CREATE_READ_DELETE";
    CrudPermission[CrudPermission["CREATE_UPDATE_DELETE"] = 13] = "CREATE_UPDATE_DELETE";
    CrudPermission[CrudPermission["READ_UPDATE_DELETE"] = 14] = "READ_UPDATE_DELETE";
    CrudPermission[CrudPermission["CREATE_READ_UPDATE_DELETE"] = 15] = "CREATE_READ_UPDATE_DELETE";
})(CrudPermission = exports.CrudPermission || (exports.CrudPermission = {}));
const BaseDatamodel_1 = __importDefault(require("../BaseDatamodel"));
class RoleModel extends BaseDatamodel_1.default {
    constructor(payload) {
        payload._id = payload._id;
        payload._rev = payload._rev;
        super(payload);
        this.lineage = payload.lineage || true;
        this.resourcePermissions = payload.resourcePermissions;
        this.displayName = payload.displayName;
        this.strength = payload.strength;
        this.immutable = payload.immutable || false;
    }
}
exports.RoleModel = RoleModel;
