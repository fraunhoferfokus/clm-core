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
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
/** The base-datamodel defines attributes which every document in the database has in common
 * @remarks Every instance of the base-datamodel (db -\> application layer) should contain standard methods
 * @public
 */
class BaseDatamodel {
    constructor(payload) {
        var _a, _b, _c;
        this._rev = payload._rev;
        this._id = (_a = payload._id) !== null && _a !== void 0 ? _a : (0, uuid_1.v4)();
        this.createdAt = (_b = payload.createdAt) !== null && _b !== void 0 ? _b : new Date();
        this.updatedAt = (_c = payload.updatedAt) !== null && _c !== void 0 ? _c : this.createdAt;
    }
    /**
     * Execute steps after the document has been created. Will be executed by {@link BaseDAO}.
     * and should not be executed by it's own.
     * Similar to mongoose post-save-hook
     * @returns
     * @virtual
     */
    executeAfterCreateDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    /**
     * Execute steps after the document has been deleted. Will be executed by {@link BaseDAO}.
     * and should not be executed by it's own.
     * Similar to mongoose post-delete-hook
     * @returns
     * @virtual
     */
    executeAfterDeleteDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    /**
         * Execute steps before the document will be inserted. Will be executed by {@link BaseDAO}
         * and should not be executed by it's own.
         * Similar to mongoose pre-save-hook
         * @returns
         * @virtual
         */
    beforeInsert() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    /**
     * Execute steps before the document has been updated. Will be executed by {@link BaseDAO}
     * and should not be executed by it's own. The 'updateAt' attribute of the document will be changed by default.
     * Similar to mongoose pre-update-hook
     * @returns
     * @virtual
     */
    beforeUpdate(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            this.updatedAt = new Date();
            return Promise.resolve();
        });
    }
}
exports.default = BaseDatamodel;
