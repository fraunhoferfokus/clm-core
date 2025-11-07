"use strict";
/* -
 * Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 * All rights reserved.
 */
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
const express_1 = __importDefault(require("express"));
const AuthGuard_1 = require("../handlers/AuthGuard");
const OIDCClientDAO_1 = __importDefault(require("../models/OIDCClient/OIDCClientDAO"));
const OIDCClientModel_1 = __importDefault(require("../models/OIDCClient/OIDCClientModel"));
/**
 * Controller for managing OIDC clients in the database
 */
class OIDCClientController {
    constructor() {
        /**
         * GET /core/mgmt/oidc-clients
         * Fetch all OIDC clients
         */
        this.getAllClients = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const clients = yield OIDCClientDAO_1.default.findAll();
                return res.json(clients);
            }
            catch (err) {
                return next(err);
            }
        });
        /**
         * GET /core/mgmt/oidc-clients/:id
         * Fetch a single OIDC client by id
         */
        this.getClientById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const client = yield OIDCClientDAO_1.default.findById(id);
                return res.json(client);
            }
            catch (err) {
                return next(err);
            }
        });
        /**
         * POST /core/mgmt/oidc-clients
         * Create a new OIDC client
         */
        this.createClient = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { client_id, client_secret, valid_redirect_uris, jwks_uri, displayName, active } = req.body;
                if (!client_id || !client_secret || !displayName) {
                    return next({ status: 400, message: 'client_id, client_secret, and displayName are required' });
                }
                if (!Array.isArray(valid_redirect_uris) || valid_redirect_uris.length === 0) {
                    return next({ status: 400, message: 'valid_redirect_uris must be a non-empty array' });
                }
                // Check if client_id already exists
                const existing = yield OIDCClientDAO_1.default.findByClientId(client_id);
                if (existing) {
                    return next({ status: 400, message: 'Client with this client_id already exists' });
                }
                const newClient = new OIDCClientModel_1.default({
                    client_id,
                    client_secret,
                    valid_redirect_uris,
                    jwks_uri,
                    displayName,
                    active: active !== undefined ? active : true
                });
                const created = yield OIDCClientDAO_1.default.insert(newClient);
                return res.status(201).json(created);
            }
            catch (err) {
                return next(err);
            }
        });
        /**
         * PUT /core/mgmt/oidc-clients/:id
         * Update an existing OIDC client
         */
        this.updateClient = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { client_id, client_secret, valid_redirect_uris, jwks_uri, displayName, active } = req.body;
                // Fetch existing client
                const existing = yield OIDCClientDAO_1.default.findById(id);
                if (!existing) {
                    return next({ status: 404, message: 'OIDC client not found' });
                }
                // If client_id is being changed, ensure it doesn't conflict with another record
                if (client_id && client_id !== existing.client_id) {
                    const conflict = yield OIDCClientDAO_1.default.findByClientId(client_id);
                    if (conflict && conflict._id !== id) {
                        return next({ status: 400, message: 'Another client with this client_id already exists' });
                    }
                }
                // Update fields
                const updated = new OIDCClientModel_1.default(Object.assign(Object.assign({}, existing), { client_id: client_id || existing.client_id, client_secret: client_secret || existing.client_secret, valid_redirect_uris: valid_redirect_uris || existing.valid_redirect_uris, jwks_uri: jwks_uri !== undefined ? jwks_uri : existing.jwks_uri, displayName: displayName || existing.displayName, active: active !== undefined ? active : existing.active }));
                const result = yield OIDCClientDAO_1.default.updateById(id, updated);
                return res.json(result);
            }
            catch (err) {
                return next(err);
            }
        });
        /**
         * DELETE /core/mgmt/oidc-clients/:id
         * Delete an OIDC client
         */
        this.deleteClient = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield OIDCClientDAO_1.default.deleteById(id);
                return res.status(204).send();
            }
            catch (err) {
                return next(err);
            }
        });
        this.router = express_1.default.Router();
        this.init();
    }
    init() {
        this.router.use(express_1.default.json());
        // All routes require admin authentication
        this.router.get('/', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.getAllClients);
        this.router.post('/', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.createClient);
        this.router.put('/:id', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.updateClient);
        this.router.delete('/:id', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.deleteClient);
        this.router.get('/:id', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.getClientById);
    }
}
exports.default = new OIDCClientController();
