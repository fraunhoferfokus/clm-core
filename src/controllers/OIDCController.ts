import express from 'express'
import { CONFIG } from '../config/config';
import axios from 'axios';
import jwt from 'jsonwebtoken'
import UserDAO from '../models/User/UserDAO';
import { UserModel, jwtServiceInstance } from '../lib/CoreLib';
import { randomUUID } from 'crypto';
// get executing diretory of node-process

const OIDC_PROVIDER = CONFIG.OIDC_PROVIDERS
const OIDC_CLIENTS: any[] = CONFIG.ODIC_CLIENTS
const firstProvider = OIDC_PROVIDER[0]

let authorization_endpoint: string, token_endpoint: string, client_id: string, client_secret: string,
    end_session_endpoint: string, userinfo_endpoint: string
    ;
if (firstProvider) {
    [authorization_endpoint, token_endpoint, client_id, client_secret, end_session_endpoint, userinfo_endpoint] = [firstProvider.authorization_endpoint, firstProvider.token_endpoint, firstProvider.client_id, firstProvider.client_secret, firstProvider.end_session_endpoint, firstProvider.userinfo_endpoint]
}

let oidc_state: {
    [key: string]: any
} = {

}



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
    }

    brokerLogout: express.Handler = async (req, res, next) => {
        try {
            const { post_logout_redirect_uri: oidc_client_post_logout_redirect_uri, client_id: odic_client_client_id } = req.query

            if (!oidc_client_post_logout_redirect_uri || !odic_client_client_id) return next({ status: 400, message: 'post_logout_redirect_uri, client_id required' })

            const oidc_client = OIDC_CLIENTS.find((oidc_client) => oidc_client.client_id === odic_client_client_id)

            if (!oidc_client.valid_redirect_uris.includes(oidc_client_post_logout_redirect_uri)) return next({ status: 400, message: 'Invalid post_logout_redirect_uri' })
            let broker_post_logout_uri = CONFIG.DEPLOY_URL + '/core/sso/oidc/broker/logout/redirect'

            const url = new URL(end_session_endpoint)
            url.searchParams.set('state', randomUUID())
            url.searchParams.append('response_type', 'code')
            url.searchParams.append('scope', 'openid')
            url.searchParams.append('client_id', client_id)
            url.searchParams.append('post_logout_redirect_uri', broker_post_logout_uri)
            oidc_state[url.searchParams.get('state') as string] = {
                post_logout_redirect_uri: oidc_client_post_logout_redirect_uri as string,
            }

            return res.redirect(url.toString())
        } catch (err) {
            return next(err)
        }
    }

    brokerLogoutRedirect: express.Handler = async (req, res, next) => {
        try {
            const { state } = req.query
            const oidc_client = oidc_state[state as string]
            if (!oidc_client) return next({ status: 400, message: 'Invalid state' })
            const { post_logout_redirect_uri } = oidc_client
            return res.redirect(post_logout_redirect_uri)
        } catch (err) {
            return next(err)
        }
    }


    ssoLanding: express.Handler = (req, res, next) => {
        try {
            const { client_id: oidc_client_id, scope: oidc_client_scope, redirect_uri: oidc_redirect_uri } = req.query

            if (oidc_client_id || oidc_client_scope || oidc_redirect_uri) {
                if (!oidc_client_id || !oidc_client_scope || !oidc_redirect_uri) return res.status(400).json({
                    message: 'client_id, scope, redirect_uri required'
                })

                let oidc_client = OIDC_CLIENTS.find((oidc_client) => oidc_client.client_id === oidc_client_id)
                if (oidc_client) {
                    let valid_redirect_uri = oidc_client.valid_redirect_uris.find((valid_redirect_uri: any) => valid_redirect_uri === oidc_redirect_uri)
                    let state = randomUUID()
                    oidc_state[state] = { redirect_uri: oidc_redirect_uri }
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

            if (firstProvider) {
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
                const oidc_client = oidc_state[state as string]
                if (!oidc_client) return res.status(400).json({
                    message: 'Invalid state'
                })
                const { redirect_uri } = oidc_client
                delete oidc_state[state as string]
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
            const { access_token, refresh_token, expires_in, refresh_expires_in,
            } = keycloak_response.data
            // get sub from access token

            const decoded = jwt.decode(access_token)

            let user: UserModel;
            user = (await UserDAO.findByAttributes({
                identityId: decoded?.sub as string
            }))[0]
            if (!user) user = await UserDAO.insert(new UserModel({
                isVerified: true,
                password: randomUUID(),
                familyName: decoded?.sub as string,
                givenName: decoded?.sub as string,
                email: decoded?.sub as string,
                identityId: decoded?.sub as string,
            }))

            return {
                user,
                access_token,
                refresh_token,
                expires_in,
                refresh_expires_in
            }

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

            let oidc_client = OIDC_CLIENTS.find((oidc_client) => oidc_client.client_id === client_id)
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
                    Authorization: `Bearer MGMT_SERVICE`,
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


}

export default new OIDController()












