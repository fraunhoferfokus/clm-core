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

import AdapterInterface from "./AdapterInterface";
import BaseDatamodel from "./BaseDatamodel";
import pool from './pgPool';

/**
 * Adapter for PostgreSQL and default adapter for {@link BaseDAO}
 * @public
 */
export default class PgAdapter<T extends BaseDatamodel> implements AdapterInterface<T> {

    tableName: string;
    Class: { new(configObject: any): T };
    isInitialized: boolean = false;

    constructor(tableName: string, C: { new(configObject: any): T }, opt: any) {
        this.tableName = tableName;
        this.Class = C;
    }

    async bulkInsert(payload: T[]): Promise<boolean> {
        try {
            let promises: any[] = [];
            for (const resource of payload) {
                promises.push(this.insert(resource));
            }
            await Promise.all(promises);
            return true;
        } catch (err) {
            throw err;
        }
    }

    async bulkDelete(payload: T[]): Promise<boolean> {
        try {
            let promises: any[] = [];
            for (const resource of payload) {
                promises.push(this.deleteById(resource._id));
            }
            await Promise.all(promises);
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
            await Promise.all(promises);
            return true
        } catch (err) {
            throw err
        }
    }

    async init(): Promise<boolean> {
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
            await this.query(statement);

            this.isInitialized = true;
            // console.log({
            //     tableName: this.tableName,
            //     msg: 'init'
            // })
            return true;
        } catch (err: any) {
            if (err.code === '23505' || err.code === '42710') return true
            // If an error occurs, make sure to release the lock
            // await this.releaseLock(lockId);
            throw err;
        } finally {
            // await this.releaseLock(lockId);
        }
    }

    private async acquireLock(lockId: number): Promise<void> {
        const statement = `SELECT pg_advisory_lock($1);`;
        await this.query(statement, [lockId]);
    }

    private async releaseLock(lockId: number): Promise<void> {
        const statement = `SELECT pg_advisory_unlock($1);`;
        await this.query(statement, [lockId]);
    }

    private generateLockId(key: string): number {
        // Generate a consistent hash of the lock key to use as the lock ID
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    private async query(statement: string, values: any[] = []) {
        try {
            const { rows } = await pool.query(statement, values);
            return rows;
        } catch (err) {
            throw err;
        }
    }

    async findAll(options?: any): Promise<T[]> {
        try {
            const statement = `SELECT doc from ${this.tableName};`;
            const response: any[] = await this.query(statement);
            return response.map(({ doc }) => new this.Class(doc));
        } catch (err) {
            throw err;
        }
    }

    async findById(id: string, options?: any): Promise<T> {
        try {
            const statement = `SELECT doc from ${this.tableName} where _id = $1;`;
            const response: any = await this.query(statement, [id]);
            let sqlItem = response[0];
            if (!sqlItem) throw { status: 404, message: `Not found doc with that id: ${id}` };
            return new this.Class(sqlItem.doc);
        } catch (err) {
            throw err;
        }
    }

    async updateById(id: string, payload: T): Promise<T> {
        try {
            const resource = await this.findById(id);
            for (const key in payload) {
                if (key in resource) {
                    resource[key] = payload[key];
                }
            }

            await resource.beforeUpdate(payload);
            const statement = `UPDATE ${this.tableName} 
            SET doc = $1
            where _id = $2;`;
            await this.query(statement, [JSON.stringify(resource), id]);
            return resource;
        } catch (err) {
            throw err;
        }
    }

    async findByAttributes(searchObject: { [key: string]: any }): Promise<T[]> {
        try {
            let resources = await this.findAll();
            return resources.filter((doc) => {
                const objectKeys = Object.keys(searchObject);
                let counter = 0;
                for (const key of objectKeys) {
                    if (doc[key as keyof typeof doc] === searchObject[key]) counter++;
                }
                if (counter != 0 && counter === objectKeys.length) return true;
                return false;
            });
        } catch (err) {
            throw err;
        }
    }

    async deleteById(id: string): Promise<boolean | void> {
        try {
            await this.findById(id);
            const statement = `DELETE from ${this.tableName} where _id = $1;`;
            await this.query(statement, [id]);
            return true;
        } catch (err) {
            throw err;
        }
    }

    async insert(payload: T, options?: any): Promise<T> {
        try {
            const resource = new this.Class(payload);
            await resource.beforeInsert();
            const statement = `INSERT INTO ${this.tableName} (_id, doc) VALUES($1, $2);`;
            await this.query(statement, [payload._id, JSON.stringify(resource)]);
            return resource;
        } catch (err) {
            throw err;
        }
    }
}
