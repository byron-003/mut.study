import { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Adding profile_picture_url column to users table...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '008_add_profile_picture.sql'),
      'utf8'
    );
    
    await query(sql);
    
    console.log('✅ Profile picture migration completed successfully!');
    console.log('Added column: profile_picture_url to users table');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
