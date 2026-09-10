import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const initDatabase = async () => {
  const isRemote = process.env.DB_HOST && 
                   !process.env.DB_HOST.includes('localhost') && 
                   !process.env.DB_HOST.includes('127.0.0.1');

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
    console.log('✅ Connected to PostgreSQL database');
    
    // Create tables
    console.log('📋 Creating tables...');
    await createTables(client);
    
    // Seed data
    console.log('🌱 Seeding database with MUT data...');
    await seedData(client);
    
    console.log('✅ Database initialization completed successfully!');
    console.log('🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

const createTables = async (client) => {
  const schema = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Enable trigram extension for better text search
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- Drop tables if they exist (in reverse order of dependencies)
    DROP TABLE IF EXISTS study_materials CASCADE;
    DROP TABLE IF EXISTS courses CASCADE;
    DROP TABLE IF EXISTS programs CASCADE;
    DROP TABLE IF EXISTS departments CASCADE;
    DROP TABLE IF EXISTS schools CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    -- Schools table
    CREATE TABLE schools (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      code VARCHAR(20) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Departments table
    CREATE TABLE departments (
      id SERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(20) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(school_id, name)
    );

    -- Programs table
    CREATE TABLE programs (
      id SERIAL PRIMARY KEY,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(20),
      level VARCHAR(20) NOT NULL CHECK (level IN ('PhD', 'Masters', 'Degree', 'Diploma', 'TVET')),
      duration_years DECIMAL(2,1),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(department_id, name)
    );

    -- Courses/Units table
    CREATE TABLE courses (
      id SERIAL PRIMARY KEY,
      program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      unit_code VARCHAR(20) NOT NULL UNIQUE,
      unit_title VARCHAR(255) NOT NULL,
      academic_year INTEGER NOT NULL CHECK (academic_year >= 1 AND academic_year <= 6),
      semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
      credits INTEGER DEFAULT 3,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'class_rep', 'admin')),
      program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Study Materials table
    CREATE TABLE study_materials (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(30) NOT NULL CHECK (category IN ('notes', 'past_paper', 'cat', 'practical_manual', 'quiz')),
      file_url TEXT NOT NULL,
      cloudinary_public_id VARCHAR(255) NOT NULL,
      file_size BIGINT NOT NULL,
      file_type VARCHAR(50),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMP,
      rejection_reason TEXT,
      download_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better query performance
    CREATE INDEX idx_departments_school ON departments(school_id);
    CREATE INDEX idx_programs_department ON programs(department_id);
    CREATE INDEX idx_programs_level ON programs(level);
    CREATE INDEX idx_programs_code ON programs(code);
    CREATE INDEX idx_courses_program ON courses(program_id);
    CREATE INDEX idx_courses_unit_code ON courses(unit_code);
    CREATE INDEX idx_courses_year_semester ON courses(academic_year, semester);
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_role ON users(role);
    CREATE INDEX idx_users_program ON users(program_id);
    CREATE INDEX idx_users_active ON users(is_active);
    CREATE INDEX idx_materials_course ON study_materials(course_id);
    CREATE INDEX idx_materials_category ON study_materials(category);
    CREATE INDEX idx_materials_status ON study_materials(status);
    CREATE INDEX idx_materials_uploader ON study_materials(uploader_id);
    CREATE INDEX idx_materials_course_category ON study_materials(course_id, category);
    CREATE INDEX idx_materials_course_status ON study_materials(course_id, status);
    CREATE INDEX idx_materials_created ON study_materials(created_at DESC);
    
    -- Full-text search indexes
    CREATE INDEX idx_programs_name_trgm ON programs USING gin(name gin_trgm_ops);
    CREATE INDEX idx_courses_title_trgm ON courses USING gin(unit_title gin_trgm_ops);
    CREATE INDEX idx_courses_code_trgm ON courses USING gin(unit_code gin_trgm_ops);
    
    -- Composite indexes for common queries
    CREATE INDEX idx_materials_status_created ON study_materials(status, created_at DESC);
    CREATE INDEX idx_courses_program_year ON courses(program_id, academic_year, semester);

    -- Create updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Apply trigger to all tables
    CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_study_materials_updated_at BEFORE UPDATE ON study_materials
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  await client.query(schema);
  console.log('✅ All tables created successfully');
};

const seedData = async (client) => {
  await client.query('BEGIN');

  try {
    // Seed Schools
    console.log('  🏫 Seeding Schools...');
    const schools = await seedSchools(client);
    
    // Seed Departments
    console.log('  🏢 Seeding Departments...');
    const departments = await seedDepartments(client, schools);
    
    // Seed Programs
    console.log('  🎓 Seeding Programs...');
    const programs = await seedPrograms(client, departments);
    
    // Seed Sample Courses
    console.log('  📚 Seeding Sample Courses...');
    await seedSampleCourses(client, programs);

    await client.query('COMMIT');
    
    console.log('✅ Data seeding completed!');
    console.log(`   - Schools: ${Object.keys(schools).length}`);
    console.log(`   - Departments: ${Object.keys(departments).length}`);
    console.log(`   - Programs: ${Object.keys(programs).length}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
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
  const sampleCourses = [
    // Year 1 Semester 1
    { program: 'BSC-CS', code: 'SCS 2101', title: 'Introduction to Computer Science', year: 1, sem: 1, credits: 3 },
    { program: 'BSC-CS', code: 'SMA 2101', title: 'Calculus I', year: 1, sem: 1, credits: 3 },
    { program: 'BSC-CS', code: 'SCS 2102', title: 'Programming in C', year: 1, sem: 1, credits: 4 },
    { program: 'BSC-CS', code: 'SCS 2103', title: 'Computer Organization', year: 1, sem: 1, credits: 3 },
    
    // Year 1 Semester 2
    { program: 'BSC-CS', code: 'SCS 2104', title: 'Data Structures and Algorithms', year: 1, sem: 2, credits: 4 },
    { program: 'BSC-CS', code: 'SCS 2105', title: 'Object Oriented Programming', year: 1, sem: 2, credits: 4 },
    
    // Year 2 Semester 1
    { program: 'BSC-CS', code: 'SCS 2201', title: 'Database Systems', year: 2, sem: 1, credits: 4 },
    { program: 'BSC-CS', code: 'SCS 2202', title: 'Operating Systems', year: 2, sem: 1, credits: 4 },
  ];

  for (const course of sampleCourses) {
    await client.query(
      'INSERT INTO courses (program_id, unit_code, unit_title, academic_year, semester, credits) VALUES ($1, $2, $3, $4, $5, $6)',
      [programs[course.program], course.code, course.title, course.year, course.sem, course.credits]
    );
  }
  
  console.log(`     ✅ Added ${sampleCourses.length} sample courses`);
};

initDatabase();
