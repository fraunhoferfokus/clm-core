"use strict";
/* -
 * Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 * All rights reserved.
 *
 * For more information please contact:
 * Fraunhofer FOKUS
 * Kaiserin-Augusta-Allee 31
 * 10589 Berlin, Germany
 * https://www.fokus.fraunhofer.de/go/fame
 * famecontact@fokus.fraunhofer.de
 * -
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
const pgPool_1 = __importDefault(require("./pgPool"));
/**
 * Adapter for PostgreSQL and default adapter for {@link BaseDAO}
 * @public
 */
class PgAdapter {
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
            const lockKey = `table_creation_${this.tableName}`;
            // const lockId = this.generateLockId(lockKey);
            try {
                // await this.acquireLock(lockId);
                const statement = `
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                _id VARCHAR(200) NOT NULL,
                doc JSONB,
                UNIQUE(_id)
              );
              `;
                yield this.query(statement);
                this.isInitialized = true;
                // console.log({
                //     tableName: this.tableName,
                //     msg: 'init'
                // })
                return true;
            }
            catch (err) {
                if (err.code === '23505' || err.code === '42710')
                    return true;
                // If an error occurs, make sure to release the lock
                // await this.releaseLock(lockId);
                throw err;
            }
            finally {
                // await this.releaseLock(lockId);
            }
        });
    }
    acquireLock(lockId) {
        return __awaiter(this, void 0, void 0, function* () {
            const statement = `SELECT pg_advisory_lock($1);`;
            yield this.query(statement, [lockId]);
        });
    }
    releaseLock(lockId) {
        return __awaiter(this, void 0, void 0, function* () {
            const statement = `SELECT pg_advisory_unlock($1);`;
            yield this.query(statement, [lockId]);
        });
    }
    generateLockId(key) {
        // Generate a consistent hash of the lock key to use as the lock ID
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
    query(statement, values = []) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { rows } = yield pgPool_1.default.query(statement, values);
                return rows;
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
                const statement = `SELECT doc from ${this.tableName} where _id = $1;`;
                const response = yield this.query(statement, [id]);
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
            SET doc = $1
            where _id = $2;`;
                yield this.query(statement, [JSON.stringify(resource), id]);
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
                const statement = `DELETE from ${this.tableName} where _id = $1;`;
                yield this.query(statement, [id]);
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
                const statement = `INSERT INTO ${this.tableName} (_id, doc) VALUES($1, $2);`;
                yield this.query(statement, [payload._id, JSON.stringify(resource)]);
                return resource;
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.default = PgAdapter;
