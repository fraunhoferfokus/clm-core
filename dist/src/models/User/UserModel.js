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
exports.UserModel = void 0;
const BaseDatamodel_1 = __importDefault(require("../BaseDatamodel"));
const PasswordService_1 = __importDefault(require("../../services/PasswordService"));
const UserDAO_1 = __importDefault(require("./UserDAO"));
/**
 * @public
 * User datamodel which is used by {@link UserBDTO}
 */
class UserModel extends BaseDatamodel_1.default {
    constructor(payload) {
        var _a, _b;
        payload._id = payload.email;
        super(payload);
        this.password = payload.password;
        this.email = payload.email;
        this.givenName = payload.givenName;
        this.familyName = payload.familyName;
        this.isVerified = (_a = payload.isVerified) !== null && _a !== void 0 ? _a : false;
        this.isSuperAdmin = (_b = payload.isSuperAdmin) !== null && _b !== void 0 ? _b : false;
        this.identityId = payload.identityId;
    }
    /**
     * Hash the password before inserting the user
     */
    beforeInsert() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.password = yield PasswordService_1.default.hashPassword(this.password);
            }
            catch (err) {
                throw { err };
            }
        });
    }
    /**
     * Hash the password before updating the user (if password is provided in the payload)
     * @param payload - Payload
     */
    beforeUpdate(payload) {
        const _super = Object.create(null, {
            beforeUpdate: { get: () => super.beforeUpdate }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.beforeUpdate.call(this, payload);
            if (payload.password) {
                yield this.beforeInsert();
            }
        });
    }
    /**
     * Verify the user
     *
     */
    verifyUser() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                UserDAO_1.default.updateById(this._id, { isVerified: true });
                return true;
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.UserModel = UserModel;
