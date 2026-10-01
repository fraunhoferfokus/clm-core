# Security Policy

## Reporting a vulnerability

Please do **not** open public GitHub issues for security problems.
Report them privately to **clm@fokus.fraunhofer.de** and include:

- affected version or commit
- a description of the issue and its impact
- steps to reproduce (requests, configuration)

We will acknowledge your report and keep you informed about the fix.

## Supported versions

Security fixes are applied to the latest version on `main`.

## Deployment recommendations

- Set `TOKEN_SECRET`, `CLM_API_KEY` and the root credentials explicitly. Use the same `TOKEN_SECRET` for all CLM services and replicas.
- Run behind a TLS-terminating reverse proxy or gateway.
- Keep `OIDC_REQUIRE_KID=true`, `ALLOW_TRUSTED_CLIENTS=false` and `OIDC_AUTO_CREATE_GROUPS=false` unless you need otherwise.
- Hand out API tokens with the narrowest set of paths and methods a client needs.
