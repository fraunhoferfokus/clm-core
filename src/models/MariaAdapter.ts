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
 import { CONFIG } from "../config/config";
import AdapterInterface from "./AdapterInterface";
import BaseDatamodel from "./BaseDatamodel";
// import mariadb from 'mariadb';
import mysql from 'mysql2'

const [host, port, database, user, password] = CONFIG.MARIA_CONFIG!.split('|')

let connection = mysql.createPool({
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
export default class MariaAdapter<T extends BaseDatamodel> implements AdapterInterface<T>{
    private readonly IMMUTABLE_KEYS = new Set(['_id', '_rev', 'createdAt', 'updatedAt'])

    tableName: string
    Class: { new(configObject: any): T }
    isInitialized: boolean = false

    constructor(tableName: string, C: { new(configObject: any): T }, opt: any) {
        this.tableName = tableName
        this.Class = C
    }
    async bulkInsert(payload: T[]): Promise<boolean> {
        try {
            let promises: any[] = [];
            for (const resource of payload) {
                promises.push(this.insert(resource));
            }
            await Promise.all(promises)
            return true
        } catch (err) {
            throw err
        }
    }
    async bulkDelete(payload: T[]): Promise<boolean> {
        try {
            let promises: any[] = [];
            for (const resource of payload) {
                promises.push(this.deleteById(resource._id));
            }
            await Promise.all(promises)
            return true
        } catch (err) {
            throw err
        }
    }
    async bulkUpdate(payload: T[]): Promise<boolean> {
        try {
            let promises: any[] = [];
            for (const resource of payload) {
                promises.push(this.updateById(resource._id, resource));
            }
            await Promise.all(promises)
            return true
        } catch (err) {
            throw err
        }
    }

    async init(): Promise<boolean> {
        try {
            const tableName = mysql.escapeId(this.tableName)
            const statement = `
                CREATE TABLE IF NOT EXISTS ${tableName} (
                _id VARCHAR(200) NOT NULL,
                doc LONGTEXT ,
                CHECK (JSON_VALID(doc)),
                CONSTRAINT _id_unique UNIQUE(_id)
              );
              `
            await this.query(statement)
            this.isInitialized = true
            return true
        } catch (err) {
            throw err
        }
    }

    private async query(statement: string, params: any[] = []) {
        try {
            const [results] = await connection.promise().query(statement, params)
            if (!Array.isArray(results)) return results as any

            return results.map((row: any) => {
                if (!row || typeof row.doc !== 'string') return row
                return { doc: JSON.parse(row.doc) }
            }) as any
        } catch (err) {
            throw err
        }
    }

    async findAll(options?: any): Promise<T[]> {
        try {
            const statement = `SELECT doc from ${mysql.escapeId(this.tableName)};`
            const response: any[] = await this.query(statement)
            return response.map(({ doc }) => new this.Class(doc))
        } catch (err) {
            throw err
        }
    }
    async findById(id: string, options?: any): Promise<T> {
        try {
            const statement = `SELECT doc from ${mysql.escapeId(this.tableName)} where _id = ?;`
            const response: any = await this.query(statement, [id])
            let sqlItem = response[0]
            if (!sqlItem) throw { status: 404, message: `Not found doc with that id: ${id}` }
            return new this.Class(sqlItem.doc)
        } catch (err) {
            throw err
        }
    }
    async updateById(id: string, payload: T): Promise<T> {
        try {
            const resource = await this.findById(id)
            for (const key in payload) {
                if (key in resource && !this.IMMUTABLE_KEYS.has(key) && typeof resource[key] !== 'function') {
                    resource[key] = payload[key];
                }
            }

            await resource.beforeUpdate(payload)
            // Parameterized queries prevent user-controlled ids or payloads from breaking out of SQL literals.
            const statement = `UPDATE ${mysql.escapeId(this.tableName)} 
            SET doc = ?
            where _id = ?;`
            await this.query(statement, [JSON.stringify(resource), id])
            return resource
        } catch (err) {
            throw err
        }
    }
    async findByAttributes(searchObject: { [key: string]: any; }): Promise<T[]> {
        try {
            let resources = await this.findAll()
            return resources.filter((doc) => {
                const objectKeys = Object.keys(searchObject)
                let counter = 0;
                for (const key of objectKeys) {
                    if (doc[key as keyof typeof doc] === searchObject[key]) counter++
                }
                if (counter != 0 && counter === objectKeys.length) return true
                return false
            })
        } catch (err) {
            throw err
        }
    }
    async deleteById(id: string): Promise<boolean | void> {
        try {
            await this.findById(id)
            const statement = `DELETE from ${mysql.escapeId(this.tableName)} where _id = ?;`
            await this.query(statement, [id])
            return true
        } catch (err) {
            throw err
        }
    }
    async insert(payload: T, options?: any): Promise<T> {
        try {
            const resource = new this.Class(payload)
            await resource.beforeInsert()
            const statement = `INSERT INTO ${mysql.escapeId(this.tableName)} (_id, doc) VALUES(?, ?);`
            await this.query(statement, [payload._id, JSON.stringify(resource)])
            return resource
        } catch (err) {
            throw err
        }

    }
    // async bulk(resources: (T & { _deleted?: boolean | undefined; })[]): Promise<boolean> {
    //     try {
    //         let promises: any[] = [];
    //         for (const resource of resources) {
    //             resource._deleted ? promises.push(this.deleteById(resource._id)) : promises.push(this.insert(resource as any as T))
    //         }
    //         await Promise.all(promises)
    //         return true
    //     } catch (err) {
    //         throw err
    //     }
    // }


}

