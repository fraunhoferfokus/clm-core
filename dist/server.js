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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOT_DIR = void 0;
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./src/config/config");
const configureDeps_1 = __importDefault(require("./src/config/configureDeps"));
const EntryPointController_1 = __importDefault(require("./src/controllers/EntryPointController"));
const ErrorHandler_1 = __importDefault(require("./src/handlers/ErrorHandler"));
dotenv_1.default.config();
exports.ROOT_DIR = process.cwd();
//@ts-ignore
global.__basedir = __dirname;
const app = (0, express_1.default)();
const PORT = config_1.CONFIG.PORT;
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token, x-token-renewed, x-api-key');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    next();
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const basePath = config_1.CONFIG.BASE_PATH || '/core';
const EXCLUDED_PATHS = [
    `${basePath}/swagger`,
    `${basePath}/roles`,
    `${basePath}/roles/:id`,
    `${basePath}/users/verifyToken/:tokenId`,
    `${basePath}/mgmt/consumers/:id/confirm`,
    `${basePath}/sso/oidc`,
    `${basePath}/sso/success`,
    `${basePath}/sso/oidc/backend/login`,
    `${basePath}/sso/oidc/access_token_by_code`,
    `${basePath}/sso/oidc/broker/logout`,
    `${basePath}/sso/oidc/broker/logout/redirect`,
    `/health`
];
app.get('/health', (req, res) => res.send('OK'));
app.set('views', path_1.default.join(exports.ROOT_DIR, '/pages'));
app.set('view engine', 'ejs');
app.use(basePath, EntryPointController_1.default);
app.use(ErrorHandler_1.default);
(0, configureDeps_1.default)(app, EXCLUDED_PATHS).then(() => app.listen(PORT, () => {
    console.info('Listening for core');
})).catch((err) => {
    console.error(JSON.stringify(err));
});
