import { query } from './config/database.js';

async function testSearch() {
  try {
    console.log('🔍 Testing database search...\n');

    // Test 1: Count programs
    const programCount = await query('SELECT COUNT(*) FROM programs');
    console.log('📚 Programs in database:', programCount.rows[0].count);

    // Test 2: Count courses
    const courseCount = await query('SELECT COUNT(*) FROM courses');
    console.log('📖 Courses in database:', courseCount.rows[0].count);

    // Test 3: Count study materials
    const materialCount = await query('SELECT COUNT(*) FROM study_materials');
    console.log('📄 Study materials in database:', materialCount.rows[0].count);

    // Test 4: Count approved materials
    const approvedCount = await query("SELECT COUNT(*) FROM study_materials WHERE status = 'approved'");
    console.log('✅ Approved materials:', approvedCount.rows[0].count);

    // Test 5: Sample programs
    const samplePrograms = await query('SELECT name, code FROM programs LIMIT 3');
    console.log('\n📚 Sample programs:');
    samplePrograms.rows.forEach(p => console.log(`   - ${p.code}: ${p.name}`));

    // Test 6: Sample courses
    const sampleCourses = await query('SELECT unit_code, unit_title FROM courses LIMIT 3');
    console.log('\n📖 Sample courses:');
    sampleCourses.rows.forEach(c => console.log(`   - ${c.unit_code}: ${c.unit_title}`));

    // Test 7: Sample materials
    const sampleMaterials = await query("SELECT title, category, status FROM study_materials LIMIT 3");
    console.log('\n📄 Sample materials:');
    sampleMaterials.rows.forEach(m => console.log(`   - ${m.title} (${m.category}, ${m.status})`));

    // Test 8: Test search query
    const searchTerm = 'computer';
    console.log(`\n🔍 Testing search for "${searchTerm}"...`);
    
    const programSearch = await query(
      `SELECT name FROM programs WHERE name ILIKE $1 LIMIT 3`,
      [`%${searchTerm}%`]
    );
    console.log(`   Programs found: ${programSearch.rows.length}`);
    programSearch.rows.forEach(p => console.log(`   - ${p.name}`));

    console.log('\n✅ Search test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testSearch();
