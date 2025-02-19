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

 import { checkSchema, Schema } from 'express-validator'
import UserDAO from '../models/User/UserDAO'
import PathDAO from '../models/Path/PathDAO'


const sharedSchema: Schema = {
    paths: {
        in: ['body'],
        exists: {
            errorMessage: "Has to exist!"
        },
        isArray: {
            errorMessage: "Has to be an array!",
            bail: true,
        },
    },
    "paths.*.scope": {
        exists: {
            errorMessage: "Scope has to exists"
        },
        isArray: {
            errorMessage: "Has to be an array!",
            bail: true,
        },
        custom: {
            options: (arr, { req, location, path }) => {
                const scopes = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
                if (!arr.every((value: any) => scopes.includes(value))) return false
                return true
            },
            errorMessage: `Arr contains an unsupport scope. Allowed scopes are: GET, POST, PATCH, PUT, DELETE`
        }
    },
    "paths.*.route": {
        exists: {
            errorMessage: "Needs to exist!"
        },
        isString: {
            errorMessage: "Needs to be a string",
            bail: true
        },
        custom: {
            options: async (route, { req, location, path }) => {
                try {
                    await PathDAO.findById(route)
                    return Promise.resolve()
                } catch (err) {
                    
                    return Promise.reject()
                }
            },
            errorMessage: `Specified Route not found!`
        }
    }
}

const createSchema: Schema = {
    userId: {
        in: ['body'],
        exists: {
            errorMessage: 'Has to exist',
            bail: true
        },
        custom: {
            options: async (value, { req }) => {
                return UserDAO.findById(value)
            },
            errorMessage: `Not found user with that id`,
        }
    },
    domain: {
        in: ['body',
        ],
        exists: true,
        isString: true
    },
    displayName: {
        in: ['body',
        ],
        exists: true,
        isString: true
    },

    ...sharedSchema
}

const updateSchema: Schema = {
    ...sharedSchema
}


export const createApiTokenValidation = checkSchema(createSchema)



export const updateApiTokenValidation = checkSchema(updateSchema)

