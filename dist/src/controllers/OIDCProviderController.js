"use strict";
/* -
 * Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 * All rights reserved.
 */
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
const express_1 = __importDefault(require("express"));
const AuthGuard_1 = require("../handlers/AuthGuard");
const OIDCProviderDAO_1 = __importDefault(require("../models/OIDCProvider/OIDCProviderDAO"));
const OIDCProviderModel_1 = __importDefault(require("../models/OIDCProvider/OIDCProviderModel"));
/**
 * Controller for managing OIDC providers in the database
 */
class OIDCProviderController {
    constructor() {
        /**
         * GET /core/mgmt/oidc-providers
         * Fetch all OIDC providers
         */
        this.getAllProviders = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const providers = yield OIDCProviderDAO_1.default.findAll();
                return res.json(providers);
            }
            catch (err) {
                return next(err);
            }
        });
        /**
         * GET /core/mgmt/oidc-providers/:id
         * Fetch a single OIDC provider by id
         */
        this.getProviderById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const provider = yield OIDCProviderDAO_1.default.findById(id);
                return res.json(provider);
            }
            catch (err) {
                return next(err);
            }
        });
        /**
         * POST /core/mgmt/oidc-providers
         * Create a new OIDC provider
         */
        this.createProvider = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { authorization_endpoint, token_endpoint, end_session_endpoint, userinfo_endpoint, jwks_uri, client_id, client_secret, issuer, displayName, active } = req.body;
                if (!authorization_endpoint || !token_endpoint || !client_id || !client_secret || !displayName) {
                    return next({
                        status: 400,
                        message: 'authorization_endpoint, token_endpoint, client_id, client_secret, and displayName are required'
                    });
                }
                const newProvider = new OIDCProviderModel_1.default({
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
                });
                const created = yield OIDCProviderDAO_1.default.insert(newProvider);
                // Reload providers in OIDCController
                try {
                    const { reloadProviders } = yield Promise.resolve().then(() => __importStar(require('./OIDCController')));
                    yield reloadProviders();
                }
                catch (e) {
                    console.warn('Could not reload OIDC providers in OIDCController');
                }
                return res.status(201).json(created);
            }
            catch (err) {
                return next(err);
            }
        });
        /**
         * PUT /core/mgmt/oidc-providers/:id
         * Update an existing OIDC provider
         */
        this.updateProvider = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { authorization_endpoint, token_endpoint, end_session_endpoint, userinfo_endpoint, jwks_uri, client_id, client_secret, issuer, displayName, active } = req.body;
                // Fetch existing provider
                const existing = yield OIDCProviderDAO_1.default.findById(id);
                if (!existing) {
                    return next({ status: 404, message: 'OIDC provider not found' });
                }
                // Update fields
                const updated = new OIDCProviderModel_1.default(Object.assign(Object.assign({}, existing), { authorization_endpoint: authorization_endpoint || existing.authorization_endpoint, token_endpoint: token_endpoint || existing.token_endpoint, end_session_endpoint: end_session_endpoint !== undefined ? end_session_endpoint : existing.end_session_endpoint, userinfo_endpoint: userinfo_endpoint !== undefined ? userinfo_endpoint : existing.userinfo_endpoint, jwks_uri: jwks_uri !== undefined ? jwks_uri : existing.jwks_uri, client_id: client_id || existing.client_id, client_secret: client_secret || existing.client_secret, issuer: issuer !== undefined ? issuer : existing.issuer, displayName: displayName || existing.displayName, active: active !== undefined ? active : existing.active }));
                const result = yield OIDCProviderDAO_1.default.updateById(id, updated);
                // Reload providers in OIDCController
                try {
                    const { reloadProviders } = yield Promise.resolve().then(() => __importStar(require('./OIDCController')));
                    yield reloadProviders();
                }
                catch (e) {
                    console.warn('Could not reload OIDC providers in OIDCController');
                }
                return res.json(result);
            }
            catch (err) {
                return next(err);
            }
        });
        /**
         * DELETE /core/mgmt/oidc-providers/:id
         * Delete an OIDC provider
         */
        this.deleteProvider = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield OIDCProviderDAO_1.default.deleteById(id);
                // Reload providers in OIDCController
                try {
                    const { reloadProviders } = yield Promise.resolve().then(() => __importStar(require('./OIDCController')));
                    yield reloadProviders();
                }
                catch (e) {
                    console.warn('Could not reload OIDC providers in OIDCController');
                }
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
        this.router.get('/', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.getAllProviders);
        this.router.post('/', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.createProvider);
        this.router.put('/:id', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.updateProvider);
        this.router.delete('/:id', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.deleteProvider);
        this.router.get('/:id', ...AuthGuard_1.AuthGuard.requireAdminUser(), this.getProviderById);
    }
}
exports.default = new OIDCProviderController();
