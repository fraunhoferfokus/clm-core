import express from 'express'
import { CONFIG } from '../config/config';
import axios from 'axios';
import jwt from 'jsonwebtoken'
import UserDAO from '../models/User/UserDAO';
import { UserModel, jwtServiceInstance } from '../lib/CoreLib';
import { randomUUID } from 'crypto';
import OIDCStateDAO from '../models/OIDCState/OIDCStateDAO';
import OIDCStateModel from '../models/OIDCState/OIDCStateModel';
import GroupDAO from '../models/Group/GroupDAO';
import GroupModel from '../models/Group/GroupModel';
import RoleDAO from '../models/Role/RoleDAO';
import relationBDTOInstance from '../models/Relation/RelationBDTO';
import OIDCClientDAO from '../models/OIDCClient/OIDCClientDAO';
import OIDCProviderDAO from '../models/OIDCProvider/OIDCProviderDAO';
// get executing diretory of node-process

const OIDC_PROVIDER = CONFIG.OIDC_PROVIDERS
const firstProvider = OIDC_PROVIDER[0]

// Enrich OIDC providers with global jwks_uri if missing
let enrichedProviders: any[] = []
async function enrichProviders() {
    // Try to load from DB first
    let providersToEnrich: any[] = []
    try {
        const dbProviders = await OIDCProviderDAO.findAllActive()
        if (dbProviders && dbProviders.length > 0) {
            providersToEnrich = dbProviders
        } else {
            // Fallback to env config
            providersToEnrich = OIDC_PROVIDER || []
        }
    } catch (err) {
        // On DB error, fallback to env config
        providersToEnrich = OIDC_PROVIDER || []
        if (CONFIG.VERBOSE === 'true') console.error('Failed to load OIDC providers from DB, using env fallback:', err)
    }

    enrichedProviders = providersToEnrich.map((provider: any) => {
        const enriched = { ...provider }
        // If provider doesn't have jwks_uri, try to use global env variable
        if (!enriched.jwks_uri && process.env.GLOBAL_JWKS_URI) {
            enriched.jwks_uri = process.env.GLOBAL_JWKS_URI
        }
        return enriched
    })
}

// Initialize enriched providers
enrichProviders()

// Reload providers (called after DB changes)
export async function reloadProviders() {
    await enrichProviders()
}

// Export enriched providers for use in other modules (like jwksService)
export function getEnrichedProviders() {
    return enrichedProviders.length > 0 ? enrichedProviders : OIDC_PROVIDER
}

// Get first enriched provider
const firstEnrichedProvider = getEnrichedProviders()[0]

// Dynamic OIDC clients loader: DB first, then env fallback
let OIDC_CLIENTS: any[] = []
async function loadOIDCClients() {
    try {
        const dbClients = await OIDCClientDAO.findAllActive()
        if (dbClients && dbClients.length > 0) {
            // Use DB clients without modification
            OIDC_CLIENTS = dbClients
        } else {
            // Fallback to env config (legacy support)
            OIDC_CLIENTS = CONFIG.ODIC_CLIENTS || []
        }
    } catch (err) {
        // On DB error, fallback to env config
        OIDC_CLIENTS = CONFIG.ODIC_CLIENTS || []
        if (CONFIG.VERBOSE === 'true') console.error('Failed to load OIDC clients from DB, using env fallback:', err)
    }
}

// Utility to get current OIDC clients (refresh from DB if needed)
async function getOIDCClients() {
    if (OIDC_CLIENTS.length === 0) {
        await loadOIDCClients()
    }
    return OIDC_CLIENTS
}

let authorization_endpoint: string, token_endpoint: string, client_id: string, client_secret: string,
    end_session_endpoint: string, userinfo_endpoint: string
    ;
if (firstEnrichedProvider) {
    [authorization_endpoint, token_endpoint, client_id, client_secret, end_session_endpoint, userinfo_endpoint] = [firstEnrichedProvider.authorization_endpoint, firstEnrichedProvider.token_endpoint, firstEnrichedProvider.client_id, firstEnrichedProvider.client_secret, firstEnrichedProvider.end_session_endpoint, firstEnrichedProvider.userinfo_endpoint]
}

// In-memory oidc_state removed. Using persistent table 'oidc_states' for multi-pod compatibility.



class OIDController {
    router: express.Router;

    constructor() {
        this.router = express.Router();
        this.init()
    }

