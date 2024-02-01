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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
exports.CONFIG = {
    ENV: process.env.ENV || 'dev',
    MARIA_CONFIG: process.env.MARIA_CONFIG || 'localhost|3306|clm|root|12345',
    PORT: process.env.PORT || 3000,
    BASE_PATH: process.env.BASE_PATH || '/core',
    CLM_ROOT_USER: process.env.CLM_ROOT_USER || 'admin@localhost.tld',
    CLM_ROOT_PASSWORD: process.env.CLM_ROOT_PASSWORD || 'ABC123',
    DEPLOY_URL: process.env.DEPLOY_URL || 'http://localhost/api',
    SMTP_FROM: process.env.SMTP_FROM || '',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: process.env.SMTP_PORT || '',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    DISABLE_ERR_RESPONSE: process.env.DISABLE_ERR_RESPONSE || false,
    TOKEN_SECRET: process.env.TOKEN_SECRET || 'secret',
    REDIS_CONFIG: process.env.REDIS_CONFIG || 'localhost|6379',
    OIDC_PROVIDERS: JSON.parse(process.env.OIDC_PROVIDERS || `[]`),
    ODIC_CLIENTS: JSON.parse(process.env.OIDC_CLIENTS || `[]`),
};
