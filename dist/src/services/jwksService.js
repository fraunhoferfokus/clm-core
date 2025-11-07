"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports._clearJwksCache = exports.verifyExternalToken = exports.getSigningKey = void 0;
const axios_1 = __importDefault(require("axios"));
const jwk_to_pem_1 = __importDefault(require("jwk-to-pem"));
const config_1 = require("../config/config");
const KEY_TTL_MS = 6 * 60 * 60 * 1000; // 6h default cache
const JWKS_REFRESH_FAILED_TTL_MS = 5 * 60 * 1000; // 5m if refresh fails
const pemCache = {};
// Derive jwks_uri when not provided.
// Strategy: If provider.jwks_uri exists -> use it.
// Else attempt common patterns relative to the base issuer/realm root.
// We try in order and pick first successful (HTTP 200) response returning keys.
function deriveJwksUri(provider) {
    return __awaiter(this, void 0, void 0, function* () {
        // Highest priority: explicit global override via environment
        if (process.env.GLOBAL_JWKS_URI)
            return process.env.GLOBAL_JWKS_URI;
        if (provider.jwks_uri)
            return provider.jwks_uri;
        // Attempt to guess issuer from authorization_endpoint by trimming standard path parts.
        // Common keycloak pattern: https://host/realms/<realm>/protocol/openid-connect/auth
        // JWKS usually:          https://host/realms/<realm>/protocol/openid-connect/certs
        try {
            const authUrl = new URL(provider.authorization_endpoint);
            const pathname = authUrl.pathname;
            // Replace trailing 'auth' with 'certs'
            if (pathname.endsWith('/auth')) {
                const guess = new URL(authUrl.toString());
                guess.pathname = pathname.replace(/\/auth$/, '/certs');
                return guess.toString();
            }
        }
        catch (_) { /* ignore */ }
        // Fallback generic patterns list
        const candidates = [];
        try {
            const base = new URL(provider.authorization_endpoint);
            // 1. Replace /authorize or /auth in last segment with /.well-known/jwks.json
            const last = base.pathname.split('/').filter(Boolean).pop() || '';
            if (/(authorize|auth)/.test(last)) {
                const wellKnown = new URL(base.toString());
                wellKnown.pathname = '/.well-known/jwks.json';
                candidates.push(wellKnown.toString());
            }
            // 2. Keycloak style (already attempted above but keep here):
            const kc = new URL(base.toString());
            kc.pathname = kc.pathname.replace(/\/auth$/, '/certs');
            candidates.push(kc.toString());
        }
        catch (_) { /* ignore */ }
        // Last resort: attempt .well-known/jwks.json at root
        try {
            const root = new URL(provider.authorization_endpoint);
            root.pathname = '/.well-known/jwks.json';
            candidates.push(root.toString());
        }
        catch (_) { /* ignore */ }
        for (const c of candidates) {
            try {
                const resp = yield axios_1.default.get(c, { timeout: 5000 });
                if (resp.data && Array.isArray(resp.data.keys)) {
                    return c; // Accept first successful keys endpoint
                }
            }
            catch ( /* try next */_a) { /* try next */ }
        }
        throw { status: 500, message: 'Unable to derive jwks_uri for provider' };
    });
}
function fetchJwks(provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const jwksUri = yield deriveJwksUri(provider);
        const { data } = yield axios_1.default.get(jwksUri, { timeout: 5000 });
        if (!data || !Array.isArray(data.keys)) {
            throw { status: 500, message: 'Invalid JWKS response' };
        }
        const now = Date.now();
        for (const jwk of data.keys) {
            if (!jwk.kid)
                continue;
            try {
                const pem = (0, jwk_to_pem_1.default)(jwk);
                pemCache[jwk.kid] = { pem, expiresAt: now + KEY_TTL_MS };
            }
            catch ( /* skip invalid key */_a) { /* skip invalid key */ }
        }
        return data.keys;
    });
}
function getSigningKey(kid, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const cached = pemCache[kid];
        if (cached && cached.expiresAt > Date.now())
            return cached.pem;
        try {
            yield fetchJwks(provider);
        }
        catch (err) {
            // extend old key a bit if it exists
            if (cached) {
                cached.expiresAt = Date.now() + JWKS_REFRESH_FAILED_TTL_MS;
                return cached.pem;
            }
            throw err;
        }
        const updated = pemCache[kid];
        if (!updated)
            throw { status: 401, message: 'Unknown signing key id' };
        return updated.pem;
    });
}
exports.getSigningKey = getSigningKey;
function verifyExternalToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const decodedHeader = decodeJwtHeader(token);
        if (!decodedHeader || !decodedHeader.kid)
            throw { status: 400, message: 'Missing kid in token header' };
        // Determine provider based on iss claim
        const payload = decodeJwtPayload(token);
        if (!payload.iss)
            throw { status: 400, message: 'Missing iss in token payload' };
        // Get enriched providers from DB (with jwks_uri from global env if missing)
        // This loads from OIDCProviderDAO with CONFIG fallback
        let providers = [];
        try {
            const { getEnrichedProviders } = yield Promise.resolve().then(() => __importStar(require('../controllers/OIDCController')));
            providers = getEnrichedProviders();
        }
        catch (err) {
            // Fallback to CONFIG if OIDCController import fails
            if (config_1.CONFIG.VERBOSE === 'true')
                console.error('Failed to load OIDC providers from OIDCController, using env fallback:', err);
            providers = config_1.CONFIG.OIDC_PROVIDERS || [];
        }
        const provider = providers.find((p) => (p.issuer && p.issuer === payload.iss) || (p.authorization_endpoint && p.authorization_endpoint.includes(payload.iss)));
        if (!provider)
            throw { status: 401, message: 'Issuer not trusted' };
        const pem = yield getSigningKey(decodedHeader.kid, provider);
        // Allow configurable algorithms; default to common RSA algorithms
        const allowedAlgs = (process.env.OIDC_JWT_ALGS || 'RS256,RS384,RS512')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => __importStar(require('jsonwebtoken'))).then(jwt => {
                jwt.verify(token, pem, { algorithms: allowedAlgs }, (err, decoded) => {
                    if (err)
                        return reject({ status: 401, message: 'Token verification failed' });
                    resolve(decoded);
                });
            });
        });
    });
}
exports.verifyExternalToken = verifyExternalToken;
function decodeSection(token, index) {
    try {
        const part = token.split('.')[index];
        return JSON.parse(Buffer.from(part, 'base64').toString('utf8'));
    }
    catch (_a) {
        return undefined;
    }
}
function decodeJwtHeader(token) { return decodeSection(token, 0); }
function decodeJwtPayload(token) { return decodeSection(token, 1); }
// Expose a utility to clear cache (e.g., for tests)
function _clearJwksCache() {
    Object.keys(pemCache).forEach(k => delete pemCache[k]);
}
exports._clearJwksCache = _clearJwksCache;
// NOTE: This service is used to validate external OIDC tokens instead of calling userinfo_endpoint.
//       Fallback derivation logic attempts typical patterns for jwks_uri when not explicitly configured.
