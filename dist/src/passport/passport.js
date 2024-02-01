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
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = __importDefault(require("passport-local"));
const passport_http_1 = __importDefault(require("passport-http"));
// import CouchUserDAO from '../models/User/CouchUserDAO'
const PasswordService_1 = __importDefault(require("../services/PasswordService"));
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const BasicStrategy = passport_http_1.default.BasicStrategy;
const LocalStrategy = passport_local_1.default.Strategy;
const checkUserAndPassword = (username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield UserDAO_1.default.findById(username);
        if (!(yield PasswordService_1.default.verifyPassword(password, user.password)))
            return done(null, false);
        if (!user.isVerified)
            return done({ message: "User is not verified yet! Check your email", status: 400 });
        return done(null, user);
    }
    catch (err) {
        if (err.status === 404)
            return done({ message: "Wrong username or password!", status: 400 });
        return done(err);
    }
});
passport_1.default.use(new LocalStrategy({ usernameField: 'email' }, checkUserAndPassword));
// passport.use(new BasicStrategy(checkUserAndPassword))
exports.default = passport_1.default;
