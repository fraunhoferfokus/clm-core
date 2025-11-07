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

// const ADMIN_ID = process.env.ADMIN_ID || "admin@localhost.tld"
import axios from "axios"
import { jwtServiceInstance, userBDTOInstance } from "../lib/CoreLib"
import { CONFIG } from "../config/config"
const DEPLOY_URL = process.env.GATEWAY_URL || process.env.DEPLOY_URL
const API_TOKEN = CONFIG.CLM_API_KEY

class ExtModelFetcher {

    token: string

    constructor() {
        this.token = ''
    }

    createAccessToken = async () => {
        let user = (await userBDTOInstance.findAll()).find((user) => user.isSuperAdmin)!
        let token = await jwtServiceInstance.createToken({ ...user, }, '2555d')
        this.token = token
    }

    findAll = async (modelPath: string) => {
        try {
            if (!this.token) await this.createAccessToken()
            const resp = await axios.get(`${DEPLOY_URL}/${modelPath}`, {
                headers: {
                    authorization: `Bearer ${API_TOKEN}`,
                    'x-access-token': this.token
                }
            })
            return resp.data as any[]
        } catch (err) {
            throw err
        }
    }

    async findById(id: string, modelPath: string) {
        try {
            const tools = await this.findAll(modelPath)
            const tool = tools.find((tool) => tool._id === id)
            if (!tool) throw { status: 404, message: `Model with that id not found: ${id}` }
            return tool
        } catch (err) {
            throw err
        }

    }

}


export const extModelFetchInstance = new ExtModelFetcher()