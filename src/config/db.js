const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => console.log('[DB] Conectado a PostgreSQL'));
pool.on('error',   (err) => console.error('[DB] Error:', err.message));

/**
 * Llama a una stored function de PostgreSQL.
 * Ej: callFn('registrar_medida', [mac, temp, hum, modo, bat])
 */
async function callFn(fn, args = []) {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await pool.query(`SELECT * FROM ${fn}(${placeholders})`, args);
  return rows;
}

module.exports = { pool, callFn };
