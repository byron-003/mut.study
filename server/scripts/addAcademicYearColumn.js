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

async function addAcademicYearColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding academic_year column to study_materials table...');
    
    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'study_materials' 
      AND column_name = 'academic_year'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Column academic_year already exists');
      return;
    }
    
    // Add the column
    await client.query(`
      ALTER TABLE study_materials 
      ADD COLUMN academic_year VARCHAR(9) CHECK (academic_year ~ '^\\d{4}/\\d{4}$')
    `);
    
    console.log('✅ Successfully added academic_year column');
    
    // Create index for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_materials_academic_year 
      ON study_materials(academic_year)
    `);
    
    console.log('✅ Created index on academic_year column');
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAcademicYearColumn();
