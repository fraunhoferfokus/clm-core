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
const nano_1 = __importDefault(require("nano"));
const client = (0, nano_1.default)((
// CONFIG.COUCH_DB_URI as unknown as string
"http://localhost:5984"));
const emit = (id, doc) => { };
class CouchDAO {
    constructor(tableName, C, views = {}) {
        this.isInitialized = false;
        this.db = client.use(tableName);
        this.tableName = tableName;
        this.Class = C;
        this.viewDocument = {
            views: Object.assign({ byID: {
                    map: function (doc) {
                        emit(doc._id, doc);
                    }
                } }, views),
            _id: '_design/standard'
        };
    }
    bulkInsert(payload) {
        return this.db.bulk({ docs: payload }, { all_or_nothing: true }).then((done) => Promise.resolve(true));
    }
    bulkDelete(payload) {
        return this.db.bulk({ docs: payload.map((doc) => (Object.assign(Object.assign({}, doc), { _deleted: true }))) }, { all_or_nothing: true }).then((done) => Promise.resolve(true));
    }
    bulkUpdate(payload) {
        return this.db.bulk({ docs: payload }, { all_or_nothing: true }).then((done) => Promise.resolve(true));
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const tableName = this.tableName;
            return client.db.list().then((names) => {
                if (!names.includes(tableName)) {
                    return client.db.create(tableName)
                        .then(() => this.db.insert(this.viewDocument)
                        .then(() => {
                        return true;
                    }));
                }
                return this.db.get(this.viewDocument._id).then((doc) => this.db.insert(Object.assign(Object.assign({}, this.viewDocument), { _rev: doc._rev })))
                    .then(() => {
                    return true;
                });
            });
        });
    }
    findAll(options) {
        var _a;
        const view = (_a = options === null || options === void 0 ? void 0 : options.view) !== null && _a !== void 0 ? _a : "byID";
        if (!(view in this.viewDocument.views))
            throw { message: `View not found ${view}`, status: 404 };
        //@ts-ignore
        return this.db.view(this.viewDocument._id.split('/')[1], view).then((query) => query.rows)
            .then((rows) => {
            let resources = [];
            for (const row of rows) {
                resources.push(new this.Class(row.value));
            }
            return resources;
        });
    }
    findById(id, options) {
        var _a;
        const view = (_a = options === null || options === void 0 ? void 0 : options.view) !== null && _a !== void 0 ? _a : "byID";
        if (!(view in this.viewDocument.views))
            throw { message: `View not found ${view}`, status: 404 };
        return this.db.view(this.viewDocument._id.split('/')[1], view, { keys: [id] })
            .then((query) => query.rows)
            .then((rows) => {
            if (rows.length < 1)
                throw { status: 404, message: `Not found ${this.tableName} with that id: ${id}` };
            return new this.Class(rows[0].value);
        });
    }
    findByAttributes(searchObject) {
        return this.findAll().then((docs) => docs.filter((doc) => {
            const objectKeys = Object.keys(searchObject);
            let counter = 0;
            for (const key of objectKeys) {
                if (doc[key] === searchObject[key])
                    counter++;
            }
            if (counter != 0 && counter === objectKeys.length)
                return true;
            return false;
        }));
    }
    deleteById(id) {
        return this.findById(id).then((resource) => this.db.destroy(resource._id, resource._rev)).then(() => Promise.resolve(true)).catch((err) => Promise.reject(err));
    }
    updateById(id, payload) {
        return this.findById(id).then((resource) => {
            if (payload._rev)
                delete payload._rev;
            for (const key in payload) {
                if (key in resource) {
                    resource[key] = payload[key];
                }
            }
            // resource.updatedAt = new Date();
            return resource.beforeUpdate(payload).then(() => {
                return Promise.all([this.db.insert(resource), resource]);
            });
        }).then(([, resource]) => new this.Class(Object.assign({}, resource)));
    }
    insert(payload, options) {
        const inserToDoc = new this.Class(payload);
        return inserToDoc.beforeInsert().then(() => this.db.insert(inserToDoc).then((resp) => {
            payload._id = resp.id;
            return Promise.resolve(new this.Class(payload));
        }).catch((err) => {
            throw err;
        }));
    }
}
exports.default = CouchDAO;
