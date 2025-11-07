import axios from 'axios';
import jwkToPem from 'jwk-to-pem';
import { CONFIG } from '../config/config';

// Provider config shape (partial)
interface OIDCProviderConfig {
  authorization_endpoint: string;
  token_endpoint?: string;
  end_session_endpoint?: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  issuer?: string;
}

// Simple in-memory cache for JWKS (kid -> pem)
interface CachedKey {
  pem: string;
  expiresAt: number; // epoch ms
}

const KEY_TTL_MS = 6 * 60 * 60 * 1000; // 6h default cache
const JWKS_REFRESH_FAILED_TTL_MS = 5 * 60 * 1000; // 5m if refresh fails

const pemCache: Record<string, CachedKey> = {};

// Derive jwks_uri when not provided.
// Strategy: If provider.jwks_uri exists -> use it.
// Else attempt common patterns relative to the base issuer/realm root.
// We try in order and pick first successful (HTTP 200) response returning keys.
async function deriveJwksUri(provider: OIDCProviderConfig): Promise<string> {
  // Highest priority: explicit global override via environment
  if (process.env.GLOBAL_JWKS_URI) return process.env.GLOBAL_JWKS_URI;
  if (provider.jwks_uri) return provider.jwks_uri;

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
  } catch (_) { /* ignore */ }

  // Fallback generic patterns list
  const candidates: string[] = [];
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
  } catch (_) { /* ignore */ }

  // Last resort: attempt .well-known/jwks.json at root
  try {
    const root = new URL(provider.authorization_endpoint);
    root.pathname = '/.well-known/jwks.json';
    candidates.push(root.toString());
  } catch (_) { /* ignore */ }

  for (const c of candidates) {
    try {
      const resp = await axios.get(c, { timeout: 5000 });
      if (resp.data && Array.isArray(resp.data.keys)) {
        return c; // Accept first successful keys endpoint
      }
    } catch { /* try next */ }
  }
  throw { status: 500, message: 'Unable to derive jwks_uri for provider' };
}

async function fetchJwks(provider: OIDCProviderConfig) {
  const jwksUri = await deriveJwksUri(provider);
  const { data } = await axios.get(jwksUri, { timeout: 5000 });
  if (!data || !Array.isArray(data.keys)) {
    throw { status: 500, message: 'Invalid JWKS response' };
  }
  const now = Date.now();
  for (const jwk of data.keys) {
    if (!jwk.kid) continue;
    try {
      const pem = jwkToPem(jwk);
      pemCache[jwk.kid] = { pem, expiresAt: now + KEY_TTL_MS };
    } catch { /* skip invalid key */ }
  }
  return data.keys;
}

export async function getSigningKey(kid: string, provider: OIDCProviderConfig) {
  const cached = pemCache[kid];
  if (cached && cached.expiresAt > Date.now()) return cached.pem;
  try {
    await fetchJwks(provider);
  } catch (err) {
    // extend old key a bit if it exists
    if (cached) {
      cached.expiresAt = Date.now() + JWKS_REFRESH_FAILED_TTL_MS;
      return cached.pem;
    }
    throw err;
  }
  const updated = pemCache[kid];
  if (!updated) throw { status: 401, message: 'Unknown signing key id' };
  return updated.pem;
}

export async function verifyExternalToken(token: string) {
  const decodedHeader = decodeJwtHeader(token);
  if (!decodedHeader || !decodedHeader.kid) throw { status: 400, message: 'Missing kid in token header' };

  // Determine provider based on iss claim
  const payload = decodeJwtPayload(token);
  if (!payload.iss) throw { status: 400, message: 'Missing iss in token payload' };
  
  // Get enriched providers from DB (with jwks_uri from global env if missing)
  // This loads from OIDCProviderDAO with CONFIG fallback
  let providers = []
  try {
    const { getEnrichedProviders } = await import('../controllers/OIDCController')
    providers = getEnrichedProviders()
  } catch (err) {
    // Fallback to CONFIG if OIDCController import fails
    if (CONFIG.VERBOSE === 'true') console.error('Failed to load OIDC providers from OIDCController, using env fallback:', err)
    providers = CONFIG.OIDC_PROVIDERS || []
  }
  
  const provider = providers.find((p: any) =>
    (p.issuer && p.issuer === payload.iss) || (p.authorization_endpoint && p.authorization_endpoint.includes(payload.iss))
  );
  if (!provider) throw { status: 401, message: 'Issuer not trusted' };

  const pem = await getSigningKey(decodedHeader.kid, provider);
  // Allow configurable algorithms; default to common RSA algorithms
  const allowedAlgs = (process.env.OIDC_JWT_ALGS || 'RS256,RS384,RS512')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  return new Promise((resolve, reject) => {
    import('jsonwebtoken').then(jwt => {
      jwt.verify(token, pem, { algorithms: allowedAlgs as any }, (err: any, decoded: any) => {
        if (err) return reject({ status: 401, message: 'Token verification failed' });
        resolve(decoded);
      });
    });
  });
}

function decodeSection(token: string, index: number) {
  try {
    const part = token.split('.')[index];
    return JSON.parse(Buffer.from(part, 'base64').toString('utf8'));
  } catch { return undefined; }
}

function decodeJwtHeader(token: string): any | undefined { return decodeSection(token, 0); }
function decodeJwtPayload(token: string): any | undefined { return decodeSection(token, 1); }

// Expose a utility to clear cache (e.g., for tests)
export function _clearJwksCache() {
  Object.keys(pemCache).forEach(k => delete pemCache[k]);
}

// NOTE: This service is used to validate external OIDC tokens instead of calling userinfo_endpoint.
//       Fallback derivation logic attempts typical patterns for jwks_uri when not explicitly configured.
