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

import express from 'express'
import passport from '../passport/passport'
import { jwtServiceInstance } from '../services/jwtService'
import jwt from 'jsonwebtoken'
import UserDAO from '../models/User/UserDAO';
import SwaggerDefinition from '../services/SwaggerDefinition';
import { CONFIG } from '../config/config';
import axios from 'axios';
const OIDC_PROVIDERS = CONFIG.OIDC_PROVIDERS


const basePath = CONFIG.BASE_PATH || '/core'
const baseLocation = `${basePath}/authentication`



class AuthController {

    router: express.Router;

    constructor() {
        this.router = express.Router()
    }

    configureRoutes() {
        /**
 * @openapi
 * paths:
 *   /core/authentication:  # Replace with your actual baseLocation value
 *     post:
 *       tags:
 *         - pblc
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   default: fame@fokus.fraunhofer.de
 *                 password:
 *                   type: string
 *                   default: 12345
 *               required:
 *                 - email
 *       responses:
 *         200:
 *           description: Successfully logged in
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   accessToken:
 *                     $ref: '#/components/parameters/accessToken'
 *                   refreshToken:
 *                     $ref: '#/components/parameters/accessToken'
 *                   accessTokenExpiresIn:
 *                     type: string
 *                     default: 12/10/2022
 *                   refreshTokenExpiresIn:
 *                     type: string
 *                     default: 12/10/2022
 */

        this.router.post('/', this.authenticateUser)

        /**
 * @openapi
 * paths:
 *   /core/authentication/refresh:  # Replace with your actual baseLocation value
 *     get:
 *       tags:
 *         - pblc
 *       security:
 *         - bearerAuth: []
 *         - refreshAuth: []
 *       responses:
 *         200:
 *           description: Refreshe access token
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   accessToken:
 *                     $ref: '#/components/parameters/accessToken'
 */

        this.router.get('/refresh', this.refreshSession)
    }

    authenticateUser: express.Handler = (req, res, next) => {
        passport.authenticate(['local'], async (err: any, user: any, info: any) => {
            if (err) return next(err)
            if (!user) return next({ status: 401, message: `Wrong username or password` })
            try {
                const [accessToken, refreshToken] = await jwtServiceInstance.createAccessAndRefreshToken(user);
                let decodedA: any = jwt.decode(accessToken);
                let decodedR: any = jwt.decode(refreshToken);
                let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
                let refreshTokenExpiresIn = new Date(1000 * decodedR.exp).toJSON();
                return res.json({ accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn, userId: user._id })
            } catch (err) {
                return next(err)
            }

        })(req, res, next)
    }

    refreshSession: express.Handler = async (req, res, next) => {
        let header: string | undefined = req.header('x-refresh-token');
        const token = header && header.toLowerCase().trim() !== '' && header !== 'undefined' ? header : null;
        if (!token) return next({ message: 'not valid x-refresh-token header!', status: 401 })

        let decodedJWT: any = jwt.decode(token)
        let iss = decodedJWT.iss
        try {
            if (iss !== CONFIG.DEPLOY_URL) {
                const provider = OIDC_PROVIDERS.find((provider: any) => provider.authorization_endpoint.includes(iss))
                if (!provider) return next({ message: `Invalid issuer: ${iss}! `, status: 401 });
                // get userinformation from provider

                const response = await axios.post(provider.token_endpoint,
                    {
                        grant_type: 'refresh_token',
                        client_id: provider.client_id,
                        client_secret: provider.client_secret,
                        refresh_token: token,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                )

                const idp_access_token = response.data.access_token
                return res.json({
                    access_token: idp_access_token,
                    expires_in: response.data.expires_in,
                    refresh_token: response?.data?.refresh_token,
                    refres_token_expires_in: response?.data?.refresh_token_expires_in
                })
            } else {
                return UserDAO.findById(decodedJWT.sub)
                    .then((user) => Promise.all([jwtServiceInstance.verifyToken(token, jwtServiceInstance.SECRET + user.password), user]))
                    .then(([, user]) => jwtServiceInstance.createToken(user))
                    .then((token) => {
                        let decodedA: any = jwt.decode(token);
                        let accessTokenExpiresIn = new Date(1000 * decodedA.exp).toJSON();
                        return res.json({ accessToken: token, accessTokenExpiresIn })
                    })
                    .catch((err) => next(err))
            }
        } catch (err: any) {
            return next({
                status: err?.response?.status || 401,
                message: err?.response?.data || 'IdP validation error with provided token...'
            })
        }






    }


}

const controller = new AuthController()
controller.configureRoutes()

export default controller

