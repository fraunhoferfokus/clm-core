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
const config_1 = require("../config/config");
// import mariadb from 'mariadb';
const mysql2_1 = __importDefault(require("mysql2"));
const [host, port, database, user, password] = config_1.CONFIG.MARIA_CONFIG.split('|');
let connection = mysql2_1.default.createPool({
    host,
    port: parseInt(port),
    database,
    user,
    password
});
/**
 * Adapter for MariaDB and default adapter for {@link BaseDAO}
 * @public
 */
class MariaAdapter {
    constructor(tableName, C, opt) {
        this.isInitialized = false;
        this.tableName = tableName;
        this.Class = C;
    }
    bulkInsert(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let promises = [];
                for (const resource of payload) {
                    promises.push(this.insert(resource));
                }
                yield Promise.all(promises);
                return true;
            }
            catch (err) {
                throw err;
            }
        });
    }
    bulkDelete(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let promises = [];
                for (const resource of payload) {
                    promises.push(this.deleteById(resource._id));
                }
                yield Promise.all(promises);
                return true;
            }
            catch (err) {
                throw err;
            }
        });
    }
    bulkUpdate(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let promises = [];
                for (const resource of payload) {
                    promises.push(this.updateById(resource._id, resource));
                }
                yield Promise.all(promises);
                return true;
            }
            catch (err) {
                throw err;
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const statement = `
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                _id VARCHAR(200) NOT NULL,
                doc LONGTEXT ,
                CHECK (JSON_VALID(doc)),
                CONSTRAINT _id_unique UNIQUE(_id)
              );
              `;
                yield this.query(statement);
                this.isInitialized = true;
                return true;
            }
            catch (err) {
                throw err;
            }
        });
    }
    query(statement) {
        return __awaiter(this, void 0, void 0, function* () {
            // let connection: mariadb.PoolConnection | undefined;
            try {
                const results = yield new Promise((resolve, reject) => {
                    connection.query(statement, (err, results, fields) => {
                        if (err)
                            return reject(err);
                        // 
                        let response;
                        if ((results === null || results === void 0 ? void 0 : results.length) > 0) {
                            response = results === null || results === void 0 ? void 0 : results.map(({ doc }) => ({ doc: JSON.parse(doc) }));
                        }
                        else {
                            return resolve([]);
                        }
                        return resolve(response);
                    });
                });
                return results;
            }
            catch (err) {
                throw err;
            }
        });
    }
    findAll(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const statement = `SELECT doc from ${this.tableName};`;
                const response = yield this.query(statement);
                return response.map(({ doc }) => new this.Class(doc));
            }
            catch (err) {
                throw err;
            }
        });
    }
    findById(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const statement = `SELECT doc from ${this.tableName} where _id = '${id}';`;
                const response = yield this.query(statement);
                let sqlItem = response[0];
                if (!sqlItem)
                    throw { status: 404, message: `Not found doc with that id: ${id}` };
                return new this.Class(sqlItem.doc);
            }
            catch (err) {
                throw err;
            }
        });
    }
    updateById(id, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resource = yield this.findById(id);
                for (const key in payload) {
                    if (key in resource) {
                        resource[key] = payload[key];
                    }
                }
                yield resource.beforeUpdate(payload);
                const statement = `UPDATE ${this.tableName} 
            SET doc = '${JSON.stringify(resource)}'
            where _id = '${id}';`;
                yield this.query(statement);
                return resource;
            }
            catch (err) {
                throw err;
            }
        });
    }
    findByAttributes(searchObject) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let resources = yield this.findAll();
                return resources.filter((doc) => {
                    const objectKeys = Object.keys(searchObject);
                    let counter = 0;
                    for (const key of objectKeys) {
                        if (doc[key] === searchObject[key])
                            counter++;
                    }
                    if (counter != 0 && counter === objectKeys.length)
                        return true;
                    return false;
                });
            }
            catch (err) {
                throw err;
            }
        });
    }
    deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.findById(id);
                const statement = `DELETE from ${this.tableName} where _id = '${id}';`;
                yield this.query(statement);
                return true;
            }
            catch (err) {
                throw err;
            }
        });
    }
    insert(payload, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resource = new this.Class(payload);
                yield resource.beforeInsert();
                const statement = `INSERT INTO ${this.tableName} VALUES('${payload._id}','${JSON.stringify(resource)}');`;
                yield this.query(statement);
                return resource;
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.default = MariaAdapter;
