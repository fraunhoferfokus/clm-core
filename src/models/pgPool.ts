// dbPool.ts
import { Pool } from 'pg';
import { CONFIG } from "../config/config";

const [host, port, database, user, password, poolNumber] = CONFIG.PG_CONFIG!.split('|');

const pool = new Pool({
    host,
    port: parseInt(port),
    database,
    user,
    password,
    max: poolNumber ? parseInt(poolNumber) : 2
});

export default pool;