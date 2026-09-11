/**
 * Production Migration Runner for Downloads Setting
 * Run this on your Render deployment or with production credentials
 */

import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Use environment variables (works in production)
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('Connecting to production database...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Database: ${process.env.DB_NAME}`);

    // Read the migration SQL file
    const sqlFile = path.join(__dirname, '012_add_downloads_setting.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\nRunning migration...');
    
    // Execute the migration
    await pool.query(sql);

    console.log('✅ Migration completed successfully!');
    
    // Verify the setting was created
    const result = await pool.query(
      "SELECT * FROM system_settings WHERE setting_key = 'downloads_enabled'"
    );
    
    console.log('\n📊 Verification:');
    console.log('Setting created:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  });
