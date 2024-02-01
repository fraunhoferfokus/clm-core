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

 import redis from 'ioredis';
import { CONFIG } from '../config/config';

const redisConfig = CONFIG.REDIS_CONFIG
const [host, port] = redisConfig?.split('|')
const client = new redis(parseInt(port), host)

class RedisClient {
    get(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            client.get(key, (err, resp) => {
                if (err) return resolve(null)
                return resolve(JSON.parse(resp!));
            })
        })
    }

    set(key: string, value: { [key: string]: any }): Promise<{ [key: string]: any }> {
        return new Promise((resolve, reject) => {
            client.set(key, JSON.stringify(value), (err, resp) => {
                if (err) return reject(err);
                return resolve(value)
            })
        })
    }

    delete(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            client.del(key, (err, resp) => {
                if (err) return reject(err);
                return resolve(true)
            })
        })
    }

    flush(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            client.flushdb(function (err, success) {
                if (err) return reject(err)
                return resolve(true)
            })
        })
    }
}
export default new RedisClient();







