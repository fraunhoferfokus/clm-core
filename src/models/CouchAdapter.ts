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

// import { CONFIG } from '../config/config';
import AdapterInterface from './AdapterInterface'
import BaseDatamodel from './BaseDatamodel'
import nano, { DocumentInfer, View, ViewDocument } from 'nano'



const client = nano((
    // CONFIG.COUCH_DB_URI as unknown as string
    "http://localhost:5984"
));
const emit = (id: any, doc: any) => { }



export default class CouchDAO<T extends BaseDatamodel> implements AdapterInterface<T> {

    private db: nano.DocumentScope<T>;
    viewDocument: ViewDocument<T>
    tableName: string
    Class: { new(configObject: any): T }

    constructor(tableName: string, C: { new(configObject: any): T }, views: { [key: string]: DocumentInfer<T> } = {}) {
        this.db = client.use<T>(tableName)
        this.tableName = tableName
        this.Class = C
        this.viewDocument = {
            views: {
                byID: {
                    map: function (doc: T) {
                        emit(doc._id, doc);
                    }
                },
                ...views
            },
            _id: '_design/standard'
        }






    }
    isInitialized: boolean = false;
    bulkInsert(payload: T[]): Promise<boolean> {
        return this.db.bulk({ docs: payload }, { all_or_nothing: true }).then((done) => Promise.resolve(true))
    }
    bulkDelete(payload: T[]): Promise<boolean> {
        return this.db.bulk({ docs: payload.map((doc) => ({ ...doc, _deleted: true })) }, { all_or_nothing: true }).then((done) => Promise.resolve(true))
    }
    bulkUpdate(payload: T[]): Promise<boolean> {
        return this.db.bulk({ docs: payload }, { all_or_nothing: true }).then((done) => Promise.resolve(true))
    }

    async init(): Promise<boolean> {
        const tableName = this.tableName
        return client.db.list().then((names) => {
            if (!names.includes(tableName)) {
                return client.db.create(tableName)
                    .then(() => this.db.insert(this.viewDocument)
                        .then(() => {

                            return true
                        })
                    )
            }
            return this.db.get(this.viewDocument._id).then((doc) => this.db.insert({ ...this.viewDocument, _rev: doc._rev } as any))
                .then(() => {

                    return true
                })

        })
    }



    findAll(options?: {
        view: string
    }): Promise<T[]> {
        const view = options?.view ?? "byID";
        if (!(view in this.viewDocument.views)) throw { message: `View not found ${view}`, status: 404 }
        //@ts-ignore
        return this.db.view(this.viewDocument._id.split('/')[1], view).then((query) => query.rows)
            .then((rows) => {
                let resources = [];
                for (const row of rows) {
                    resources.push(new this.Class(row.value as unknown as T))
                }
                return resources;
            })
    }

    findById(id: string, options?: { view: string }): Promise<T> {
        const view = options?.view ?? "byID";
        if (!(view in this.viewDocument.views)) throw { message: `View not found ${view}`, status: 404 }
        return this.db.view(this.viewDocument._id.split('/')[1], view, { keys: [id] })
            .then((query) => query.rows)
            .then((rows) => {
                if (rows.length < 1) throw { status: 404, message: `Not found ${this.tableName} with that id: ${id}` }
                return new this.Class(rows[0].value as T);
            })
    }
    findByAttributes(searchObject: { [key: string]: any }): Promise<T[]> {
        return this.findAll().then((docs) =>
            docs.filter((doc) => {
                const objectKeys = Object.keys(searchObject)
                let counter = 0;
                for (const key of objectKeys) {
                    if (doc[key as keyof typeof doc] === searchObject[key]) counter++
                }
                if (counter != 0 && counter === objectKeys.length) return true
                return false
            })
        )
    }
    deleteById(id: string): Promise<boolean> {
        return this.findById(id).then((resource) => this.db.destroy(resource._id!, resource._rev!)
        ).then(() => Promise.resolve(true)).catch((err) => Promise.reject(err))
    }
    updateById(id: string, payload: T): Promise<T> {
        return this.findById(id).then((resource) => {
            if (payload._rev) delete payload._rev;
            for (const key in payload) {
                if (key in resource) {
                    resource[key] = payload[key];
                }
            }
            // resource.updatedAt = new Date();
            return resource.beforeUpdate(payload).then(() => {
                return Promise.all([this.db.insert(resource), resource])
            })
        }).then(([, resource]) => new this.Class({ ...resource }))
    }
    insert(payload: T, options?: any): Promise<T> {
        const inserToDoc = new this.Class(payload);
        return inserToDoc.beforeInsert().then(() =>
            this.db.insert(inserToDoc).then((resp) => {
                payload._id = resp.id;
                return Promise.resolve(new this.Class(payload))
            }).catch((err) => {
                throw err
            })
        )
    }




}