    init() {
        this.router.use((express.urlencoded({ extended: true })))
        this.router.get('/', this.ssoLanding)
        this.router.get('/backend/login', this.ssoBackendLogin)
        this.router.get('/success', this.ssoSuccess)
        this.router.post('/access_token_by_code', this.getAccessTokenByCode)
        this.router.get('/broker/logout', this.brokerLogout)
        this.router.get('/broker/logout/redirect', this.brokerLogoutRedirect)
        
        // Initialize OIDC clients on startup
        loadOIDCClients().catch(err => {
            if (CONFIG.VERBOSE === 'true') console.error('Error loading OIDC clients on init:', err)
        })
    }

    brokerLogout: express.Handler = async (req, res, next) => {
        try {
            const { post_logout_redirect_uri: oidc_client_post_logout_redirect_uri, client_id: odic_client_client_id } = req.query

            if (!oidc_client_post_logout_redirect_uri || !odic_client_client_id) return next({ status: 400, message: 'post_logout_redirect_uri, client_id required' })

            const clients = await getOIDCClients()
            const oidc_client = clients.find((oidc_client) => oidc_client.client_id === odic_client_client_id)

            if (!oidc_client || !oidc_client.valid_redirect_uris.includes(oidc_client_post_logout_redirect_uri)) return next({ status: 400, message: 'Invalid post_logout_redirect_uri' })
            let broker_post_logout_uri = CONFIG.DEPLOY_URL + '/core/sso/oidc/broker/logout/redirect'

            const url = new URL(end_session_endpoint)
            const state = randomUUID();
            url.searchParams.set('state', state)
            url.searchParams.append('response_type', 'code')
            url.searchParams.append('scope', 'openid')
            url.searchParams.append('client_id', client_id)
            url.searchParams.append('post_logout_redirect_uri', broker_post_logout_uri)
            await OIDCStateDAO.insert(new OIDCStateModel({ state, postLogoutRedirectUri: oidc_client_post_logout_redirect_uri as string }))

            return res.redirect(url.toString())
        } catch (err) {
            return next(err)
        }
    }

    brokerLogoutRedirect: express.Handler = async (req, res, next) => {
        try {
            const { state } = req.query
            const oidcClientState = await OIDCStateDAO.consume(state as string)
            if (!oidcClientState || !oidcClientState.postLogoutRedirectUri) return next({ status: 400, message: 'Invalid state' })
            const { postLogoutRedirectUri: post_logout_redirect_uri } = oidcClientState
            return res.redirect(post_logout_redirect_uri)
        } catch (err) {
            return next(err)
        }
    }


    ssoLanding: express.Handler = async (req, res, next) => {
        try {
            const { client_id: oidc_client_id, scope: oidc_client_scope, redirect_uri: oidc_redirect_uri } = req.query

            if (oidc_client_id || oidc_client_scope || oidc_redirect_uri) {
                if (!oidc_client_id || !oidc_client_scope || !oidc_redirect_uri) return res.status(400).json({
                    message: 'client_id, scope, redirect_uri required'
                })

                const clients = await getOIDCClients()
                let oidc_client = clients.find((oidc_client) => oidc_client.client_id === oidc_client_id)
                if (oidc_client) {
                    let valid_redirect_uri = oidc_client.valid_redirect_uris.find((valid_redirect_uri: any) => valid_redirect_uri === oidc_redirect_uri)
                    let state = randomUUID()
                    try {
                        await OIDCStateDAO.insert(new OIDCStateModel({ state, redirectUri: oidc_redirect_uri as string }))
                    } catch (e) {
                        return next(e)
                    }
                    if (valid_redirect_uri) {
                        const oidc_url = `${authorization_endpoint}?response_type=code&client_id=${client_id}&scope=openid&redirect_uri=${CONFIG.DEPLOY_URL}/core/sso/oidc/backend/login&state=${state}`
                        return res.redirect(oidc_url)
                    }
                    return res.status(500).json({
                        message: 'Invalid redirect_uri'
                    })
                } else {
                    return res.status(500).json({
                        message: 'Invalid client_id'
                    })
                }
            }

            const oidc_url = `${authorization_endpoint}?response_type=code&client_id=${client_id}&scope=openid&redirect_uri=${CONFIG.DEPLOY_URL}/core/sso/oidc/backend/login`

            if (firstEnrichedProvider) {
                return res.render('login', {
                    oidc_url
                })
            }

            return res.status(500).json({
                message: 'No OIDC Provider configured'
            })

        } catch (err: any) {
            return res.status(err.status || 500).json({
                message: err.message || err
            })
        }
    }

