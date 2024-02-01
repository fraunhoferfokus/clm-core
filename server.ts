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

import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
import express from 'express'
import configureDependencies from './src/config/configureDeps'
import EntryPointController from './src/controllers/EntryPointController'
import errHandler from './src/handlers/ErrorHandler'
import { CONFIG } from './src/config/config'
import path from 'path'
import { GroupModel, RelationModel, relationBDTOInstance } from './src/lib/CoreLib'
import RelationDAO from './src/models/Relation/RelationDAO'
import GroupDAO from './src/models/Group/GroupDAO'
import RoleDAO from './src/models/Role/RoleDAO'
import { v4 as uuidv4 } from 'uuid'

export const ROOT_DIR = process.cwd()

//@ts-ignore
global.__basedir = __dirname
const app = express()
const PORT = CONFIG.PORT

app.use(function (req, res, next) {
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token, x-token-renewed, x-api-key'
    );
    res.header(
        'Access-Control-Allow-Methods',
        'GET,PUT,POST,DELETE,PATCH,OPTIONS'
    );
    next();
});
app.use(cors())
app.use(express.json())

const basePath = CONFIG.BASE_PATH || '/core';
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
]

app.get('/health', (req, res) => res.send('OK'))
app.set('views', path.join(ROOT_DIR, '/pages'))
app.set('view engine', 'ejs')

app.use(basePath, EntryPointController)
app.use(errHandler);

configureDependencies(app, EXCLUDED_PATHS).then(() =>
    app.listen(PORT, () => {
        console.info('Listening for core')
    })
).catch((err) => {
    console.error(JSON.stringify(err))
})



