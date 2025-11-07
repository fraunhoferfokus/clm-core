/* -
 * Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 * All rights reserved.
 */

import express from 'express'
import { AuthGuard } from '../handlers/AuthGuard'
import OIDCClientDAO from '../models/OIDCClient/OIDCClientDAO'
import OIDCClientModel from '../models/OIDCClient/OIDCClientModel'

/**
 * Controller for managing OIDC clients in the database
 */
class OIDCClientController {
    router: express.Router

    constructor() {
        this.router = express.Router()
        this.init()
    }

    init() {
        this.router.use(express.json())
        
        // All routes require admin authentication
        this.router.get('/', ...AuthGuard.requireAdminUser(), this.getAllClients)
        this.router.post('/', ...AuthGuard.requireAdminUser(), this.createClient)
        this.router.put('/:id', ...AuthGuard.requireAdminUser(), this.updateClient)
        this.router.delete('/:id', ...AuthGuard.requireAdminUser(), this.deleteClient)
        this.router.get('/:id', ...AuthGuard.requireAdminUser(), this.getClientById)
    }

    /**
     * GET /core/mgmt/oidc-clients
     * Fetch all OIDC clients
     */
    getAllClients: express.Handler = async (req, res, next) => {
        try {
            const clients = await OIDCClientDAO.findAll()
            return res.json(clients)
        } catch (err) {
            return next(err)
        }
    }

    /**
     * GET /core/mgmt/oidc-clients/:id
     * Fetch a single OIDC client by id
     */
    getClientById: express.Handler = async (req, res, next) => {
        try {
            const { id } = req.params
            const client = await OIDCClientDAO.findById(id)
            return res.json(client)
        } catch (err) {
            return next(err)
        }
    }

    /**
     * POST /core/mgmt/oidc-clients
     * Create a new OIDC client
     */
    createClient: express.Handler = async (req, res, next) => {
        try {
            const { client_id, client_secret, valid_redirect_uris, jwks_uri, displayName, active } = req.body

            if (!client_id || !client_secret || !displayName) {
                return next({ status: 400, message: 'client_id, client_secret, and displayName are required' })
            }

            if (!Array.isArray(valid_redirect_uris) || valid_redirect_uris.length === 0) {
                return next({ status: 400, message: 'valid_redirect_uris must be a non-empty array' })
            }

            // Check if client_id already exists
            const existing = await OIDCClientDAO.findByClientId(client_id)
            if (existing) {
                return next({ status: 400, message: 'Client with this client_id already exists' })
            }

            const newClient = new OIDCClientModel({
                client_id,
                client_secret,
                valid_redirect_uris,
                jwks_uri,
                displayName,
                active: active !== undefined ? active : true
            })

            const created = await OIDCClientDAO.insert(newClient)
            return res.status(201).json(created)
        } catch (err) {
            return next(err)
        }
    }

    /**
     * PUT /core/mgmt/oidc-clients/:id
     * Update an existing OIDC client
     */
    updateClient: express.Handler = async (req, res, next) => {
        try {
            const { id } = req.params
            const { client_id, client_secret, valid_redirect_uris, jwks_uri, displayName, active } = req.body

            // Fetch existing client
            const existing = await OIDCClientDAO.findById(id)
            if (!existing) {
                return next({ status: 404, message: 'OIDC client not found' })
            }

            // If client_id is being changed, ensure it doesn't conflict with another record
            if (client_id && client_id !== existing.client_id) {
                const conflict = await OIDCClientDAO.findByClientId(client_id)
                if (conflict && conflict._id !== id) {
                    return next({ status: 400, message: 'Another client with this client_id already exists' })
                }
            }

            // Update fields
            const updated = new OIDCClientModel({
                ...existing,
                client_id: client_id || existing.client_id,
                client_secret: client_secret || existing.client_secret,
                valid_redirect_uris: valid_redirect_uris || existing.valid_redirect_uris,
                jwks_uri: jwks_uri !== undefined ? jwks_uri : existing.jwks_uri,
                displayName: displayName || existing.displayName,
                active: active !== undefined ? active : existing.active
            })

            const result = await OIDCClientDAO.updateById(id, updated)
            return res.json(result)
        } catch (err) {
            return next(err)
        }
    }

    /**
     * DELETE /core/mgmt/oidc-clients/:id
     * Delete an OIDC client
     */
    deleteClient: express.Handler = async (req, res, next) => {
        try {
            const { id } = req.params
            await OIDCClientDAO.deleteById(id)
            return res.status(204).send()
        } catch (err) {
            return next(err)
        }
    }
}

export default new OIDCClientController()
