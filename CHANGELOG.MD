# Changelog

> Please document the releases (version numbers) in descending order

## Unreleased
### Security
* Users can no longer set protected fields (`isSuperAdmin`, `isVerified`, `identityId`, `_id`) on their own account. Previously `PATCH /users/:id` with `{"isSuperAdmin": true}` granted super-admin rights.
* Management routes for users (`GET/PATCH/PUT/DELETE /mgmt/users/:id`) and groups (`PATCH/PUT/DELETE /mgmt/groups/:id`) now check the caller's permission on the addressed resource, not only on any resource of that type. Previously every user could change other users' passwords or delete them.
* The default `Self` role is immutable; existing installations are migrated on startup.
* Access and refresh tokens carry a `typ` claim and are no longer interchangeable (tokens issued before this change stay valid until they expire).
* `GET /users/userInfo` no longer returns the password hash.
* Deactivated API tokens (`active: false`) are rejected.
* OIDC broker: authorize URLs are built with `URLSearchParams` (no parameter injection through `nonce`), PKCE is no longer advertised in the discovery document, SSO login fails closed when the IdP token has no subject.
* JWKS key cache is scoped per provider, so a key from one IdP cannot verify tokens claiming another issuer.
* Auth rate limiter normalizes paths (case, trailing slash) and evicts idle entries.
* SMTP certificates are verified by default (`SMTP_ALLOW_INSECURE_TLS=true` to opt out for local test servers).
* nodemailer 10.0.13, brace-expansion and fast-uri updates (`npm audit`: 0 vulnerabilities).
### Fixes
* Errors thrown in controller pre-hooks reach the error handler instead of leaving the request hanging (e.g. updating a super-admin without `oldPassword`).
* E-mail templates were resolved as `undefined/views` because of a circular import; registration mails failed and the request did not respond.
* `npm run dev` uses `tsx` (`ts-node` was no longer installed).
* Re-added `ejs`, which is required to render the SSO login and success pages.
* Docker image ships `pages/` and `views/` (SSO pages and e-mail templates) and defines a `HEALTHCHECK`.
* E-mail templates: imprint link is configurable via `IMPRINT_URL`.

## v1.2.30
### Fixes
* Refresh tokens: `REFRESH_TOKEN_SECRET` now falls back to `TOKEN_SECRET` when not set explicitly.
  Previously every replica generated its own random refresh secret, so refresh tokens issued by one
  replica were rejected by another (`/authentication/refresh` -> "Token not valid or expired").
* Malformed refresh tokens are rejected with `401` instead of crashing the request handler.
### Security
* Dependency updates (nodemailer 9.x, qs override 6.16.0, glob 13, brace-expansion, fast-uri, uuid replaced by `node:crypto`).
* Removed a dependency override that pinned `@apidevtools/json-schema-ref-parser` to a compromised version.
* Docker runtime image: `node:24-alpine3.24`, patched OpenSSL, npm removed from the runtime image, source files no longer shipped.

## v1.2.9
### Added
* OIDC groups claim can be parsed as comma-separated string or JSON array (`OIDC_GROUPS_FORMAT=comma|json_array`).
* OIDC group sync only removes memberships it created itself (`oidc-managed` relations); memberships created by admins or other integrations are kept.
* Pre-existing admin groups from the IdP claim are accepted even if `OIDC_ALLOW_ADMIN_GROUP_SYNC=false` (auto-creation of admin groups stays disabled).
* OIDC broker: `/.well-known/openid-configuration` discovery document, pass-through of the client's `state` and `nonce`.
* OIDC providers and clients are reloaded from the database on access, so changes apply without a restart.

## v1.2.8
### Added
* Lightweight logger (`src/lib/utils/logger.ts`) with level filtering (`LOG_LEVEL`) and message length limit (`LOG_MAX_MESSAGE_LENGTH`); replaces ad-hoc `console.*` calls.
* Basic request logging.

## v1.2.5
### Added
* Published as npm package `@clm-framework/clm-core`; `dist/` exports and type declarations.

## v1.2.0
### Changed
* Compiled output (`dist/`) is no longer committed; it is built on install (`prepare`) or via `npm run build`.
* Source files moved to `src/` (including `src/server.ts`).

## v1.1.32
### Fixes
* PostgreSQL pool: unlimited reconnect attempts with delay capped at 120 s, additional pool error handler to prevent crashes.

## v1.1.31
### Changed
* Replaced the `uuid` package with `node:crypto`.

## v1.1.20 – 2026-04-11
### Update
* Dependencies
* https://github.com/advisories/GHSA-3p68-rc4w-qgx5
* https://github.com/advisories/GHSA-fvcv-3m26-pcqx
* https://github.com/advisories/GHSA-r5fr-rjxr-66jc
* https://github.com/advisories/GHSA-f23m-r3pf-42rh
* https://github.com/advisories/GHSA-vvjj-xcjg-gr5g

## v1.1.19 – 2026-04-01
### Update
* Dependencies

## v1.1.18 – 2026-03-27
### Update
* Dependencies

## v1.1.17 – 2026-03-08
### Update
* Dependencies
    * `elliptic` as dependeny of `jwk-to-pem`
        * see https://github.com/advisories/GHSA-848j-6mx2-7j84

## v1.1.16 – 2026-02-08
### Added
- Functionality to add multiple admin users to the CLM