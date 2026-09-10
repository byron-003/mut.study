import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const seedDatabase = async () => {
  const isRemote = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'mut_study_hub',
    ssl: isRemote ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    console.log('📦 Connected to database');

    await client.query('BEGIN');

    // Seed Schools
    console.log('🏫 Seeding Schools...');
    const schools = await seedSchools(client);
    
    // Seed Departments
    console.log('🏢 Seeding Departments...');
    const departments = await seedDepartments(client, schools);
    
    // Seed Programs
    console.log('🎓 Seeding Programs...');
    const programs = await seedPrograms(client, departments);
    
    // Seed Sample Courses
    console.log('📚 Seeding Sample Courses...');
    await seedSampleCourses(client, programs);

    await client.query('COMMIT');
    
    console.log('✅ Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - Schools: ${Object.keys(schools).length}`);
    console.log(`   - Departments: ${Object.keys(departments).length}`);
    console.log(`   - Programs: ${Object.keys(programs).length}`);
    console.log('');
    console.log('🚀 You can now start the server with: npm run dev');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

const seedSchools = async (client) => {
  const schoolsData = [
    { name: 'School of Computing & Information Technology', code: 'SCIT', description: 'Premier institution for computing and IT education' },
    { name: 'School of Engineering & Technology', code: 'SET', description: 'Excellence in engineering and technological innovation' },
    { name: 'School of Business & Economics', code: 'SBE', description: 'Nurturing business leaders and economists' },
    { name: 'School of Pure, Applied & Health Sciences', code: 'SPAHS', description: 'Advancing scientific knowledge and health sciences' },
    { name: 'School of Education, Humanities & Social Sciences', code: 'SOEHSS', description: 'Shaping educators and social scientists' },
    { name: 'School of Hospitality & Tourism Management', code: 'SHTM', description: 'Excellence in hospitality and tourism' },
    { name: 'School of Agriculture & Environmental Sciences', code: 'SAES', description: 'Sustainable agriculture and environmental stewardship' },
    { name: 'School of Nursing Sciences', code: 'SNS', description: 'Training compassionate healthcare professionals' }
  ];

  const schools = {};
  for (const school of schoolsData) {
    const result = await client.query(
      'INSERT INTO schools (name, code, description) VALUES ($1, $2, $3) RETURNING id',
      [school.name, school.code, school.description]
    );
    schools[school.code] = result.rows[0].id;
  }
  
  return schools;
};

const seedDepartments = async (client, schools) => {
  const departmentsData = [
    // SCIT Departments
    { school: 'SCIT', name: 'Department of Computer Science', code: 'DCS' },
    { school: 'SCIT', name: 'Department of Information Technology', code: 'DIT' },
    { school: 'SCIT', name: 'Department of Software Engineering', code: 'DSE' },
    
    // SET Departments
    { school: 'SET', name: 'Department of Electrical & Electronic Engineering', code: 'DEEE' },
    { school: 'SET', name: 'Department of Mechanical & Mechatronic Engineering', code: 'DMME' },
    { school: 'SET', name: 'Department of Civil & Environmental Engineering', code: 'DCEE' },
    
    // SBE Departments
    { school: 'SBE', name: 'Department of Business Management', code: 'DBM' },
    { school: 'SBE', name: 'Department of Economics, Finance & Accounting', code: 'DEFA' },
    { school: 'SBE', name: 'Department of Supply Chain & Logistics', code: 'DSCL' },
    
    // SPAHS Departments
    { school: 'SPAHS', name: 'Department of Mathematics & Actuarial Science', code: 'DMAS' },
    { school: 'SPAHS', name: 'Department of Physical & Biological Sciences', code: 'DPBS' },
    { school: 'SPAHS', name: 'Department of Medical Laboratory & Health Sciences', code: 'DMLHS' },
    
    // SOEHSS Departments
    { school: 'SOEHSS', name: 'Department of Education', code: 'DE' },
    { school: 'SOEHSS', name: 'Department of Humanities & Social Sciences', code: 'DHSS' },
    
    // SHTM Departments
    { school: 'SHTM', name: 'Department of Hospitality Management', code: 'DHM' },
    { school: 'SHTM', name: 'Department of Tourism & Events Management', code: 'DTEM' },
    
    // SAES Departments
    { school: 'SAES', name: 'Department of Agricultural Sciences', code: 'DAS' },
    
    // SNS Departments
    { school: 'SNS', name: 'Department of Nursing', code: 'DN' }
  ];

  const departments = {};
  for (const dept of departmentsData) {
    const result = await client.query(
      'INSERT INTO departments (school_id, name, code) VALUES ($1, $2, $3) RETURNING id',
      [schools[dept.school], dept.name, dept.code]
    );
    departments[dept.code] = result.rows[0].id;
  }
  
  return departments;
};

const seedPrograms = async (client, departments) => {
  const programsData = [
    // Department of Computer Science
    { dept: 'DCS', name: 'PhD in Computer Science', code: 'PHD-CS', level: 'PhD', duration: 3 },
    { dept: 'DCS', name: 'Master of Science in Computer Science', code: 'MSC-CS', level: 'Masters', duration: 2 },
    { dept: 'DCS', name: 'Bachelor of Science in Computer Science', code: 'BSC-CS', level: 'Degree', duration: 4 },
    { dept: 'DCS', name: 'Diploma in Computer Science', code: 'DIP-CS', level: 'Diploma', duration: 2 },
    
    // Department of Information Technology
    { dept: 'DIT', name: 'PhD in Information Technology', code: 'PHD-IT', level: 'PhD', duration: 3 },
    { dept: 'DIT', name: 'Master of Science in Information Technology', code: 'MSC-IT', level: 'Masters', duration: 2 },
    { dept: 'DIT', name: 'Bachelor of Science in Information Technology', code: 'BSC-IT', level: 'Degree', duration: 4 },
    { dept: 'DIT', name: 'Bachelor of Science in Business Information Technology', code: 'BBIT', level: 'Degree', duration: 4 },
    { dept: 'DIT', name: 'Diploma in Information Technology', code: 'DIP-IT', level: 'Diploma', duration: 2 },
    
    // Department of Software Engineering
    { dept: 'DSE', name: 'Bachelor of Science in Software Engineering', code: 'BSC-SE', level: 'Degree', duration: 4 },
    { dept: 'DSE', name: 'Diploma in Software Engineering', code: 'DIP-SE', level: 'Diploma', duration: 2 },
    
    // Department of Electrical & Electronic Engineering
    { dept: 'DEEE', name: 'Master of Science in Electrical & Electronic Engineering', code: 'MSC-EEE', level: 'Masters', duration: 2 },
    { dept: 'DEEE', name: 'Bachelor of Technology in Electrical & Electronic Engineering', code: 'BTECH-EEE', level: 'Degree', duration: 4 },
    { dept: 'DEEE', name: 'Diploma in Electrical & Electronic Engineering', code: 'DIP-EEE', level: 'Diploma', duration: 3 },
    { dept: 'DEEE', name: 'TVET Craft Certificate in Electrical Engineering', code: 'TVET-EE', level: 'TVET', duration: 2 },
    
    // Department of Mechanical & Mechatronic Engineering
    { dept: 'DMME', name: 'Bachelor of Science in Mechanical Engineering', code: 'BSC-ME', level: 'Degree', duration: 4 },
    { dept: 'DMME', name: 'Bachelor of Science in Mechatronic Engineering', code: 'BSC-MCE', level: 'Degree', duration: 4 },
    { dept: 'DMME', name: 'Diploma in Mechanical Engineering', code: 'DIP-ME', level: 'Diploma', duration: 3 },
    
    // Department of Civil & Environmental Engineering
    { dept: 'DCEE', name: 'Bachelor of Science in Civil Engineering', code: 'BSC-CE', level: 'Degree', duration: 4 },
    { dept: 'DCEE', name: 'Diploma in Civil Engineering', code: 'DIP-CE', level: 'Diploma', duration: 3 },
    
    // Department of Business Management
    { dept: 'DBM', name: 'PhD in Business Administration', code: 'PHD-BA', level: 'PhD', duration: 3 },
    { dept: 'DBM', name: 'Master of Business Administration', code: 'MBA', level: 'Masters', duration: 2 },
    { dept: 'DBM', name: 'Bachelor of Commerce', code: 'BCOM', level: 'Degree', duration: 4 },
    { dept: 'DBM', name: 'Bachelor of Science in Human Resource Management', code: 'BSC-HRM', level: 'Degree', duration: 4 },
    { dept: 'DBM', name: 'Diploma in Business Management', code: 'DIP-BM', level: 'Diploma', duration: 2 },
    
    // Department of Economics, Finance & Accounting
    { dept: 'DEFA', name: 'Master of Science in Finance', code: 'MSC-FIN', level: 'Masters', duration: 2 },
    { dept: 'DEFA', name: 'Bachelor of Science in Financial Economics', code: 'BSC-FINEC', level: 'Degree', duration: 4 },
    { dept: 'DEFA', name: 'Bachelor of Science in Economics', code: 'BSC-ECON', level: 'Degree', duration: 4 },
    { dept: 'DEFA', name: 'Diploma in Accounting & Finance', code: 'DIP-AF', level: 'Diploma', duration: 2 },
    
    // Department of Supply Chain & Logistics
    { dept: 'DSCL', name: 'Master of Science in Procurement & Logistics', code: 'MSC-PL', level: 'Masters', duration: 2 },
    { dept: 'DSCL', name: 'Bachelor of Procurement and Supply Chain Management', code: 'BSC-PSCM', level: 'Degree', duration: 4 },
    { dept: 'DSCL', name: 'Diploma in Purchasing and Supplies Management', code: 'DIP-PSM', level: 'Diploma', duration: 2 },
    
    // Department of Mathematics & Actuarial Science
    { dept: 'DMAS', name: 'Master of Science in Applied Mathematics', code: 'MSC-AM', level: 'Masters', duration: 2 },
    { dept: 'DMAS', name: 'Bachelor of Science in Actuarial Science', code: 'BSC-AS', level: 'Degree', duration: 4 },
    { dept: 'DMAS', name: 'Bachelor of Science in Mathematics & Computer Science', code: 'BSC-MCS', level: 'Degree', duration: 4 },
    { dept: 'DMAS', name: 'Bachelor of Science in Statistics', code: 'BSC-STAT', level: 'Degree', duration: 4 },
    
    // Department of Physical & Biological Sciences
    { dept: 'DPBS', name: 'Master of Science in Chemistry', code: 'MSC-CHEM', level: 'Masters', duration: 2 },
    { dept: 'DPBS', name: 'Bachelor of Science in Analytical Chemistry', code: 'BSC-AC', level: 'Degree', duration: 4 },
    { dept: 'DPBS', name: 'Bachelor of Science in Industrial Chemistry', code: 'BSC-IC', level: 'Degree', duration: 4 },
    { dept: 'DPBS', name: 'Bachelor of Science in Biochemistry', code: 'BSC-BC', level: 'Degree', duration: 4 },
    
    // Department of Medical Laboratory & Health Sciences
    { dept: 'DMLHS', name: 'Bachelor of Science in Medical Laboratory Sciences', code: 'BSC-MLS', level: 'Degree', duration: 4 },
    { dept: 'DMLHS', name: 'Diploma in Medical Laboratory Technology', code: 'DIP-MLT', level: 'Diploma', duration: 3 },
    
    // Department of Education
    { dept: 'DE', name: 'Master of Education in Educational Management', code: 'MED-EM', level: 'Masters', duration: 2 },
    { dept: 'DE', name: 'Bachelor of Education (Science)', code: 'BED-SCI', level: 'Degree', duration: 4 },
    { dept: 'DE', name: 'Bachelor of Education (Arts)', code: 'BED-ARTS', level: 'Degree', duration: 4 },
    { dept: 'DE', name: 'Bachelor of Education (Technology Education)', code: 'BED-TECH', level: 'Degree', duration: 4 },
    
    // Department of Humanities & Social Sciences
    { dept: 'DHSS', name: 'Bachelor of Science in Criminology & Security Studies', code: 'BSC-CSS', level: 'Degree', duration: 4 },
    { dept: 'DHSS', name: 'Bachelor of Journalism & Media Studies', code: 'BJM', level: 'Degree', duration: 4 },
    { dept: 'DHSS', name: 'Diploma in Criminology and Security Studies', code: 'DIP-CSS', level: 'Diploma', duration: 2 },
    
    // Department of Hospitality Management
    { dept: 'DHM', name: 'Master of Science in Hospitality Management', code: 'MSC-HM', level: 'Masters', duration: 2 },
    { dept: 'DHM', name: 'Bachelor of Science in Hospitality Management', code: 'BSC-HM', level: 'Degree', duration: 4 },
    { dept: 'DHM', name: 'Diploma in Hospitality Management', code: 'DIP-HM', level: 'Diploma', duration: 2 },
    
    // Department of Tourism & Events Management
    { dept: 'DTEM', name: 'Bachelor of Science in Tourism Management', code: 'BSC-TM', level: 'Degree', duration: 4 },
    { dept: 'DTEM', name: 'Diploma in Travel & Tourism Management', code: 'DIP-TTM', level: 'Diploma', duration: 2 },
    
    // Department of Agricultural Sciences
    { dept: 'DAS', name: 'Master of Science in Crop Protection', code: 'MSC-CP', level: 'Masters', duration: 2 },
    { dept: 'DAS', name: 'Bachelor of Science in Agriculture', code: 'BSC-AG', level: 'Degree', duration: 4 },
    { dept: 'DAS', name: 'Bachelor of Science in Agribusiness Management', code: 'BSC-ABM', level: 'Degree', duration: 4 },
    { dept: 'DAS', name: 'Diploma in Agriculture', code: 'DIP-AG', level: 'Diploma', duration: 2 },
    
    // Department of Nursing
    { dept: 'DN', name: 'Bachelor of Science in Nursing (Direct Entry)', code: 'BSC-N-DE', level: 'Degree', duration: 4 },
    { dept: 'DN', name: 'Bachelor of Science in Nursing (Upgrading)', code: 'BSC-N-UP', level: 'Degree', duration: 2 }
  ];

  const programs = {};
  for (const program of programsData) {
    const result = await client.query(
      'INSERT INTO programs (department_id, name, code, level, duration_years) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [departments[program.dept], program.name, program.code, program.level, program.duration]
    );
    programs[program.code] = result.rows[0].id;
  }
  
  return programs;
};

const seedSampleCourses = async (client, programs) => {
  // Sample courses for BSC-CS (Bachelor of Science in Computer Science)
  const sampleCourses = [
    // Year 1 Semester 1
    { program: 'BSC-CS', code: 'SCS 2101', title: 'Introduction to Computer Science', year: 1, sem: 1, credits: 3 },
    { program: 'BSC-CS', code: 'SMA 2101', title: 'Calculus I', year: 1, sem: 1, credits: 3 },
    { program: 'BSC-CS', code: 'SCS 2102', title: 'Programming in C', year: 1, sem: 1, credits: 4 },
    { program: 'BSC-CS', code: 'SCS 2103', title: 'Computer Organization', year: 1, sem: 1, credits: 3 },
    { program: 'BSC-CS', code: 'SCO 2100', title: 'Communication Skills', year: 1, sem: 1, credits: 2 },
    
    // Year 1 Semester 2
    { program: 'BSC-CS', code: 'SCS 2104', title: 'Data Structures and Algorithms', year: 1, sem: 2, credits: 4 },
    { program: 'BSC-CS', code: 'SMA 2102', title: 'Calculus II', year: 1, sem: 2, credits: 3 },
    { program: 'BSC-CS', code: 'SCS 2105', title: 'Object Oriented Programming', year: 1, sem: 2, credits: 4 },
    { program: 'BSC-CS', code: 'SCS 2106', title: 'Digital Logic Design', year: 1, sem: 2, credits: 3 },
    { program: 'BSC-CS', code: 'SMA 2103', title: 'Discrete Mathematics', year: 1, sem: 2, credits: 3 },
    
    // Year 2 Semester 1
    { program: 'BSC-CS', code: 'SCS 2201', title: 'Database Systems', year: 2, sem: 1, credits: 4 },
    { program: 'BSC-CS', code: 'SCS 2202', title: 'Operating Systems', year: 2, sem: 1, credits: 4 },
    { program: 'BSC-CS', code: 'SCS 2203', title: 'Web Application Development', year: 2, sem: 1, credits: 3 },
    { program: 'BSC-CS', code: 'SMA 2201', title: 'Linear Algebra', year: 2, sem: 1, credits: 3 },
    { program: 'BSC-CS', code: 'SCS 2204', title: 'Computer Networks', year: 2, sem: 1, credits: 3 },
    
    // Year 2 Semester 2
    { program: 'BSC-CS', code: 'SCS 2205', title: 'Software Engineering', year: 2, sem: 2, credits: 4 },
    { program: 'BSC-CS', code: 'SCS 2206', title: 'Design and Analysis of Algorithms', year: 2, sem: 2, credits: 4 },
    { program: 'BSC-CS', code: 'SCS 2207', title: 'Artificial Intelligence', year: 2, sem: 2, credits: 3 },
    { program: 'BSC-CS', code: 'SCS 2208', title: 'Computer Architecture', year: 2, sem: 2, credits: 3 },
    { program: 'BSC-CS', code: 'SST 2201', title: 'Probability and Statistics', year: 2, sem: 2, credits: 3 },
    
    // Sample courses for BBIT (Business Information Technology)
    { program: 'BBIT', code: 'BIT 2101', title: 'Introduction to Business IT', year: 1, sem: 1, credits: 3 },
    { program: 'BBIT', code: 'BIT 2102', title: 'Principles of Management', year: 1, sem: 1, credits: 3 },
    { program: 'BBIT', code: 'BIT 2103', title: 'Programming Fundamentals', year: 1, sem: 1, credits: 4 },
    { program: 'BBIT', code: 'BIT 2104', title: 'Business Mathematics', year: 1, sem: 1, credits: 3 },
    
    // Sample courses for BSC-SE (Software Engineering)
    { program: 'BSC-SE', code: 'SSE 2101', title: 'Introduction to Software Engineering', year: 1, sem: 1, credits: 3 },
    { program: 'BSC-SE', code: 'SSE 2102', title: 'Programming Fundamentals', year: 1, sem: 1, credits: 4 },
    { program: 'BSC-SE', code: 'SSE 2103', title: 'Requirements Engineering', year: 1, sem: 2, credits: 3 },
    { program: 'BSC-SE', code: 'SSE 2201', title: 'Software Design Patterns', year: 2, sem: 1, credits: 4 },
    { program: 'BSC-SE', code: 'SSE 2202', title: 'Software Testing and Quality Assurance', year: 2, sem: 1, credits: 3 },
    
    // Sample courses for MBA
    { program: 'MBA', code: 'MBA 2101', title: 'Strategic Management', year: 1, sem: 1, credits: 3 },
    { program: 'MBA', code: 'MBA 2102', title: 'Managerial Economics', year: 1, sem: 1, credits: 3 },
    { program: 'MBA', code: 'MBA 2103', title: 'Financial Management', year: 1, sem: 1, credits: 3 },
    { program: 'MBA', code: 'MBA 2104', title: 'Organizational Behavior', year: 1, sem: 2, credits: 3 }
  ];

  for (const course of sampleCourses) {
    await client.query(
      'INSERT INTO courses (program_id, unit_code, unit_title, academic_year, semester, credits) VALUES ($1, $2, $3, $4, $5, $6)',
      [programs[course.program], course.code, course.title, course.year, course.sem, course.credits]
    );
  }
  
  console.log(`   ✅ Added ${sampleCourses.length} sample courses`);
};

seedDatabase();
