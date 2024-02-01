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
exports.updateGroupValidation = exports.createGroupValidation = void 0;
const express_validator_1 = require("express-validator");
const RoleDAO_1 = __importDefault(require("../models/Role/RoleDAO"));
const sharedSchema = {};
const createGroupSchema = {
    displayName: {
        in: ['body'],
        exists: {
            errorMessage: 'Must exist'
        },
        isString: {
            errorMessage: 'Has to be a string'
        }
    },
    role: {
        in: ['body'],
        exists: {
            errorMessage: 'Must exist'
        },
        isString: {
            errorMessage: 'Has to be string',
            bail: true
        },
        custom: {
            options: (value) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield RoleDAO_1.default.findById(value);
                    return true;
                }
                catch (err) {
                    return false;
                }
            }),
            errorMessage: `Specified role does not exist`
        }
    }
};
const updateGroupSchema = {
    displayName: {
        in: ['body'],
        exists: {
            errorMessage: 'Must exist'
        },
        isString: {
            errorMessage: 'Has to be a string'
        }
    },
};
exports.createGroupValidation = (0, express_validator_1.checkSchema)(createGroupSchema);
exports.updateGroupValidation = (0, express_validator_1.checkSchema)(updateGroupSchema);
