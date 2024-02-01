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
const GroupModel_1 = __importDefault(require("../Group/GroupModel"));
const RelationModel_1 = __importDefault(require("../Relation/RelationModel"));
const UserModel_1 = require("./UserModel");
const GroupDAO_1 = __importDefault(require("../Group/GroupDAO"));
const RelationDAO_1 = __importDefault(require("../Relation/RelationDAO"));
const TABLENAME = 'user';
class UserDAO extends BaseDAO_1.default {
    insert(payload) {
        return super.insert(payload).then((user) => {
            let personal_group_id = '_group_' + user._id;
            return Promise.all([
                GroupDAO_1.default.insert(new GroupModel_1.default({ _id: personal_group_id, displayName: "" })),
                // RelationDAO.insert(new RelationModel({ fromId: user._id, toId: user._id, fromType: 'user', toType: 'group' })),
                user,
                RelationDAO_1.default.insert(new RelationModel_1.default({ fromId: personal_group_id, toId: user._id, fromType: 'group', toType: 'user' })),
            ]);
        }).then(([, user]) => user);
    }
    deleteById(id) {
        return super.deleteById(id).then(() => __awaiter(this, void 0, void 0, function* () {
            const userRelations = (yield RelationDAO_1.default.findAll())
                .filter((relation) => relation.fromId === id || relation.toId === id);
            Promise.all([
                RelationDAO_1.default.bulkDelete(userRelations.map((relation) => (Object.assign(Object.assign({}, relation), { _deleted: true })))),
                GroupDAO_1.default.deleteById('_group_' + id)
            ]);
        })).then(() => true);
    }
}
exports.default = new UserDAO(TABLENAME, UserModel_1.UserModel);
