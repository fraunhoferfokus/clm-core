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
interface OIDCProviderLike {
    issuer?: string
    authorization_endpoint?: string
}

function normalizeIssuer(value?: string): string | undefined {
    if (!value || typeof value !== 'string') return undefined
    try {
        const parsed = new URL(value)
        const normalizedPath = parsed.pathname.replace(/\/+$/, '')
        return `${parsed.origin}${normalizedPath}`
    } catch (_) {
        return value.trim().replace(/\/+$/, '') || undefined
    }
}

function deriveIssuerFromAuthorizationEndpoint(authorizationEndpoint?: string): string | undefined {
    const normalizedEndpoint = normalizeIssuer(authorizationEndpoint)
    if (!normalizedEndpoint) return undefined

    // Remove common authorization endpoint suffixes so issuer comparison stays exact.
    return normalizedEndpoint.replace(/\/(protocol\/openid-connect\/auth|oauth2\/authorize|authorize|auth)$/i, '')
}

export function providerMatchesIssuer(provider: OIDCProviderLike, issuer?: string): boolean {
    const normalizedIssuer = normalizeIssuer(issuer)
    if (!normalizedIssuer) return false

    const trustedIssuers = [
        normalizeIssuer(provider.issuer),
        normalizeIssuer(provider.authorization_endpoint),
        deriveIssuerFromAuthorizationEndpoint(provider.authorization_endpoint)
    ].filter((value): value is string => Boolean(value))

    return trustedIssuers.includes(normalizedIssuer)
}

export function findTrustedProviderByIssuer<T extends OIDCProviderLike>(providers: T[], issuer?: string): T | undefined {
    return providers.find((provider) => providerMatchesIssuer(provider, issuer))
}