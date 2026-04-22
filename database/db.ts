/**
 * database/db.ts
 * Exports a mysql2 connection pool used by all API route handlers in server.ts.
 *
 * Environment variables (set in .env):
 *   DB_HOST     – default: localhost
 *   DB_PORT     – default: 3306
 *   DB_USER     – default: root
 *   DB_PASSWORD – required (leave blank for no password)
 *   DB_NAME     – default: certiverifier
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'certiverifieruicheck', // ✅ FIXED
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Verify connectivity on startup so the server fails fast if DB is unreachable.
(async () => {
  try {
    const conn = await pool.getConnection();
console.log(
  '✅  MySQL connected →',
  `${process.env.DB_USER || 'root'}@${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'certiverifieruicheck'}`
);    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err);
    process.exit(1);
  }
})();

export default pool;
