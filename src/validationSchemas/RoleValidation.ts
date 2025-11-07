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

import { checkSchema } from "express-validator"
import RoleDAO from "../models/Role/RoleDAO"

export const deleteRoleSchemaValidator = checkSchema({
    id: {
        in: ['params'],
        custom: {
            options: async (value) => {
                try {
                    const role = await RoleDAO.findById(value)
                    if (role.immutable) return Promise.reject("Role is immutable")
                    return Promise.resolve(true)
                } catch (err: any) {
                    if (err.status === 404) return Promise.reject(`Role with that id not found ${value}`)
                }
            },

        },
    }
})

export const updateRoleSchemaValidator = checkSchema({
    id: {
        in: ['params'],
        custom: {
            options: async (value) => {
                try {
                    const role = await RoleDAO.findById(value)
                    if (role.immutable) return Promise.reject("Role is immutable")
                    return Promise.resolve(true)
                } catch (err: any) {
                    if (err.status === 404) return Promise.reject(`Role with that id not found ${value}`)
                }
            },

        },
    },
    lineage: {
        in: ['body'],
        optional: true,
        isBoolean: {
            errorMessage: 'Must be a boolean'
        }
    },
    displayName: {
        in: ['body'],
        optional: true,
        isString: {
            errorMessage: 'Must be a string'
        }
    },
    strength: {
        in: ['body'],
        optional: true,
        isNumeric: {
            errorMessage: 'Must be a number'
        }
    },
    resourcePermissions: {
        in: ['body'],
        optional: true,
        isObject: {
            errorMessage: 'Must be an object'
        },
        custom: {
            options: (value) => {
                const keys = Object.keys(value)
                if (keys.length !== 7) return Promise.reject('Must have 7 keys')
                const validKeys = ['lo', 'service', 'tool', 'group', 'user', 'role', 'consumer']
                const valid = keys.reduce((acc, key) => acc && validKeys.includes(key), true)
                if (!valid) return Promise.reject('Must have valid keys')
                return Promise.resolve(true)
            }
        }
    }
})

export const createRoleSchemaValidator = checkSchema({
    lineage: {
        in: ['body'],
        optional: true,
        isBoolean: {
            errorMessage: 'Must be a boolean'
        }
    },
    displayName: {
        in: ['body'],
        exists: {
            errorMessage: 'Must exist'
        },
        isString: {
            errorMessage: 'Must be a string'
        }
    },
    strength: {
        in: ['body'],
        exists: {
            errorMessage: 'Must exist'
        },
        isNumeric: {
            errorMessage: 'Must be a number'
        }
    },
    resourcePermissions: {
        in: ['body'],
        exists: {
            errorMessage: 'Must exist'
        },
        isObject: {
            errorMessage: 'Must be an object'
        },
        custom: {
            options: (value) => {
                const keys = Object.keys(value)
                if (keys.length !== 7) return Promise.reject('Must have 7 keys')
                const validKeys = ['lo', 'service', 'tool', 'group', 'user', 'role', 'consumer']
                const valid = keys.reduce((acc, key) => acc && validKeys.includes(key), true)
                if (!valid) return Promise.reject('Must have valid keys')
                return Promise.resolve(true)
            }
        }
    }
})