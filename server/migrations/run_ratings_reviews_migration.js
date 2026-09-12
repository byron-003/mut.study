import pkg from 'pg';
const { Pool } = pkg;
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'mut_study_hub',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });
  
  try {
    console.log('🚀 Starting Ratings & Reviews Migration (PostgreSQL)...\n');
    
    console.log('✅ Connected to database\n');
    
    // Read migration file
    const migrationPath = join(__dirname, '016_create_ratings_reviews_postgres.sql');
    const migrationSQL = await readFile(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...\n');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'resource_ratings', 
        'resource_reviews', 
        'review_helpful_votes', 
        'user_reputation',
        'reputation_activities'
      )
    `);
    
    console.log('📊 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Check if columns were added to study_materials table
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'study_materials'
      AND column_name IN ('rating_count', 'average_rating', 'review_count')
    `);
    
    console.log('\n📊 Columns added to study_materials table:');
    columnsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name}`);
    });
    
    // Count existing users with reputation initialized
    const reputationResult = await pool.query(`
      SELECT COUNT(*) as count FROM user_reputation
    `);
    
    console.log(`\n👥 User reputations initialized: ${reputationResult.rows[0].count}`);
    
    console.log('\n✨ Ratings & Reviews System is ready!');
    console.log('\nFeatures enabled:');
    console.log('  ✓ 5-star rating system');
    console.log('  ✓ Text reviews with helpful votes');
    console.log('  ✓ User reputation tracking');
    console.log('  ✓ Quality badges (Bronze, Silver, Gold, Platinum)');
    console.log('  ✓ Top rated resources view');
    console.log('  ✓ Top contributors leaderboard');
    console.log('  ✓ Automatic stats calculation via triggers\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('📪 Database connection closed');
  }
}

runMigration();
