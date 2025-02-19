"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// dbPool.ts
const pg_1 = require("pg");
const config_1 = require("../config/config");
const [host, port, database, user, password, poolNumber] = config_1.CONFIG.PG_CONFIG.split('|');
const pool = new pg_1.Pool({
    host,
    port: parseInt(port),
    database,
    user,
    password,
    max: poolNumber ? parseInt(poolNumber) : 2
});
exports.default = pool;
