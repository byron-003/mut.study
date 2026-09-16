import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting system_settings migration...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '019_system_settings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the data
    const result = await client.query('SELECT * FROM system_settings ORDER BY setting_key');
    console.log('\n📊 Current system settings:');
    result.rows.forEach(row => {
      console.log(`   ${row.setting_key}: ${row.setting_value}`);
      if (row.setting_key === 'max_file_size') {
        const mb = (parseInt(row.setting_value) / 1024 / 1024).toFixed(2);
        console.log(`   └─ (${mb} MB)`);
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