    ssoBackendLogin: express.Handler = async (req, res, next) => {
        try {
            const { state } = req.query
            const { code } = req.query

            if (state) {
                const stored = await OIDCStateDAO.consume(state as string)
                if (!stored || !stored.redirectUri) return res.status(400).json({
                    message: 'Invalid state'
                })
                const { redirectUri: redirect_uri } = stored
                return res.redirect(`${redirect_uri}?code=${code}`)
            }

            // let full_logout_endpoint = `${lougout_endpoint}?response_type=code&scope=openid&client_id=${process.env.KEYCLOAK_CLIENT_ID}&id_token_hint=${id_token_hint}&post_logout_redirect_uri=${post_logout_redirect_uri}`

            let {
                access_token: idp_access_token,
                refresh_token: idp_refresh_token,
                expires_in: idp_access_token_expires_in,
                refresh_expires_in: idp_refresh_token_expires_in,
                user
            } = await this.codeAuthFlow(code as string)



            const [accessToken, refreshToken] = await jwtServiceInstance.createAccessAndRefreshToken(user);
            let decodedA: any = jwt.decode(accessToken);
            let decodedR: any = jwt.decode(refreshToken);
            let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
            let refreshTokenExpiresIn = new Date(1000 * decodedR.exp).toJSON();

            return res.redirect(`${CONFIG.DEPLOY_URL}/core/sso/oidc/success?id=${user._id}&access_token_expires_in=${accessTokenExpiresIn}&refresh_token_expires_in=${refreshTokenExpiresIn}&idp_access_token=${idp_access_token}&idp_refresh_token=${idp_refresh_token}&idp_access_token_expires_in=${idp_access_token_expires_in}&idp_refresh_token_expires_in=${idp_refresh_token_expires_in}
                `)
        } catch (err: any) {
            return res.status(err.status || 500).json({
                message: err.message || err
            })
        }
    }

