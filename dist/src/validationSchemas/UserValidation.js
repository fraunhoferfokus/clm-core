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
exports.updateUserValidation = exports.createUserValidation = void 0;
const express_validator_1 = require("express-validator");
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const sharedSchema = {};
const createSchema = {
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
            options: (value) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield UserDAO_1.default.findById(value);
                    return Promise.reject();
                }
                catch (err) {
                    if (err.status === 404)
                        return Promise.resolve(true);
                }
            }),
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
};
const updateSchema = {
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
};
exports.createUserValidation = (0, express_validator_1.checkSchema)(createSchema);
exports.updateUserValidation = (0, express_validator_1.checkSchema)(updateSchema);
