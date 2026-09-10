import { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Running forum tables migration...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '007_create_forum_tables.sql'),
      'utf8'
    );
    
    await query(sql);
    
    console.log('✅ Forum tables migration completed successfully!');
    console.log('Created tables:');
    console.log('  - forum_posts');
    console.log('  - forum_comments');
    console.log('  - forum_post_likes');
    console.log('Added triggers for automatic counts update');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
