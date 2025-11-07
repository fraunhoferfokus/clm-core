"use strict";
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
// dbPool.ts
const pg_1 = require("pg");
const config_1 = require("../config/config");
const fs_1 = __importDefault(require("fs"));
// Vereinfachte Variante: Minimaler Auto-Reconnect bei Pool-Fehlern.
// Entfernt Heartbeat, Memory-Monitoring und komplexes Backoff.
const [host, port, database, user, password, poolNumber] = config_1.CONFIG.PG_CONFIG.split('|');
// SSL configuration options
const SSL_MODE = config_1.CONFIG.PG_SSL_MODE || 'none'; // Options: 'none', 'require', 'ca'
const SSL_CA_PATH = config_1.CONFIG.PG_SSL_CA_PATH || '';
// Configure SSL options based on mode
let ssl = false;
switch (SSL_MODE) {
    case 'trust':
        ssl = { rejectUnauthorized: false };
        break;
    case 'require':
        // Option 1: SSL required via connection string
        ssl = { rejectUnauthorized: true };
        break;
    case 'ca':
        // Option 2: SSL with CA certificate
        if (SSL_CA_PATH && fs_1.default.existsSync(SSL_CA_PATH)) {
            ssl = {
                rejectUnauthorized: false,
                ca: fs_1.default.readFileSync(SSL_CA_PATH).toString(),
            };
        }
        else {
            console.warn('SSL CA path not found or not specified. Falling back to no SSL.');
            ssl = false;
        }
        break;
    default:
        // Option 3: No SSL (default)
        ssl = false;
}
// Minimaler Auto-Reconnect Wrapper
class SimpleAutoReconnectPool {
    constructor() {
        this.rebuilding = false;
        this.retryCount = 0; // Anzahl ausgeführter Rebuild-Versuche seit letztem Erfolg
        this.maxRetries = 4; // Maximal 4 verzögerte Versuche (inkl. letztem 120s)
        this.baseDelayMs = 15000; // Erster Versuch nach 15s
        // Verbindungsbezogene SQLSTATE Codes (Klasse 08 + relevante Admin/Shutdown Fälle)
        this.reconnectSqlStates = new Set([
            '08000', '08003', '08006', '08001', '08004', '08007', '08P01',
            '57P01', '57P02', '57P03', '57P04', '57P05',
            '53300', '53400', '53000', '53200', '53300',
            '58P01', '58P02', '58000', '58030',
            'XX000', 'XX001', 'XX002' // Interne Fehler, häufig kritisch
        ]);
        // Node.js Socket/Netzwerkfehlercodes
        this.reconnectNodeErrorCodes = new Set([
            'ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH'
        ]);
        this.pool = this.buildPool();
        this.attach();
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }
    query(text, params) {
        return this.pool.query(text, params);
    }
    buildPool() {
        return new pg_1.Pool({
            host,
            port: parseInt(port),
            database,
            user,
            password,
            max: poolNumber ? parseInt(poolNumber) : 2,
            ssl
        });
    }
    attach() {
        this.pool.on('error', (err) => {
            const sqlState = (err === null || err === void 0 ? void 0 : err.code) || (err === null || err === void 0 ? void 0 : err.sqlState) || (err === null || err === void 0 ? void 0 : err.sqlstate); // pg verwendet code = SQLSTATE
            const nodeCode = err === null || err === void 0 ? void 0 : err.code; // Bei Netzwerkproblemen ebenfalls belegt
            const message = (err === null || err === void 0 ? void 0 : err.message) || String(err);
            const shouldReconnect = this.shouldReconnect(sqlState, nodeCode, message);
            console.error('[pgPool][error]', { sqlState, nodeCode, message, shouldReconnect });
            if (shouldReconnect)
                this.scheduleRebuild();
        });
    }
    shouldReconnect(sqlState, nodeCode, message) {
        // Direkt SQLSTATE-Klasse 08 oder definierter Code
        if (sqlState && this.reconnectSqlStates.has(sqlState))
            return true;
        // Node-spezifische Netzwerkfehler
        if (nodeCode && this.reconnectNodeErrorCodes.has(nodeCode))
            return true;
        // Heuristiken im Fehlertext falls Code fehlt
        const indicativeFragments = [
            'Connection terminated unexpectedly',
            'server closed the connection unexpectedly',
            'terminating connection due to administrator command',
            'could not connect to server',
            'Connection timed out',
            'remaining connection slots are reserved',
            'connection not open'
        ];
        if (message && indicativeFragments.some(f => message.includes(f)))
            return true;
        return false;
    }
    // Plant einen Rebuild mit exponentiellem Backoff (15s, 30s, 60s, 120s) bis maxRetries erreicht.
    scheduleRebuild() {
        if (this.rebuilding)
            return; // Bereits beim Rebuild
        if (this.retryTimer)
            return; // Bereits ein Versuch geplant
        if (this.retryCount >= this.maxRetries) {
            console.error('[pgPool] Maximalzahl Rebuild-Versuche erreicht; kein weiterer automatischer Versuch.');
            return;
        }
        const delay = this.baseDelayMs * Math.pow(2, this.retryCount); // 15s, 30s, 60s, 120s
        console.info(`[pgPool] Rebuild in ${(delay / 1000)}s geplant (Versuch ${this.retryCount + 1}/${this.maxRetries}).`);
        this.retryTimer = setTimeout(() => {
            this.retryTimer = undefined;
            this.rebuild();
        }, delay);
    }
    rebuild() {
        if (this.rebuilding)
            return;
        this.rebuilding = true;
        let old;
        try {
            old = this.pool;
            this.pool = this.buildPool();
            this.attach();
            // Test-Query: Bei Erfolg Retry-Zähler zurücksetzen
            this.pool.query('SELECT 1').then(() => {
                this.retryCount = 0;
                console.info('[pgPool] Pool neu aufgebaut (Verbindungstest erfolgreich).');
            }).catch(err => {
                // Fehler beim Soforttest => Zähler erhöhen und nächsten Versuch planen
                this.retryCount++;
                console.error('[pgPool] Fehler beim Verbindungstest nach Rebuild:', err.message || err);
                this.scheduleRebuild();
            });
        }
        finally {
            if (old) {
                old.removeAllListeners('error');
                old.end().catch(() => { });
            }
            this.rebuilding = false;
        }
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.retryTimer)
                clearTimeout(this.retryTimer);
            try {
                yield this.pool.end();
            }
            catch (_) { }
        });
    }
}
const poolInstance = new SimpleAutoReconnectPool();
exports.default = poolInstance;
