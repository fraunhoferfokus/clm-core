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
const BaseDAO_1 = __importDefault(require("../BaseDAO"));
const GroupModel_1 = __importDefault(require("./GroupModel"));
const RelationBDTO_1 = __importDefault(require("../Relation/RelationBDTO"));
const RelationModel_1 = __importDefault(require("../Relation/RelationModel"));
const RoleDAO_1 = __importDefault(require("../Role/RoleDAO"));
const TABLENAME = 'groups';
class GroupDAO extends BaseDAO_1.default {
    insert(model, payload) {
        const _super = Object.create(null, {
            insert: { get: () => super.insert }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const targetedRoleId = payload === null || payload === void 0 ? void 0 : payload.role;
            const role = targetedRoleId ? yield RoleDAO_1.default.findById(targetedRoleId) :
                yield RoleDAO_1.default.findByRoleName('Self');
            return _super.insert.call(this, model).then((group) => Promise.all([
                RelationBDTO_1.default.createRelationship(new RelationModel_1.default({ fromId: group._id, fromType: 'group', toType: 'role', toId: role._id })),
                group
            ])).then(([, group]) => group);
        });
    }
    deleteById(id) {
        return super.deleteById(id).then(() => __awaiter(this, void 0, void 0, function* () {
            const groupHasRelations = (yield RelationBDTO_1.default.findAll()).filter((item) => item.toId === id || item.fromId === id);
            return RelationBDTO_1.default.bulkDelete(groupHasRelations.map((item) => (Object.assign(Object.assign({}, item), { _deleted: true }))));
        }));
    }
}
exports.default = new GroupDAO(TABLENAME, GroupModel_1.default);
