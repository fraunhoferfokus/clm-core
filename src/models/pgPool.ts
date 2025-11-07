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
import { Pool } from 'pg';
import { CONFIG } from "../config/config";
import fs from 'fs';

// Vereinfachte Variante: Minimaler Auto-Reconnect bei Pool-Fehlern.
// Entfernt Heartbeat, Memory-Monitoring und komplexes Backoff.

const [host, port, database, user, password, poolNumber] = CONFIG.PG_CONFIG!.split('|');

// SSL configuration options
const SSL_MODE = CONFIG.PG_SSL_MODE || 'none'; // Options: 'none', 'require', 'ca'
const SSL_CA_PATH = CONFIG.PG_SSL_CA_PATH || '';

// Configure SSL options based on mode
let ssl: boolean | object = false;

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
        if (SSL_CA_PATH && fs.existsSync(SSL_CA_PATH)) {
            ssl = {
                rejectUnauthorized: false,
                ca: fs.readFileSync(SSL_CA_PATH).toString(),
            };
        } else {
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
    private pool: Pool;
    private rebuilding = false;
    private retryCount = 0; // Anzahl ausgeführter Rebuild-Versuche seit letztem Erfolg
    private readonly maxRetries = 4; // Maximal 4 verzögerte Versuche (inkl. letztem 120s)
    private retryTimer?: NodeJS.Timeout; // Timer für geplanten Rebuild
    private readonly baseDelayMs = 15000; // Erster Versuch nach 15s
    // Verbindungsbezogene SQLSTATE Codes (Klasse 08 + relevante Admin/Shutdown Fälle)
    private readonly reconnectSqlStates = new Set<string>([
        '08000','08003','08006','08001','08004','08007','08P01', // Connection
        '57P01','57P02','57P03','57P04','57P05', // Admin / Shutdown / Session Timeout
        '53300','53400','53000','53200','53300', // Ressourcen / Verbindungslimits
        '58P01','58P02','58000','58030', // System / IO
        'XX000','XX001','XX002' // Interne Fehler, häufig kritisch
    ]);
    // Node.js Socket/Netzwerkfehlercodes
    private readonly reconnectNodeErrorCodes = new Set<string>([
        'ECONNRESET','ETIMEDOUT','EPIPE','ECONNREFUSED','ENETUNREACH','EHOSTUNREACH'
    ]);

    constructor() {
        this.pool = this.buildPool();
        this.attach();
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    query(text: string, params?: any[]) {
        return this.pool.query(text, params);
    }

    private buildPool() {
        return new Pool({
            host,
            port: parseInt(port),
            database,
            user,
            password,
            max: poolNumber ? parseInt(poolNumber) : 2,
            ssl
        });
    }

    private attach() {
        this.pool.on('error', (err: any) => {
            const sqlState = err?.code || err?.sqlState || err?.sqlstate; // pg verwendet code = SQLSTATE
            const nodeCode = err?.code; // Bei Netzwerkproblemen ebenfalls belegt
            const message = err?.message || String(err);
            const shouldReconnect = this.shouldReconnect(sqlState, nodeCode, message);
            console.error('[pgPool][error]', { sqlState, nodeCode, message, shouldReconnect });
            if (shouldReconnect) this.scheduleRebuild();
        });
    }

    private shouldReconnect(sqlState?: string, nodeCode?: string, message?: string): boolean {
        // Direkt SQLSTATE-Klasse 08 oder definierter Code
        if (sqlState && this.reconnectSqlStates.has(sqlState)) return true;
        // Node-spezifische Netzwerkfehler
        if (nodeCode && this.reconnectNodeErrorCodes.has(nodeCode)) return true;
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
        if (message && indicativeFragments.some(f => message.includes(f))) return true;
        return false;
    }

    // Plant einen Rebuild mit exponentiellem Backoff (15s, 30s, 60s, 120s) bis maxRetries erreicht.
    private scheduleRebuild() {
        if (this.rebuilding) return; // Bereits beim Rebuild
        if (this.retryTimer) return; // Bereits ein Versuch geplant
        if (this.retryCount >= this.maxRetries) {
            console.error('[pgPool] Maximalzahl Rebuild-Versuche erreicht; kein weiterer automatischer Versuch.');
            return;
        }
        const delay = this.baseDelayMs * Math.pow(2, this.retryCount); // 15s, 30s, 60s, 120s
        console.info(`[pgPool] Rebuild in ${(delay/1000)}s geplant (Versuch ${this.retryCount + 1}/${this.maxRetries}).`);
        this.retryTimer = setTimeout(() => {
            this.retryTimer = undefined;
            this.rebuild();
        }, delay);
    }

    private rebuild() {
        if (this.rebuilding) return;
        this.rebuilding = true;
        let old: Pool | undefined;
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
        } finally {
            if (old) {
                old.removeAllListeners('error');
                old.end().catch(() => {/* ignore */});
            }
            this.rebuilding = false;
        }
    }

    async shutdown() {
        if (this.retryTimer) clearTimeout(this.retryTimer);
        try { await this.pool.end(); } catch (_) { }
    }
}

const poolInstance = new SimpleAutoReconnectPool() as unknown as Pool & { query: any };
export default poolInstance;
