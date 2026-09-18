import pkg from 'pg';
const { Pool, types } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL `timestamp without time zone` columns (OID 1114) are stored in UTC
// by this application (the DB session is pinned to UTC below). By default the
// pg driver parses those values in the Node process's local timezone, which
// shifts every timestamp whenever the server does not run in UTC (e.g. a dev
// machine on EAT/UTC+2/+3). Parse them as UTC so API responses always carry the
// correct instant, and clients can render them in the user's local time.
types.setTypeParser(1114, (value) =>
  value === null ? null : new Date(`${value.replace(' ', 'T')}Z`)
);

// Detect if we're using a remote database
const isRemote = process.env.DB_HOST && 
                 !process.env.DB_HOST.includes('localhost') && 
                 !process.env.DB_HOST.includes('127.0.0.1');

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'mut_study_hub',
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increased from 2s to 10s for remote databases
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10 seconds
  ssl: isRemote ? {
    rejectUnauthorized: false // Required for managed databases like Aiven, Railway, etc.
  } : false
});

// Test database connection
pool.on('connect', (client) => {
  console.log('📊 Connected to PostgreSQL database');
  // Pin the session to UTC (matches how timestamps are parsed), and set a
  // statement timeout to prevent long-running queries.
  client
    .query("SET statement_timeout = 30000; SET TIME ZONE 'UTC'")
    .catch((err) => console.error('Failed to initialise database session:', err.message));
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  // Don't exit, let the pool handle reconnection
});

pool.on('remove', () => {
  console.log('🔌 Client removed from pool');
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  let retries = 3;
  
  while (retries > 0) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { duration, rows: res.rowCount });
      }
      
      return res;
    } catch (error) {
      retries--;
      
      // Retry on connection errors
      if ((error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') && retries > 0) {
        console.log(`Database connection error, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        continue;
      }
      
      console.error('Database query error:', error);
      throw error;
    }
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Pool client
 */
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Helper function for transactions
 * @param {Function} callback - Transaction callback function
 * @returns {Promise} Transaction result
 */
export const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Close all connections in the pool
 */
export const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

export default {
  query,
  getClient,
  transaction,
  closePool,
  pool
};