    codeAuthFlow = async (code: string) => {
        try {
            const keycloak_response = await axios(token_endpoint, {
                method: 'POST',
                data: {
                    grant_type: 'authorization_code',
                    client_id,
                    client_secret,
                    code,
                    redirect_uri: `${CONFIG.DEPLOY_URL}/core/sso/oidc/backend/login`
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            const { access_token, refresh_token, expires_in, refresh_expires_in, id_token } = keycloak_response.data

            // Prefer ID Token claims; fall back to Access Token if ID Token not returned
            const decodedId: any = id_token ? jwt.decode(id_token) : undefined
            const decodedAcc: any = jwt.decode(access_token)
            const claims: any = decodedId || decodedAcc || {}

            // Resolve claim keys from CONFIG with sensible defaults
            const claimKey = {
                sub: CONFIG.OIDC_CLAIM_SUB,
                email: CONFIG.OIDC_CLAIM_EMAIL,
                givenName: CONFIG.OIDC_CLAIM_GIVEN_NAME,
                familyName: CONFIG.OIDC_CLAIM_FAMILY_NAME,
                title: CONFIG.OIDC_CLAIM_TITLE,
                personnelNr: CONFIG.OIDC_CLAIM_PERSONNEL_NR,
                trainingId: CONFIG.OIDC_CLAIM_TRAINING_ID,
                groups: CONFIG.OIDC_CLAIM_GROUPS,
            }

            // Extract fields for user creation/update
            // Identity selection: prefer trainingId claim, otherwise fall back to subject (sub)
            const subject = (claims?.[claimKey.sub] ?? decodedAcc?.sub) as string
            const identityId = (claims?.[claimKey.trainingId] ?? subject) as string
            const tokenEmail = (claims?.[claimKey.email] ?? '') as string
            const tokenGiven = (claims?.[claimKey.givenName] ?? '') as string
            const tokenFamily = (claims?.[claimKey.familyName] ?? '') as string
            const tokenGroupsRaw = (claims?.[claimKey.groups] ?? '') as string

            // Verbesserte User-Ermittlung:
            // 1. Versuche anhand identityId zu finden
            // 2. Falls nicht gefunden: versuche anhand email/_id (wir nehmen subject als Email/_id Surrogat) zu finden
            // 3. Falls gefunden aber identityId fehlt -> update setzen
            // 4. Falls gar nicht vorhanden -> neu anlegen
            // 5. Race-Condition (Unique 23505) beim Insert abfangen und danach erneut laden

            // Try to find user by identityId (preferred)
            let user: UserModel | undefined = (await UserDAO.findByAttributes({ identityId }))[0]

            if (!user) {
                // Versuch über email/_id zu finden (abhängig vom Datenmodell: _id vermutlich = email)
                // 1) Try with email from token if present
                let existingById = tokenEmail ? await UserDAO.findById(tokenEmail).catch(() => undefined) : undefined
                // 2) Backward-compatibility: try sub as id
                if (!existingById) existingById = await UserDAO.findById(subject).catch(() => undefined)
                if (!existingById) {
                    // Fallback: Suche über email-Attribut, falls Modell das unterstützt
                    const byEmail = tokenEmail
                        ? (await UserDAO.findByAttributes({ email: tokenEmail }))[0]
                        : (await UserDAO.findByAttributes({ email: subject }))[0]
                    if (byEmail) existingById = byEmail
                }
                if (existingById) {
                    // Update identityId falls noch nicht gesetzt
                    if (!(existingById as any).identityId) {
                        try {
                            (existingById as any).identityId = identityId
                            user = await UserDAO.updateById(existingById._id, existingById as any)
                        } catch (e) {
                            // Falls Update fehlschlägt, erneut lesen
                            user = await UserDAO.findById(existingById._id)
                        }
                    } else {
                        user = existingById as any
                    }
                }
            }

            if (!user) {
                // Create new user using available claims (email/given/family). Fallbacks to subject when missing.
                const newUser = new UserModel({
                    _id: identityId,
                    isVerified: true,
                    password: randomUUID(),
                    familyName: tokenFamily || subject,
                    givenName: tokenGiven || subject,
                    email: tokenEmail || subject,
                    identityId: identityId,
                })
                try {
                    user = await UserDAO.insert(newUser)
                } catch (e: any) {
                    // Unique Constraint (z.B. 23505) -> parallele Anlage -> User erneut laden
                    const pgCode = e?.code || e?.original?.code
                    if (pgCode === '23505') {
                        // Jetzt nochmals über identityId oder Id holen
                        user = (await UserDAO.findByAttributes({ identityId }))[0]
                        if (!user) {
                            // Try by email token first, then by subject (backward-compat)
                            user = tokenEmail ? await UserDAO.findById(tokenEmail).catch(async () => {
                                return (await UserDAO.findByAttributes({ email: tokenEmail }))[0]
                            }) as any : undefined
                            if (!user) {
                                user = await UserDAO.findById(subject).catch(async () => {
                                    return (await UserDAO.findByAttributes({ email: subject }))[0]
                                }) as any
                            }
                        }
                    } else {
                        throw e
                    }
                }
            }

            if (!user) {
                throw { status: 500, message: 'User konnte nach OIDC Auth nicht bestimmt werden.' }
            }

            // Update existing user profile fields if missing; avoid changing primary key/email when already set
            try {
                const patch: Partial<UserModel> = {} as any
                if (!user.identityId && identityId) (patch as any).identityId = identityId
                if (!user.givenName && tokenGiven) (patch as any).givenName = tokenGiven
                if (!user.familyName && tokenFamily) (patch as any).familyName = tokenFamily
                // Only set email if equal to current id (newly created with subject) or empty
                if ((user.email === user._id && user.email === subject) && tokenEmail) {
                    // WARNING: Changing email changes the logical identifier in this system. We only patch email
                    // when user was created with subject as email in this flow.
                    (patch as any).email = tokenEmail
                }
                if (Object.keys(patch).length > 0) {
                    user = await UserDAO.updateById(user._id, Object.assign(user, patch) as any)
                }
            } catch (e) {
                // Non-fatal: continue SSO even if profile update fails
            }

            // Synchronize groups/roles from token claim (BwSSOGroupVLBw or configured key)
            try {
                await this.syncGroupsAndMembershipsFromClaims(user._id, tokenGroupsRaw)
            } catch (e) {
                // Non-fatal during login; log on server if VERBOSE
                if (CONFIG.VERBOSE === 'true') console.error('Group sync error:', e)
            }

            return { user, access_token, refresh_token, expires_in, refresh_expires_in }
        } catch (err) {
            throw err
        }
    }



    getAccessTokenByCode: express.Handler = async (req, res, next) => {
        try {
            const { code, client_id, client_secret, redirect_uri } = req.body

            if (!client_id || !client_secret || !redirect_uri) return res.status(400).json({
                message: 'client_id, client_secret, redirect_uri required'
            })

            const clients = await getOIDCClients()
            let oidc_client = clients.find((oidc_client) => oidc_client.client_id === client_id)
            if (!oidc_client) return res.status(400).json({
                message: 'Invalid client_id'
            })

            if (!oidc_client.valid_redirect_uris.includes(redirect_uri)) return res.status(400).json({
                message: 'Invalid redirect_uri'
            })

            if (oidc_client.client_secret !== client_secret) return res.status(400).json({
                message: 'Invalid client_secret'
            })

            const { access_token, refresh_token, expires_in, refresh_expires_in } = await this.codeAuthFlow(code as string)
            return res.json({
                access_token,
                refresh_token,
                expires_in,
                refresh_expires_in
            })
        } catch (err: any) {
            console.error(err?.response?.data)
            return next(err)
        }
    }

    ssoSuccess: express.Handler = async (req, res, next) => {
        try {
            const { id, idp_access_token, idp_refresh_token, idp_access_token_expires_in, idp_refresh_token_expires_in

            } = req.query


            const user = await UserDAO.findById(id as string)

            // return res.json({
            //     access_token,
            //     user,
            //     idp_access_token,
            //     idp_refresh_token

            // })
            let gateway_url = CONFIG.DEPLOY_URL.includes('localhost') ? 'http://gateway/api' : CONFIG.DEPLOY_URL
            const course_structure_url = `${gateway_url}/learningObjects/users/${user._id}/courses`
            const course_structure = (await axios.get(course_structure_url, {
                headers: {
                    Authorization: `Bearer ${CONFIG.CLM_API_KEY}`,
                    'x-access-token': idp_access_token as string
                }
            })).data

            return res.render('success', {
                access_token: idp_access_token,
                access_token_expires_in: idp_access_token_expires_in,
                refresh_token: idp_refresh_token,
                refresh_token_expires_in: idp_refresh_token_expires_in,
                course_structure,
                user,
                end_session_endpoint: end_session_endpoint + '?post_logout_redirect_uri=' + CONFIG.DEPLOY_URL + '/core/sso/oidc' + '&client_id=' + client_id
            })
        } catch (err: any) {
            return res.status(err.status || 500).json({
                message: err.message || err
            })
        }
    }

    // --------------- Helper methods for OIDC group/role processing ---------------
    private normalizeGroupToken(raw: string): string {
        // Remove extra spaces around delimiters and trim
        return (raw || '').replace(/\s*_\s*/g, CONFIG.OIDC_GROUP_ROLE_DELIMITER).replace(/\s+/g, ' ').trim()
    }

    private parseGroupEntry(entry: string): { base: string, suffix: string | null } {
        const cleaned = this.normalizeGroupToken(entry)
        if (!cleaned) return { base: '', suffix: null }
        const delim = CONFIG.OIDC_GROUP_ROLE_DELIMITER
        const lastIdx = cleaned.lastIndexOf(delim)
        if (lastIdx < 0) {
            return { base: cleaned, suffix: null }
        }
        const base = cleaned.substring(0, lastIdx)
        const rawSuffix = cleaned.substring(lastIdx + delim.length)
        return { base: base || cleaned, suffix: rawSuffix || null }
    }

    private suffixToInternalRole(suffix: string | null): 'Learner' | 'Instructor' | 'OrgAdmin' {
        const s = (suffix || '').trim().toLowerCase()
        const sufLearner = CONFIG.OIDC_GROUP_SUFFIX_LEARNER.toLowerCase()
        const sufInstructor = CONFIG.OIDC_GROUP_SUFFIX_INSTRUCTOR.toLowerCase()
        const sufAdmin = CONFIG.OIDC_GROUP_SUFFIX_ADMIN.toLowerCase()
        if (s === sufInstructor) return (CONFIG.OIDC_ROLEMAP_INSTRUCTOR as 'Instructor')
        if (s === sufAdmin) return (CONFIG.OIDC_ROLEMAP_ADMIN as 'OrgAdmin')
        if (s === sufLearner) return (CONFIG.OIDC_ROLEMAP_LEARNER as 'Learner')
        // Default when unknown suffix: Learner
        return (CONFIG.OIDC_ROLEMAP_LEARNER as 'Learner')
    }

    private async ensureGroupWithRole(displayName: string, roleName: 'Learner' | 'Instructor' | 'OrgAdmin') {
        // Find role
        const role = await RoleDAO.findByRoleName(roleName)
        // Try to find group with displayName and attached target role
        const [groups, relations] = await Promise.all([
            GroupDAO.findByAttributes({ displayName }),
            relationBDTOInstance.findAll()
        ])
        for (const g of groups) {
            const rel = relations.find(r => r.fromType === 'group' && r.fromId === g._id && r.toType === 'role')
            if (rel && rel.toId === role._id) return g
        }
        // Create when missing
        const created = await GroupDAO.insert(new GroupModel({ displayName }), { role: role._id })
        return created
    }

    private async ensureHierarchy(groupsByRole: Partial<Record<'Learner'|'Instructor'|'OrgAdmin', GroupModel>>) {
        // Create hierarchy Admin -> Instructor (if exists) -> Learner
        const admin = groupsByRole['OrgAdmin']
        const instructor = groupsByRole['Instructor']
        const learner = groupsByRole['Learner']
        // Admin -> Instructor or Learner
        if (admin && instructor) {
            try { await relationBDTOInstance.addGroupToGroup(admin._id, instructor._id) } catch (_) { /* ignore if exists */ }
        } else if (admin && learner) {
            try { await relationBDTOInstance.addGroupToGroup(admin._id, learner._id) } catch (_) { /* ignore if exists */ }
        }
        // Instructor -> Learner
        if (instructor && learner) {
            try { await relationBDTOInstance.addGroupToGroup(instructor._id, learner._id) } catch (_) { /* ignore if exists */ }
        }
    }

    private async syncGroupsAndMembershipsFromClaims(userId: string, groupsRaw: string) {
        // Parse comma-separated groups; keep raw token entry for displayName, only normalize for parsing role/base
        const items = (groupsRaw || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)

        // Base -> map of role -> raw displayName (exactly as in token)
        const baseToRoleName = new Map<string, Map<'Learner'|'Instructor'|'OrgAdmin', string>>()
        for (const raw of items) {
            const { base, suffix } = this.parseGroupEntry(raw)
            if (!base) continue
            const internalRole = this.suffixToInternalRole(suffix)
            if (!baseToRoleName.has(base)) baseToRoleName.set(base, new Map())
            // Always use the raw token string as displayName, unchanged
            baseToRoleName.get(base)!.set(internalRole, raw)
        }

        // Ensure groups for each base/role with exact token displayName, build desiredGroupIds
        const desiredGroupIds: string[] = []
        for (const [base, roleNameMap] of baseToRoleName.entries()) {
            const groupsByRole: Partial<Record<'Learner'|'Instructor'|'OrgAdmin', GroupModel>> = {}
            const roles = roleNameMap.size > 0
                ? Array.from(roleNameMap.keys()) as Array<'Learner'|'Instructor'|'OrgAdmin'>
                : (['Learner'] as Array<'Learner'>)
            for (const r of roles) {
                const displayName = roleNameMap.get(r) || base // fallback to base if somehow missing
                const g = await this.ensureGroupWithRole(displayName, r)
                groupsByRole[r] = g
                desiredGroupIds.push(g._id)
            }
            // Build hierarchy based on role semantics for this base (Admin -> Instructor -> Learner)
            await this.ensureHierarchy(groupsByRole)
        }

        // Synchronize user membership: enroll new, unenroll removed
        const current = await relationBDTOInstance.getUsersGroups(userId)
        const currentIds = new Set(current.map(g => g._id))
        const desiredIds = new Set(desiredGroupIds)

        // Enroll in new groups
        for (const gid of desiredIds) {
            if (!currentIds.has(gid)) {
                try { await relationBDTOInstance.addUserToGroup(userId, gid) } catch (_) { /* ignore if already enrolled */ }
            }
        }

        // Unenroll from groups that are no longer present in token
        for (const gid of currentIds) {
            if (!desiredIds.has(gid)) {
                try { await relationBDTOInstance.removeUserFromGroup(userId, gid) } catch (_) { /* ignore if not enrolled */ }
            }
        }
    }

}

export default new OIDController()












