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
import { pathBDTOInstance } from "../models/Path/PathBDTO"
import RoleDAO from "../models/Role/RoleDAO"
import { RoleModel } from "../models/Role/RoleModel"
import UserDAO from "../models/User/UserDAO"
import { UserModel } from "../models/User/UserModel"
import OIDCClientDAO from "../models/OIDCClient/OIDCClientDAO"
import OIDCClientModel from "../models/OIDCClient/OIDCClientModel"
import OIDCProviderDAO from "../models/OIDCProvider/OIDCProviderDAO"
import OIDCProviderModel from "../models/OIDCProvider/OIDCProviderModel"
import { CONFIG } from "./config"
//create Admin User if not exists

export default async function configureDependencies(app: any, excludedPaths: string[]) {
    const rootUser = CONFIG.CLM_ROOT_USER
    const rootPassword = CONFIG.CLM_ROOT_PASSWORD

    // Helm-friendly bootstrap slots (no JSON required):
    //   CLM_ADMIN_USER_1 / CLM_ADMIN_PASSWORD_1 ... CLM_ADMIN_USER_10 / CLM_ADMIN_PASSWORD_10
    // These are optional and can be used in addition to CLM_ADMIN_USERS (JSON).
    const slotAdmins: any[] = []
    for (let i = 1; i <= 10; i++) {
        const username = (process.env[`CLM_ADMIN_USER_${i}`] || process.env[`CLM_ADMIN_USER${i}`] || '').toString().trim()
        const password = (process.env[`CLM_ADMIN_PASSWORD_${i}`] || process.env[`CLM_ADMIN_PASSWORD${i}`] || '').toString()
        if (!username || !password) continue
        slotAdmins.push({ adminUsername: username, adminPassword: password })
    }

    // Support bootstrapping multiple admin users via CLM_ADMIN_USERS.
    // We always include the legacy root user as primary admin for backward compatibility.
    const rawAdminUsers: any[] = Array.isArray((CONFIG as any).CLM_ADMIN_USERS) ? (CONFIG as any).CLM_ADMIN_USERS : []
    const bootstrapAdmins = [
        {
            email: rootUser,
            password: rootPassword,
            givenName: 'fokus',
            familyName: 'fame',
            isSuperAdmin: true,
        },
        ...slotAdmins,
        ...rawAdminUsers,
    ]

    // Deduplicate admin users by email to avoid redundant DB queries/inserts.
    const uniqueAdmins = new Map<string, any>()
    for (const candidate of bootstrapAdmins) {
        // Accept both formats:
        //  - { email, password }
        //  - { adminUsername, adminPassword } (Helm-friendly naming)
        const email = (candidate?.email || candidate?.adminUsername || '').toString().trim()
        if (!email) continue
        if (!uniqueAdmins.has(email)) uniqueAdmins.set(email, candidate)
    }

    let selfRole = (await RoleDAO.findByAttributes({ displayName: "Self" }))[0]
    if (!selfRole) selfRole = await RoleDAO.insert(new RoleModel({
        displayName: "Self",
        lineage: false,
        resourcePermissions: {
            lo: 1,
            service: 1,
            tool: 1,
            group: 1,
            role: 0,
            consumer: 0,
            user: 14,
            mcp_server: 1,
        },
        strength: 0
    }))

    let learnerRole = (await RoleDAO.findByAttributes({ displayName: "Learner" }))[0]
    if (!learnerRole) learnerRole = await RoleDAO.insert(new RoleModel({
        displayName: "Learner",
        lineage: true,
        resourcePermissions: {
            lo: 1,
            service: 1,
            tool: 1,
            group: 1,
            user: 1,
            role: 1,
            consumer: 0,
            mcp_server: 1,
        },
        strength: 1,
        immutable: true
    }))

    let instructorRole = (await RoleDAO.findByAttributes({ displayName: "Instructor" }))[0]
    if (!instructorRole) instructorRole = await RoleDAO.insert(new RoleModel({
        displayName: 'Instructor',
        lineage: true,
        resourcePermissions: {
            lo: 7,
            service: 7,
            tool: 7,
            group: 1,
            user: 3,
            role: 1,
            consumer: 1,
            mcp_server: 7
        },
        strength: 2,
        immutable: true
    }))

    let orgAdminRole = (await RoleDAO.findByAttributes({ displayName: "OrgAdmin" }))[0]
    if (!orgAdminRole) orgAdminRole = await RoleDAO.insert(new RoleModel({
        displayName: "OrgAdmin",
        lineage: true,
        resourcePermissions: {
            lo: 15,
            service: 15,
            tool: 15,
            group: 15,
            user: 15,
            role: 15,
            consumer: 15,
            mcp_server: 15
        },
        strength: 3,
        immutable: true
    }))

    await pathBDTOInstance.registerRoutes(app, excludedPaths, CONFIG.CLM_API_KEY, rootUser)

    // Create admin user(s) if they do not exist yet.
    // NOTE: This is intentionally idempotent: it only inserts when missing.
    for (const [, admin] of uniqueAdmins) {
        const email = (admin?.email || admin.adminUsername || '').toString().trim()
        if (!email) continue

        // If no password is provided for additional admins, fall back to root password.
        // This keeps deployments working even if only emails are provided.
        const password = (admin?.password || admin?.adminPassword || rootPassword || '').toString()
        if (!password) {
            console.warn('[BOOTSTRAP] Skipping admin user without password:', email)
            continue
        }

        const existingUser = (await UserDAO.findByAttributes({ email }))?.[0]
        if (existingUser) continue

        await UserDAO.insert(new UserModel({
            email,
            isVerified: true,
            _id: email,
            // Optional profile fields (safe defaults).
            familyName: (admin?.familyName || 'admin').toString(),
            givenName: (admin?.givenName || 'admin').toString(),
            isSuperAdmin: admin?.isSuperAdmin === undefined ? true : Boolean(admin.isSuperAdmin),
            password,
        }))
    }

    // Migrate OIDC Providers from env to DB if not already present
    try {
        const existingProviders = await OIDCProviderDAO.findAll()
        if (existingProviders.length === 0 && CONFIG.OIDC_PROVIDERS && CONFIG.OIDC_PROVIDERS.length > 0) {
            console.log('Migrating OIDC Providers from env to database...')
            for (const provider of CONFIG.OIDC_PROVIDERS) {
                await OIDCProviderDAO.insert(new OIDCProviderModel({
                    displayName: provider.displayName || 'Migrated Provider',
                    authorization_endpoint: provider.authorization_endpoint,
                    token_endpoint: provider.token_endpoint,
                    end_session_endpoint: provider.end_session_endpoint,
                    userinfo_endpoint: provider.userinfo_endpoint,
                    jwks_uri: provider.jwks_uri || process.env.GLOBAL_JWKS_URI,
                    client_id: provider.client_id,
                    client_secret: provider.client_secret,
                    issuer: provider.issuer,
                    active: true
                }))
            }
            console.log(`Migrated ${CONFIG.OIDC_PROVIDERS.length} OIDC Provider(s) to database`)
        }
    } catch (err) {
        console.error('Failed to migrate OIDC Providers from env to DB:', err)
    }

    // Migrate OIDC Clients from env to DB if not already present
    try {
        const existingClients = await OIDCClientDAO.findAll()
        if (existingClients.length === 0 && CONFIG.ODIC_CLIENTS && CONFIG.ODIC_CLIENTS.length > 0) {
            console.log('Migrating OIDC Clients from env to database...')
            for (const client of CONFIG.ODIC_CLIENTS) {
                await OIDCClientDAO.insert(new OIDCClientModel({
                    client_id: client.client_id,
                    client_secret: client.client_secret,
                    displayName: client.displayName || 'Migrated Client',
                    jwks_uri: client.jwks_uri,
                    valid_redirect_uris: client.valid_redirect_uris || [],
                    active: true
                }))
            }
            console.log(`Migrated ${CONFIG.ODIC_CLIENTS.length} OIDC Client(s) to database`)
        }
    } catch (err) {
        console.error('Failed to migrate OIDC Clients from env to DB:', err)
    }

}




