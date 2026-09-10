import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { comprehensiveMUTPrograms } from './comprehensiveMUTPrograms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const updatePrograms = async () => {
  const isRemote = process.env.DB_HOST && 
                   !process.env.DB_HOST.includes('localhost') && 
                   !process.env.DB_HOST.includes('127.0.0.1');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'mut_study_hub',
    ssl: isRemote ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    await client.query('BEGIN');

    // Get departments mapping
    const deptResult = await client.query('SELECT id, code FROM departments');
    const departments = {};
    deptResult.rows.forEach(dept => {
      departments[dept.code] = dept.id;
    });

    let addedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    console.log('📚 Adding comprehensive MUT programs...\n');

    for (const deptPrograms of comprehensiveMUTPrograms) {
      const deptId = departments[deptPrograms.dept];
      
      if (!deptId) {
        console.log(`⚠️  Department ${deptPrograms.dept} not found, skipping...`);
        continue;
      }

      for (const program of deptPrograms.programs) {
        // Check if program already exists
        const existing = await client.query(
          'SELECT id, name FROM programs WHERE code = $1 OR (department_id = $2 AND name = $3)',
          [program.code, deptId, program.name]
        );

        if (existing.rows.length > 0) {
          // Update if needed
          await client.query(
            'UPDATE programs SET name = $1, level = $2, duration_years = $3 WHERE id = $4',
            [program.name, program.level, program.duration, existing.rows[0].id]
          );
          console.log(`  ✓ Updated: ${program.name}`);
          updatedCount++;
        } else {
          // Insert new program
          await client.query(
            'INSERT INTO programs (department_id, name, code, level, duration_years) VALUES ($1, $2, $3, $4, $5)',
            [deptId, program.name, program.code, program.level, program.duration]
          );
          console.log(`  + Added: ${program.name}`);
          addedCount++;
        }
      }
    }

    await client.query('COMMIT');
    
    console.log('\n✅ Program update completed!');
    console.log(`📊 Summary:`);
    console.log(`   - New programs added: ${addedCount}`);
    console.log(`   - Programs updated: ${updatedCount}`);
    console.log(`   - Total programs in database: ${addedCount + updatedCount + skippedCount}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating programs:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

updatePrograms();
