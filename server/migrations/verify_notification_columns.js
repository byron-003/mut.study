import { query } from '../config/database.js';

async function verifyColumns() {
  try {
    const result = await query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('media_url', 'media_type')
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Notification media columns:');
    result.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });
    
    if (result.rows.length === 2) {
      console.log('\n✨ Both columns exist! Notifications now support media attachments.');
    } else {
      console.log('\n⚠️ Warning: Expected 2 columns but found', result.rows.length);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyColumns();
