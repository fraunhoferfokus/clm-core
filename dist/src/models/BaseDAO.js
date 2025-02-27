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
const PostgreSQLAdapter_1 = __importDefault(require("./PostgreSQLAdapter"));
/**
 * DAO which exposes all CRUD opeartions
 * @remarks This class is based on Java DAO. see https://www.baeldung.com/java-dao-pattern.
 * All classes with custom datamodels have to extend this class.
 * @public
 */
class BaseDAO {
    constructor(adapterOrTableName, C) {
        this.isInitialized = false;
        this.tableName = C ? adapterOrTableName : '';
        this.adapter = C ? new PostgreSQLAdapter_1.default(adapterOrTableName, C, {}) : adapterOrTableName;
        this.adapter.init();
    }
    /**
     * {@inheritDoc AdapterInterface.bulkInsert}
     */
    bulkInsert(payload) {
        return this.adapter.bulkInsert(payload);
    }
    /**
     * {@inheritDoc AdapterInterface.bulkDelete}
     */
    bulkDelete(payload) {
        return this.adapter.bulkDelete(payload);
    }
    /**
     * {@inheritDoc AdapterInterface.bulkUpdate}
     */
    bulkUpdate(payload) {
        return this.adapter.bulkUpdate(payload);
    }
    /**
     * {@inheritDoc AdapterInterface.init}
     */
    init() {
        return this.adapter.init();
    }
    /**
     * {@inheritDoc AdapterInterface.findAll}
     */
    findAll(options) {
        return this.adapter.findAll(options);
    }
    /**
     * {@inheritDoc AdapterInterface.findById}
     */
    findById(id, options) {
        return this.adapter.findById(id, options);
    }
    /**
     * {@inheritDoc AdapterInterface.findByAttributes}
     */
    findByAttributes(searchObject) {
        return this.adapter.findByAttributes(searchObject);
    }
    /**
     * {@inheritDoc AdapterInterface.deleteById}
     */
    deleteById(id) {
        return this.adapter.deleteById(id);
    }
    /**
     * {@inheritDoc AdapterInterface.updateById}
     */
    updateById(id, payload) {
        return this.adapter.updateById(id, payload);
    }
    /**
     * {@inheritDoc AdapterInterface.insert}
     */
    insert(payload, options) {
        return this.adapter.insert(payload, options);
    }
}
exports.default = BaseDAO;
