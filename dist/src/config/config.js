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
    ALLOWED_ISSUERS: JSON.parse(process.env.ALLOWED_ISSUERS || `[]`),
    ENV: process.env.ENV || 'dev',
    PG_CONFIG: process.env.PG_CONFIG || 'localhost|5432|clm|root|12345',
    PG_SSL_MODE: process.env.PG_SSL_MODE || 'none',
    PG_SSL_CA_PATH: process.env.PG_SSL_CA_PATH || '',
    PG_POOL_PING_INTERVAL_MS: parseInt(process.env.PG_POOL_PING_INTERVAL_MS || '30000'),
    MARIA_CONFIG: process.env.MARIA_CONFIG || 'localhost|3306|clm|root|12345',
    PORT: process.env.PORT || 3000,
    BASE_PATH: process.env.BASE_PATH || '/core',
    CLM_ROOT_USER: process.env.CLM_ROOT_USER || 'admin@localhost.tld',
    CLM_ROOT_PASSWORD: process.env.CLM_ROOT_PASSWORD || 'ABC123',
    CLM_API_KEY: process.env.CLM_API_KEY || 'MGMT_SERVICE',
    DEPLOY_URL: process.env.DEPLOY_URL || 'http://localhost/api',
    SMTP_FROM: process.env.SMTP_FROM || '',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: process.env.SMTP_PORT || '',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    VERBOSE: process.env.VERBOSE || 'false',
    DISABLE_ERR_RESPONSE: process.env.DISABLE_ERR_RESPONSE || false,
    TOKEN_SECRET: process.env.TOKEN_SECRET || 'secret',
    REDIS_CONFIG: process.env.REDIS_CONFIG || 'localhost|6379',
    OIDC_PROVIDERS: JSON.parse(process.env.OIDC_PROVIDERS || `[]`),
    ODIC_CLIENTS: JSON.parse(process.env.OIDC_CLIENTS || `[]`),
    ALLOW_TRUSTED_CLIENTS: (() => {
        const raw = process.env.ALLOW_TRUSTED_CLIENTS;
        if (raw === undefined || raw === null || raw === '')
            return true;
        return /^(1|true|yes|on)$/i.test(raw.trim());
    })(),
    // OIDC claim mapping (allows different IAM attribute naming). Defaults follow common OpenID fields and provided IAM schema
    OIDC_CLAIM_SUB: process.env.OIDC_CLAIM_SUB || 'sub',
    OIDC_CLAIM_EMAIL: process.env.OIDC_CLAIM_EMAIL || 'email',
    OIDC_CLAIM_GIVEN_NAME: process.env.OIDC_CLAIM_GIVEN_NAME || 'given_name',
    OIDC_CLAIM_FAMILY_NAME: process.env.OIDC_CLAIM_FAMILY_NAME || 'family_name',
    OIDC_CLAIM_TITLE: process.env.OIDC_CLAIM_TITLE || 'title',
    OIDC_CLAIM_PERSONNEL_NR: process.env.OIDC_CLAIM_PERSONNEL_NR || 'BWPersPERNR',
    OIDC_CLAIM_TRAINING_ID: process.env.OIDC_CLAIM_TRAINING_ID || 'VLBwAusbildungsID',
    OIDC_CLAIM_GROUPS: process.env.OIDC_CLAIM_GROUPS || 'BwSSOGroupVLBw',
    // Group parsing and role mapping
    OIDC_GROUP_ROLE_DELIMITER: process.env.OIDC_GROUP_ROLE_DELIMITER || '_',
    // Suffix tokens expected in the groups claim
    OIDC_GROUP_SUFFIX_LEARNER: process.env.OIDC_GROUP_SUFFIX_LEARNER || 'Learner',
    OIDC_GROUP_SUFFIX_INSTRUCTOR: process.env.OIDC_GROUP_SUFFIX_INSTRUCTOR || 'Instructor',
    OIDC_GROUP_SUFFIX_ADMIN: process.env.OIDC_GROUP_SUFFIX_ADMIN || 'Admin',
    // Map suffix to internal role display names (existing roles: Learner | Instructor | OrgAdmin)
    OIDC_ROLEMAP_LEARNER: process.env.OIDC_ROLEMAP_LEARNER || 'Learner',
    OIDC_ROLEMAP_INSTRUCTOR: process.env.OIDC_ROLEMAP_INSTRUCTOR || 'Instructor',
    // "Admin" in IAM will be mapped by default to internal role "OrgAdmin" to match current RoleModel type
    OIDC_ROLEMAP_ADMIN: process.env.OIDC_ROLEMAP_ADMIN || 'OrgAdmin',
    // Whether to validate/sync groups on each authenticated request (AuthGuard)
    OIDC_SYNC_GROUPS_ON_AUTH: (() => {
        const raw = process.env.OIDC_SYNC_GROUPS_ON_AUTH;
        if (raw === undefined || raw === null || raw === '')
            return true;
        return /^(1|true|yes|on)$/i.test(raw.trim());
    })(),
    // Whether to validate/sync groups on IdP refresh-token exchange
    OIDC_SYNC_GROUPS_ON_REFRESH: (() => {
        const raw = process.env.OIDC_SYNC_GROUPS_ON_REFRESH;
        if (raw === undefined || raw === null || raw === '')
            return true;
        return /^(1|true|yes|on)$/i.test(raw.trim());
    })(),
};
