import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mut_study_hub',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false,
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n🔄 Running page tracking migration...');
    
    // Read the SQL file
    const sql = fs.readFileSync(join(__dirname, '012_add_page_tracking.sql'), 'utf8');
    
    // Execute the migration
    await client.query(sql);
    
    console.log('✅ Page tracking migration completed successfully!');
    console.log('\n📊 Migration details:');
    console.log('   ✓ Added current_page column to study_progress');
    console.log('   ✓ Added total_pages column to study_progress');
    console.log('   ✓ Created index on current_page');
    console.log('   ✓ Updated trigger function for auto-calculation');
    console.log('\n🎉 Database is ready for page-based progress tracking!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run the migration
runMigration();
