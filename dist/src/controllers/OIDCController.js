"use strict";
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
exports.getEnrichedProviders = exports.reloadProviders = void 0;
const express_1 = __importDefault(require("express"));
const config_1 = require("../config/config");
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserDAO_1 = __importDefault(require("../models/User/UserDAO"));
const CoreLib_1 = require("../lib/CoreLib");
const crypto_1 = require("crypto");
const OIDCStateDAO_1 = __importDefault(require("../models/OIDCState/OIDCStateDAO"));
const OIDCStateModel_1 = __importDefault(require("../models/OIDCState/OIDCStateModel"));
const GroupDAO_1 = __importDefault(require("../models/Group/GroupDAO"));
const GroupModel_1 = __importDefault(require("../models/Group/GroupModel"));
const RoleDAO_1 = __importDefault(require("../models/Role/RoleDAO"));
const RelationBDTO_1 = __importDefault(require("../models/Relation/RelationBDTO"));
const OIDCClientDAO_1 = __importDefault(require("../models/OIDCClient/OIDCClientDAO"));
const OIDCProviderDAO_1 = __importDefault(require("../models/OIDCProvider/OIDCProviderDAO"));
// get executing diretory of node-process
const OIDC_PROVIDER = config_1.CONFIG.OIDC_PROVIDERS;
const firstProvider = OIDC_PROVIDER[0];
// Enrich OIDC providers with global jwks_uri if missing
let enrichedProviders = [];
function enrichProviders() {
    return __awaiter(this, void 0, void 0, function* () {
        // Try to load from DB first
        let providersToEnrich = [];
        try {
            const dbProviders = yield OIDCProviderDAO_1.default.findAllActive();
            if (dbProviders && dbProviders.length > 0) {
                providersToEnrich = dbProviders;
            }
            else {
                // Fallback to env config
                providersToEnrich = OIDC_PROVIDER || [];
            }
        }
        catch (err) {
            // On DB error, fallback to env config
            providersToEnrich = OIDC_PROVIDER || [];
            if (config_1.CONFIG.VERBOSE === 'true')
                console.error('Failed to load OIDC providers from DB, using env fallback:', err);
        }
        enrichedProviders = providersToEnrich.map((provider) => {
            const enriched = Object.assign({}, provider);
            // If provider doesn't have jwks_uri, try to use global env variable
            if (!enriched.jwks_uri && process.env.GLOBAL_JWKS_URI) {
                enriched.jwks_uri = process.env.GLOBAL_JWKS_URI;
            }
            return enriched;
        });
    });
}
// Initialize enriched providers
enrichProviders();
// Reload providers (called after DB changes)
function reloadProviders() {
    return __awaiter(this, void 0, void 0, function* () {
        yield enrichProviders();
    });
}
exports.reloadProviders = reloadProviders;
// Export enriched providers for use in other modules (like jwksService)
function getEnrichedProviders() {
    return enrichedProviders.length > 0 ? enrichedProviders : OIDC_PROVIDER;
}
exports.getEnrichedProviders = getEnrichedProviders;
// Get first enriched provider
const firstEnrichedProvider = getEnrichedProviders()[0];
// Dynamic OIDC clients loader: DB first, then env fallback
let OIDC_CLIENTS = [];
function loadOIDCClients() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const dbClients = yield OIDCClientDAO_1.default.findAllActive();
            if (dbClients && dbClients.length > 0) {
                // Use DB clients without modification
                OIDC_CLIENTS = dbClients;
            }
            else {
                // Fallback to env config (legacy support)
                OIDC_CLIENTS = config_1.CONFIG.ODIC_CLIENTS || [];
            }
        }
        catch (err) {
            // On DB error, fallback to env config
            OIDC_CLIENTS = config_1.CONFIG.ODIC_CLIENTS || [];
            if (config_1.CONFIG.VERBOSE === 'true')
                console.error('Failed to load OIDC clients from DB, using env fallback:', err);
        }
    });
}
// Utility to get current OIDC clients (refresh from DB if needed)
function getOIDCClients() {
    return __awaiter(this, void 0, void 0, function* () {
        if (OIDC_CLIENTS.length === 0) {
            yield loadOIDCClients();
        }
        return OIDC_CLIENTS;
    });
}
let authorization_endpoint, token_endpoint, client_id, client_secret, end_session_endpoint, userinfo_endpoint;
if (firstEnrichedProvider) {
    [authorization_endpoint, token_endpoint, client_id, client_secret, end_session_endpoint, userinfo_endpoint] = [firstEnrichedProvider.authorization_endpoint, firstEnrichedProvider.token_endpoint, firstEnrichedProvider.client_id, firstEnrichedProvider.client_secret, firstEnrichedProvider.end_session_endpoint, firstEnrichedProvider.userinfo_endpoint];
}
// In-memory oidc_state removed. Using persistent table 'oidc_states' for multi-pod compatibility.
class OIDController {
    constructor() {
        this.brokerLogout = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { post_logout_redirect_uri: oidc_client_post_logout_redirect_uri, client_id: odic_client_client_id } = req.query;
                if (!oidc_client_post_logout_redirect_uri || !odic_client_client_id)
                    return next({ status: 400, message: 'post_logout_redirect_uri, client_id required' });
                const clients = yield getOIDCClients();
                const oidc_client = clients.find((oidc_client) => oidc_client.client_id === odic_client_client_id);
                if (!oidc_client || !oidc_client.valid_redirect_uris.includes(oidc_client_post_logout_redirect_uri))
                    return next({ status: 400, message: 'Invalid post_logout_redirect_uri' });
                let broker_post_logout_uri = config_1.CONFIG.DEPLOY_URL + '/core/sso/oidc/broker/logout/redirect';
                const url = new URL(end_session_endpoint);
                const state = (0, crypto_1.randomUUID)();
                url.searchParams.set('state', state);
                url.searchParams.append('response_type', 'code');
                url.searchParams.append('scope', 'openid');
                url.searchParams.append('client_id', client_id);
                url.searchParams.append('post_logout_redirect_uri', broker_post_logout_uri);
                yield OIDCStateDAO_1.default.insert(new OIDCStateModel_1.default({ state, postLogoutRedirectUri: oidc_client_post_logout_redirect_uri }));
                return res.redirect(url.toString());
            }
            catch (err) {
                return next(err);
            }
        });
        this.brokerLogoutRedirect = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { state } = req.query;
                const oidcClientState = yield OIDCStateDAO_1.default.consume(state);
                if (!oidcClientState || !oidcClientState.postLogoutRedirectUri)
                    return next({ status: 400, message: 'Invalid state' });
                const { postLogoutRedirectUri: post_logout_redirect_uri } = oidcClientState;
                return res.redirect(post_logout_redirect_uri);
            }
            catch (err) {
                return next(err);
            }
        });
        this.ssoLanding = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { client_id: oidc_client_id, scope: oidc_client_scope, redirect_uri: oidc_redirect_uri } = req.query;
                if (oidc_client_id || oidc_client_scope || oidc_redirect_uri) {
                    if (!oidc_client_id || !oidc_client_scope || !oidc_redirect_uri)
                        return res.status(400).json({
                            message: 'client_id, scope, redirect_uri required'
                        });
                    const clients = yield getOIDCClients();
                    let oidc_client = clients.find((oidc_client) => oidc_client.client_id === oidc_client_id);
                    if (oidc_client) {
                        let valid_redirect_uri = oidc_client.valid_redirect_uris.find((valid_redirect_uri) => valid_redirect_uri === oidc_redirect_uri);
                        let state = (0, crypto_1.randomUUID)();
                        try {
                            yield OIDCStateDAO_1.default.insert(new OIDCStateModel_1.default({ state, redirectUri: oidc_redirect_uri }));
                        }
                        catch (e) {
                            return next(e);
                        }
                        if (valid_redirect_uri) {
                            const oidc_url = `${authorization_endpoint}?response_type=code&client_id=${client_id}&scope=openid&redirect_uri=${config_1.CONFIG.DEPLOY_URL}/core/sso/oidc/backend/login&state=${state}`;
                            return res.redirect(oidc_url);
                        }
                        return res.status(500).json({
                            message: 'Invalid redirect_uri'
                        });
                    }
                    else {
                        return res.status(500).json({
                            message: 'Invalid client_id'
                        });
                    }
                }
                const oidc_url = `${authorization_endpoint}?response_type=code&client_id=${client_id}&scope=openid&redirect_uri=${config_1.CONFIG.DEPLOY_URL}/core/sso/oidc/backend/login`;
                if (firstEnrichedProvider) {
                    return res.render('login', {
                        oidc_url
                    });
                }
                return res.status(500).json({
                    message: 'No OIDC Provider configured'
                });
            }
            catch (err) {
                return res.status(err.status || 500).json({
                    message: err.message || err
                });
            }
        });
        this.ssoBackendLogin = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { state } = req.query;
                const { code } = req.query;
                if (state) {
                    const stored = yield OIDCStateDAO_1.default.consume(state);
                    if (!stored || !stored.redirectUri)
                        return res.status(400).json({
                            message: 'Invalid state'
                        });
                    const { redirectUri: redirect_uri } = stored;
                    return res.redirect(`${redirect_uri}?code=${code}`);
                }
                // let full_logout_endpoint = `${lougout_endpoint}?response_type=code&scope=openid&client_id=${process.env.KEYCLOAK_CLIENT_ID}&id_token_hint=${id_token_hint}&post_logout_redirect_uri=${post_logout_redirect_uri}`
                let { access_token: idp_access_token, refresh_token: idp_refresh_token, expires_in: idp_access_token_expires_in, refresh_expires_in: idp_refresh_token_expires_in, user } = yield this.codeAuthFlow(code);
                const [accessToken, refreshToken] = yield CoreLib_1.jwtServiceInstance.createAccessAndRefreshToken(user);
                let decodedA = jsonwebtoken_1.default.decode(accessToken);
                let decodedR = jsonwebtoken_1.default.decode(refreshToken);
                let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
                let refreshTokenExpiresIn = new Date(1000 * decodedR.exp).toJSON();
                return res.redirect(`${config_1.CONFIG.DEPLOY_URL}/core/sso/oidc/success?id=${user._id}&access_token_expires_in=${accessTokenExpiresIn}&refresh_token_expires_in=${refreshTokenExpiresIn}&idp_access_token=${idp_access_token}&idp_refresh_token=${idp_refresh_token}&idp_access_token_expires_in=${idp_access_token_expires_in}&idp_refresh_token_expires_in=${idp_refresh_token_expires_in}
                `);
            }
            catch (err) {
                return res.status(err.status || 500).json({
                    message: err.message || err
                });
            }
        });
        this.codeAuthFlow = (code) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                const keycloak_response = yield (0, axios_1.default)(token_endpoint, {
                    method: 'POST',
                    data: {
                        grant_type: 'authorization_code',
                        client_id,
                        client_secret,
                        code,
                        redirect_uri: `${config_1.CONFIG.DEPLOY_URL}/core/sso/oidc/backend/login`
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                const { access_token, refresh_token, expires_in, refresh_expires_in, id_token } = keycloak_response.data;
                // Prefer ID Token claims; fall back to Access Token if ID Token not returned
                const decodedId = id_token ? jsonwebtoken_1.default.decode(id_token) : undefined;
                const decodedAcc = jsonwebtoken_1.default.decode(access_token);
                const claims = decodedId || decodedAcc || {};
                // Resolve claim keys from CONFIG with sensible defaults
                const claimKey = {
                    sub: config_1.CONFIG.OIDC_CLAIM_SUB,
                    email: config_1.CONFIG.OIDC_CLAIM_EMAIL,
                    givenName: config_1.CONFIG.OIDC_CLAIM_GIVEN_NAME,
                    familyName: config_1.CONFIG.OIDC_CLAIM_FAMILY_NAME,
                    title: config_1.CONFIG.OIDC_CLAIM_TITLE,
                    personnelNr: config_1.CONFIG.OIDC_CLAIM_PERSONNEL_NR,
                    trainingId: config_1.CONFIG.OIDC_CLAIM_TRAINING_ID,
                    groups: config_1.CONFIG.OIDC_CLAIM_GROUPS,
                };
                // Extract fields for user creation/update
                // Identity selection: prefer trainingId claim, otherwise fall back to subject (sub)
                const subject = ((_a = claims === null || claims === void 0 ? void 0 : claims[claimKey.sub]) !== null && _a !== void 0 ? _a : decodedAcc === null || decodedAcc === void 0 ? void 0 : decodedAcc.sub);
                const identityId = ((_b = claims === null || claims === void 0 ? void 0 : claims[claimKey.trainingId]) !== null && _b !== void 0 ? _b : subject);
                const tokenEmail = ((_c = claims === null || claims === void 0 ? void 0 : claims[claimKey.email]) !== null && _c !== void 0 ? _c : '');
                const tokenGiven = ((_d = claims === null || claims === void 0 ? void 0 : claims[claimKey.givenName]) !== null && _d !== void 0 ? _d : '');
                const tokenFamily = ((_e = claims === null || claims === void 0 ? void 0 : claims[claimKey.familyName]) !== null && _e !== void 0 ? _e : '');
                const tokenGroupsRaw = ((_f = claims === null || claims === void 0 ? void 0 : claims[claimKey.groups]) !== null && _f !== void 0 ? _f : '');
                // Verbesserte User-Ermittlung:
                // 1. Versuche anhand identityId zu finden
                // 2. Falls nicht gefunden: versuche anhand email/_id (wir nehmen subject als Email/_id Surrogat) zu finden
                // 3. Falls gefunden aber identityId fehlt -> update setzen
                // 4. Falls gar nicht vorhanden -> neu anlegen
                // 5. Race-Condition (Unique 23505) beim Insert abfangen und danach erneut laden
                // Try to find user by identityId (preferred)
                let user = (yield UserDAO_1.default.findByAttributes({ identityId }))[0];
                if (!user) {
                    // Versuch über email/_id zu finden (abhängig vom Datenmodell: _id vermutlich = email)
                    // 1) Try with email from token if present
                    let existingById = tokenEmail ? yield UserDAO_1.default.findById(tokenEmail).catch(() => undefined) : undefined;
                    // 2) Backward-compatibility: try sub as id
                    if (!existingById)
                        existingById = yield UserDAO_1.default.findById(subject).catch(() => undefined);
                    if (!existingById) {
                        // Fallback: Suche über email-Attribut, falls Modell das unterstützt
                        const byEmail = tokenEmail
                            ? (yield UserDAO_1.default.findByAttributes({ email: tokenEmail }))[0]
                            : (yield UserDAO_1.default.findByAttributes({ email: subject }))[0];
                        if (byEmail)
                            existingById = byEmail;
                    }
                    if (existingById) {
                        // Update identityId falls noch nicht gesetzt
                        if (!existingById.identityId) {
                            try {
                                existingById.identityId = identityId;
                                user = yield UserDAO_1.default.updateById(existingById._id, existingById);
                            }
                            catch (e) {
                                // Falls Update fehlschlägt, erneut lesen
                                user = yield UserDAO_1.default.findById(existingById._id);
                            }
                        }
                        else {
                            user = existingById;
                        }
                    }
                }
                if (!user) {
                    // Create new user using available claims (email/given/family). Fallbacks to subject when missing.
                    const newUser = new CoreLib_1.UserModel({
                        _id: identityId,
                        isVerified: true,
                        password: (0, crypto_1.randomUUID)(),
                        familyName: tokenFamily || subject,
                        givenName: tokenGiven || subject,
                        email: tokenEmail || subject,
                        identityId: identityId,
                    });
                    try {
                        user = yield UserDAO_1.default.insert(newUser);
                    }
                    catch (e) {
                        // Unique Constraint (z.B. 23505) -> parallele Anlage -> User erneut laden
                        const pgCode = (e === null || e === void 0 ? void 0 : e.code) || ((_g = e === null || e === void 0 ? void 0 : e.original) === null || _g === void 0 ? void 0 : _g.code);
                        if (pgCode === '23505') {
                            // Jetzt nochmals über identityId oder Id holen
                            user = (yield UserDAO_1.default.findByAttributes({ identityId }))[0];
                            if (!user) {
                                // Try by email token first, then by subject (backward-compat)
                                user = tokenEmail ? yield UserDAO_1.default.findById(tokenEmail).catch(() => __awaiter(this, void 0, void 0, function* () {
                                    return (yield UserDAO_1.default.findByAttributes({ email: tokenEmail }))[0];
                                })) : undefined;
                                if (!user) {
                                    user = (yield UserDAO_1.default.findById(subject).catch(() => __awaiter(this, void 0, void 0, function* () {
                                        return (yield UserDAO_1.default.findByAttributes({ email: subject }))[0];
                                    })));
                                }
                            }
                        }
                        else {
                            throw e;
                        }
                    }
                }
                if (!user) {
                    throw { status: 500, message: 'User konnte nach OIDC Auth nicht bestimmt werden.' };
                }
                // Update existing user profile fields if missing; avoid changing primary key/email when already set
                try {
                    const patch = {};
                    if (!user.identityId && identityId)
                        patch.identityId = identityId;
                    if (!user.givenName && tokenGiven)
                        patch.givenName = tokenGiven;
                    if (!user.familyName && tokenFamily)
                        patch.familyName = tokenFamily;
                    // Only set email if equal to current id (newly created with subject) or empty
                    if ((user.email === user._id && user.email === subject) && tokenEmail) {
                        // WARNING: Changing email changes the logical identifier in this system. We only patch email
                        // when user was created with subject as email in this flow.
                        patch.email = tokenEmail;
                    }
                    if (Object.keys(patch).length > 0) {
                        user = yield UserDAO_1.default.updateById(user._id, Object.assign(user, patch));
                    }
                }
                catch (e) {
                    // Non-fatal: continue SSO even if profile update fails
                }
                // Synchronize groups/roles from token claim (BwSSOGroupVLBw or configured key)
                try {
                    yield this.syncGroupsAndMembershipsFromClaims(user._id, tokenGroupsRaw);
                }
                catch (e) {
                    // Non-fatal during login; log on server if VERBOSE
                    if (config_1.CONFIG.VERBOSE === 'true')
                        console.error('Group sync error:', e);
                }
                return { user, access_token, refresh_token, expires_in, refresh_expires_in };
            }
            catch (err) {
                throw err;
            }
        });
        this.getAccessTokenByCode = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _h;
            try {
                const { code, client_id, client_secret, redirect_uri } = req.body;
                if (!client_id || !client_secret || !redirect_uri)
                    return res.status(400).json({
                        message: 'client_id, client_secret, redirect_uri required'
                    });
                const clients = yield getOIDCClients();
                let oidc_client = clients.find((oidc_client) => oidc_client.client_id === client_id);
                if (!oidc_client)
                    return res.status(400).json({
                        message: 'Invalid client_id'
                    });
                if (!oidc_client.valid_redirect_uris.includes(redirect_uri))
                    return res.status(400).json({
                        message: 'Invalid redirect_uri'
                    });
                if (oidc_client.client_secret !== client_secret)
                    return res.status(400).json({
                        message: 'Invalid client_secret'
                    });
                const { access_token, refresh_token, expires_in, refresh_expires_in } = yield this.codeAuthFlow(code);
                return res.json({
                    access_token,
                    refresh_token,
                    expires_in,
                    refresh_expires_in
                });
            }
            catch (err) {
                console.error((_h = err === null || err === void 0 ? void 0 : err.response) === null || _h === void 0 ? void 0 : _h.data);
                return next(err);
            }
        });
        this.ssoSuccess = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, idp_access_token, idp_refresh_token, idp_access_token_expires_in, idp_refresh_token_expires_in } = req.query;
                const user = yield UserDAO_1.default.findById(id);
                // return res.json({
                //     access_token,
                //     user,
                //     idp_access_token,
                //     idp_refresh_token
                // })
                let gateway_url = config_1.CONFIG.DEPLOY_URL.includes('localhost') ? 'http://gateway/api' : config_1.CONFIG.DEPLOY_URL;
                const course_structure_url = `${gateway_url}/learningObjects/users/${user._id}/courses`;
                const course_structure = (yield axios_1.default.get(course_structure_url, {
                    headers: {
                        Authorization: `Bearer ${config_1.CONFIG.CLM_API_KEY}`,
                        'x-access-token': idp_access_token
                    }
                })).data;
                return res.render('success', {
                    access_token: idp_access_token,
                    access_token_expires_in: idp_access_token_expires_in,
                    refresh_token: idp_refresh_token,
                    refresh_token_expires_in: idp_refresh_token_expires_in,
                    course_structure,
                    user,
                    end_session_endpoint: end_session_endpoint + '?post_logout_redirect_uri=' + config_1.CONFIG.DEPLOY_URL + '/core/sso/oidc' + '&client_id=' + client_id
                });
            }
            catch (err) {
                return res.status(err.status || 500).json({
                    message: err.message || err
                });
            }
        });
        this.router = express_1.default.Router();
        this.init();
    }
    init() {
        this.router.use((express_1.default.urlencoded({ extended: true })));
        this.router.get('/', this.ssoLanding);
        this.router.get('/backend/login', this.ssoBackendLogin);
        this.router.get('/success', this.ssoSuccess);
        this.router.post('/access_token_by_code', this.getAccessTokenByCode);
        this.router.get('/broker/logout', this.brokerLogout);
        this.router.get('/broker/logout/redirect', this.brokerLogoutRedirect);
        // Initialize OIDC clients on startup
        loadOIDCClients().catch(err => {
            if (config_1.CONFIG.VERBOSE === 'true')
                console.error('Error loading OIDC clients on init:', err);
        });
    }
    // --------------- Helper methods for OIDC group/role processing ---------------
    normalizeGroupToken(raw) {
        // Remove extra spaces around delimiters and trim
        return (raw || '').replace(/\s*_\s*/g, config_1.CONFIG.OIDC_GROUP_ROLE_DELIMITER).replace(/\s+/g, ' ').trim();
    }
    parseGroupEntry(entry) {
        const cleaned = this.normalizeGroupToken(entry);
        if (!cleaned)
            return { base: '', suffix: null };
        const delim = config_1.CONFIG.OIDC_GROUP_ROLE_DELIMITER;
        const lastIdx = cleaned.lastIndexOf(delim);
        if (lastIdx < 0) {
            return { base: cleaned, suffix: null };
        }
        const base = cleaned.substring(0, lastIdx);
        const rawSuffix = cleaned.substring(lastIdx + delim.length);
        return { base: base || cleaned, suffix: rawSuffix || null };
    }
    suffixToInternalRole(suffix) {
        const s = (suffix || '').trim().toLowerCase();
        const sufLearner = config_1.CONFIG.OIDC_GROUP_SUFFIX_LEARNER.toLowerCase();
        const sufInstructor = config_1.CONFIG.OIDC_GROUP_SUFFIX_INSTRUCTOR.toLowerCase();
        const sufAdmin = config_1.CONFIG.OIDC_GROUP_SUFFIX_ADMIN.toLowerCase();
        if (s === sufInstructor)
            return config_1.CONFIG.OIDC_ROLEMAP_INSTRUCTOR;
        if (s === sufAdmin)
            return config_1.CONFIG.OIDC_ROLEMAP_ADMIN;
        if (s === sufLearner)
            return config_1.CONFIG.OIDC_ROLEMAP_LEARNER;
        // Default when unknown suffix: Learner
        return config_1.CONFIG.OIDC_ROLEMAP_LEARNER;
    }
    ensureGroupWithRole(displayName, roleName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find role
            const role = yield RoleDAO_1.default.findByRoleName(roleName);
            // Try to find group with displayName and attached target role
            const [groups, relations] = yield Promise.all([
                GroupDAO_1.default.findByAttributes({ displayName }),
                RelationBDTO_1.default.findAll()
            ]);
            for (const g of groups) {
                const rel = relations.find(r => r.fromType === 'group' && r.fromId === g._id && r.toType === 'role');
                if (rel && rel.toId === role._id)
                    return g;
            }
            // Create when missing
            const created = yield GroupDAO_1.default.insert(new GroupModel_1.default({ displayName }), { role: role._id });
            return created;
        });
    }
    ensureHierarchy(groupsByRole) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create hierarchy Admin -> Instructor (if exists) -> Learner
            const admin = groupsByRole['OrgAdmin'];
            const instructor = groupsByRole['Instructor'];
            const learner = groupsByRole['Learner'];
            // Admin -> Instructor or Learner
            if (admin && instructor) {
                try {
                    yield RelationBDTO_1.default.addGroupToGroup(admin._id, instructor._id);
                }
                catch (_) { /* ignore if exists */ }
            }
            else if (admin && learner) {
                try {
                    yield RelationBDTO_1.default.addGroupToGroup(admin._id, learner._id);
                }
                catch (_) { /* ignore if exists */ }
            }
            // Instructor -> Learner
            if (instructor && learner) {
                try {
                    yield RelationBDTO_1.default.addGroupToGroup(instructor._id, learner._id);
                }
                catch (_) { /* ignore if exists */ }
            }
        });
    }
    syncGroupsAndMembershipsFromClaims(userId, groupsRaw) {
        return __awaiter(this, void 0, void 0, function* () {
            // Parse comma-separated groups; keep raw token entry for displayName, only normalize for parsing role/base
            const items = (groupsRaw || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            // Base -> map of role -> raw displayName (exactly as in token)
            const baseToRoleName = new Map();
            for (const raw of items) {
                const { base, suffix } = this.parseGroupEntry(raw);
                if (!base)
                    continue;
                const internalRole = this.suffixToInternalRole(suffix);
                if (!baseToRoleName.has(base))
                    baseToRoleName.set(base, new Map());
                // Always use the raw token string as displayName, unchanged
                baseToRoleName.get(base).set(internalRole, raw);
            }
            // Ensure groups for each base/role with exact token displayName, build desiredGroupIds
            const desiredGroupIds = [];
            for (const [base, roleNameMap] of baseToRoleName.entries()) {
                const groupsByRole = {};
                const roles = roleNameMap.size > 0
                    ? Array.from(roleNameMap.keys())
                    : ['Learner'];
                for (const r of roles) {
                    const displayName = roleNameMap.get(r) || base; // fallback to base if somehow missing
                    const g = yield this.ensureGroupWithRole(displayName, r);
                    groupsByRole[r] = g;
                    desiredGroupIds.push(g._id);
                }
                // Build hierarchy based on role semantics for this base (Admin -> Instructor -> Learner)
                yield this.ensureHierarchy(groupsByRole);
            }
            // Synchronize user membership: enroll new, unenroll removed
            const current = yield RelationBDTO_1.default.getUsersGroups(userId);
            const currentIds = new Set(current.map(g => g._id));
            const desiredIds = new Set(desiredGroupIds);
            // Enroll in new groups
            for (const gid of desiredIds) {
                if (!currentIds.has(gid)) {
                    try {
                        yield RelationBDTO_1.default.addUserToGroup(userId, gid);
                    }
                    catch (_) { /* ignore if already enrolled */ }
                }
            }
            // Unenroll from groups that are no longer present in token
            for (const gid of currentIds) {
                if (!desiredIds.has(gid)) {
                    try {
                        yield RelationBDTO_1.default.removeUserFromGroup(userId, gid);
                    }
                    catch (_) { /* ignore if not enrolled */ }
                }
            }
        });
    }
}
exports.default = new OIDController();
