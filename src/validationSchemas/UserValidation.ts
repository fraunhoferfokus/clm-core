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
import express from 'express'
import { checkSchema, Schema } from 'express-validator'
import UserDAO from '../models/User/UserDAO'


const sharedSchema: Schema = {

}

const createSchema: Schema = {
    _id: {
        optional: true,
        isString: {
            errorMessage: 'Has to be a string',
            bail: true
        },
        custom: {
            options: async (value) => {
                if (!value) return true
                try {
                    await UserDAO.findById(value)
                    return Promise.reject()
                } catch (err: any) {
                    if (err.status === 404) return Promise.resolve(true)
                    throw err
                }
            },
            errorMessage: 'User with that id already exists'
        }
    },
    email: {
        exists: {
            errorMessage: 'Must exist'
        },
        isString: {
            errorMessage: 'Has to be a string',
        },
        isEmail: {
            errorMessage: 'Has to be an email!',
            bail: true
        },
        custom: {
            options: async (value) => {
                try {
                    await UserDAO.findById(value)
                    return Promise.reject()
                } catch (err: any) {
                    if (err.status === 404) return Promise.resolve(true)
                }
            },
            errorMessage: "User with that email already exists"
        }

    },
    password: {
        exists: {
            errorMessage: 'Must exist'
        },
        isString: {
            bail: true
        },
        isLength: {
            options: { min: 5 },
            errorMessage: 'Has to have atleast 5 characters!'
        }
    },
    familyName: {
        exists: {
            errorMessage: 'Must exist'
        },
        isString: {
            bail: true
        },
    },
    givenName: {
        exists: {
            errorMessage: 'Must exist'
        },
        isString: {
            bail: true
        },
    },

}

const updateSchema: Schema = {
    email: {
        optional: true,
        isString: {
            errorMessage: 'Has to be a string',
            bail: true
        },
        isEmail: {
            errorMessage: 'Has to be an email!'
        }
    },
    password: {
        optional: true,
        isString: {
            bail: true
        },
        isLength: {
            options: { min: 5 },
            errorMessage: 'Has to have atleast 5 characters!'
        }
    },
    familyName: {
        optional: true,

        isString: {
            bail: true
        },
    },
    givenName: {
        optional: true,
        isString: {
            bail: true
        },
    },
}


export const createUserValidation = checkSchema(createSchema)
export const updateUserValidation = checkSchema(updateSchema)

/**
 * Fields that must never be set through a request body by a regular user.
 * Without this guard a user could e.g. PATCH their own profile with `{ "isSuperAdmin": true }`,
 * because the update falls back to the raw body when no validated field is present.
 */
export const PROTECTED_USER_FIELDS = ['_id', 'isSuperAdmin', 'isVerified', 'identityId', 'createdAt', 'updatedAt']

export const stripProtectedUserFields: express.Handler = (req, res, next) => {
    if (req.body && typeof req.body === 'object' && !req.requestingUser?.isSuperAdmin) {
        for (const field of PROTECTED_USER_FIELDS) delete req.body[field]
    }
    return next()
}



