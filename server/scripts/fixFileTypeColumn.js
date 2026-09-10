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
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function fixFileTypeColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing file_type column in study_materials table...');
    
    // Increase file_type column length from VARCHAR(50) to VARCHAR(100)
    await client.query(`
      ALTER TABLE study_materials 
      ALTER COLUMN file_type TYPE VARCHAR(100);
    `);
    
    console.log('✅ Successfully updated file_type column to VARCHAR(100)');
    console.log('   This allows longer MIME types like:');
    console.log('   - application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    console.log('   - application/vnd.openxmlformats-officedocument.presentationml.presentation');
    console.log('   - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
  } catch (error) {
    console.error('❌ Error fixing file_type column:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixFileTypeColumn()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
