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
exports.updateApiTokenValidation = exports.createApiTokenValidation = void 0;
const express_validator_1 = require("express-validator");
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const PathDAO_1 = __importDefault(require("../models/Path/PathDAO"));
const sharedSchema = {
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
                const scopes = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
                if (!arr.every((value) => scopes.includes(value)))
                    return false;
                return true;
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
            options: (route, { req, location, path }) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield PathDAO_1.default.findById(route);
                    return Promise.resolve();
                }
                catch (err) {
                    return Promise.reject();
                }
            }),
            errorMessage: `Specified Route not found!`
        }
    }
};
const createSchema = Object.assign({ userId: {
        in: ['body'],
        exists: {
            errorMessage: 'Has to exist',
            bail: true
        },
        custom: {
            options: (value, { req }) => __awaiter(void 0, void 0, void 0, function* () {
                return UserDAO_1.default.findById(value);
            }),
            errorMessage: `Not found user with that id`,
        }
    }, domain: {
        in: ['body',
        ],
        exists: true,
        isString: true
    }, displayName: {
        in: ['body',
        ],
        exists: true,
        isString: true
    } }, sharedSchema);
const updateSchema = Object.assign({}, sharedSchema);
exports.createApiTokenValidation = (0, express_validator_1.checkSchema)(createSchema);
exports.updateApiTokenValidation = (0, express_validator_1.checkSchema)(updateSchema);
