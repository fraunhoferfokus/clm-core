/* -
 * Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 * All rights reserved.
 */

import express from 'express'
import { AuthGuard } from '../handlers/AuthGuard'
import OIDCProviderDAO from '../models/OIDCProvider/OIDCProviderDAO'
import OIDCProviderModel from '../models/OIDCProvider/OIDCProviderModel'

/**
 * Controller for managing OIDC providers in the database
 */
class OIDCProviderController {
    router: express.Router

    constructor() {
        this.router = express.Router()
        this.init()
    }

    init() {
        this.router.use(express.json())
        
        // All routes require admin authentication
        this.router.get('/', ...AuthGuard.requireAdminUser(), this.getAllProviders)
        this.router.post('/', ...AuthGuard.requireAdminUser(), this.createProvider)
        this.router.put('/:id', ...AuthGuard.requireAdminUser(), this.updateProvider)
        this.router.delete('/:id', ...AuthGuard.requireAdminUser(), this.deleteProvider)
        this.router.get('/:id', ...AuthGuard.requireAdminUser(), this.getProviderById)
    }

    /**
     * GET /core/mgmt/oidc-providers
     * Fetch all OIDC providers
     */
    getAllProviders: express.Handler = async (req, res, next) => {
        try {
            const providers = await OIDCProviderDAO.findAll()
            return res.json(providers)
        } catch (err) {
            return next(err)
        }
    }

    /**
     * GET /core/mgmt/oidc-providers/:id
     * Fetch a single OIDC provider by id
     */
    getProviderById: express.Handler = async (req, res, next) => {
        try {
            const { id } = req.params
            const provider = await OIDCProviderDAO.findById(id)
            return res.json(provider)
        } catch (err) {
            return next(err)
        }
    }

    /**
     * POST /core/mgmt/oidc-providers
     * Create a new OIDC provider
     */
    createProvider: express.Handler = async (req, res, next) => {
        try {
            const {
                authorization_endpoint,
                token_endpoint,
                end_session_endpoint,
                userinfo_endpoint,
                jwks_uri,
                client_id,
                client_secret,
                issuer,
                displayName,
                active
            } = req.body

            if (!authorization_endpoint || !token_endpoint || !client_id || !client_secret || !displayName) {
                return next({
                    status: 400,
                    message: 'authorization_endpoint, token_endpoint, client_id, client_secret, and displayName are required'
                })
            }

            const newProvider = new OIDCProviderModel({
                authorization_endpoint,
                token_endpoint,
                end_session_endpoint,
                userinfo_endpoint,
                jwks_uri,
                client_id,
                client_secret,
                issuer,
                displayName,
                active: active !== undefined ? active : true
            })

            const created = await OIDCProviderDAO.insert(newProvider)
            
            // Reload providers in OIDCController
            try {
                const { reloadProviders } = await import('./OIDCController')
                await reloadProviders()
            } catch (e) {
                console.warn('Could not reload OIDC providers in OIDCController')
            }
            
            return res.status(201).json(created)
        } catch (err) {
            return next(err)
        }
    }

    /**
     * PUT /core/mgmt/oidc-providers/:id
     * Update an existing OIDC provider
     */
    updateProvider: express.Handler = async (req, res, next) => {
        try {
            const { id } = req.params
            const {
                authorization_endpoint,
                token_endpoint,
                end_session_endpoint,
                userinfo_endpoint,
                jwks_uri,
                client_id,
                client_secret,
                issuer,
                displayName,
                active
            } = req.body

            // Fetch existing provider
            const existing = await OIDCProviderDAO.findById(id)
            if (!existing) {
                return next({ status: 404, message: 'OIDC provider not found' })
            }

            // Update fields
            const updated = new OIDCProviderModel({
                ...existing,
                authorization_endpoint: authorization_endpoint || existing.authorization_endpoint,
                token_endpoint: token_endpoint || existing.token_endpoint,
                end_session_endpoint: end_session_endpoint !== undefined ? end_session_endpoint : existing.end_session_endpoint,
                userinfo_endpoint: userinfo_endpoint !== undefined ? userinfo_endpoint : existing.userinfo_endpoint,
                jwks_uri: jwks_uri !== undefined ? jwks_uri : existing.jwks_uri,
                client_id: client_id || existing.client_id,
                client_secret: client_secret || existing.client_secret,
                issuer: issuer !== undefined ? issuer : existing.issuer,
                displayName: displayName || existing.displayName,
                active: active !== undefined ? active : existing.active
            })

            const result = await OIDCProviderDAO.updateById(id, updated)
            
            // Reload providers in OIDCController
            try {
                const { reloadProviders } = await import('./OIDCController')
                await reloadProviders()
            } catch (e) {
                console.warn('Could not reload OIDC providers in OIDCController')
            }
            
            return res.json(result)
        } catch (err) {
            return next(err)
        }
    }

    /**
     * DELETE /core/mgmt/oidc-providers/:id
     * Delete an OIDC provider
     */
    deleteProvider: express.Handler = async (req, res, next) => {
        try {
            const { id } = req.params
            await OIDCProviderDAO.deleteById(id)
            
            // Reload providers in OIDCController
            try {
                const { reloadProviders } = await import('./OIDCController')
                await reloadProviders()
            } catch (e) {
                console.warn('Could not reload OIDC providers in OIDCController')
            }
            
            return res.status(204).send()
        } catch (err) {
            return next(err)
        }
    }
}

export default new OIDCProviderController()
