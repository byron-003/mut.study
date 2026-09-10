import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

async function addUserAcademicSettings() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding current_year and current_semester columns to users table...');
    
    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('current_year', 'current_semester')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    // Add current_year if it doesn't exist
    if (!existingColumns.includes('current_year')) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN current_year INTEGER CHECK (current_year >= 1 AND current_year <= 5)
      `);
      console.log('✅ Added current_year column');
    } else {
      console.log('✅ Column current_year already exists');
    }
    
    // Add current_semester if it doesn't exist
    if (!existingColumns.includes('current_semester')) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN current_semester INTEGER CHECK (current_semester IN (1, 2))
      `);
      console.log('✅ Added current_semester column');
    } else {
      console.log('✅ Column current_semester already exists');
    }
    
    // Create composite index for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_academic_period 
      ON users(current_year, current_semester) 
      WHERE current_year IS NOT NULL AND current_semester IS NOT NULL
    `);
    
    console.log('✅ Created index on academic period columns');
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Users can now set their current year and semester in profile settings');
    console.log('   2. Dashboard will use these settings to personalize content');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addUserAcademicSettings();
