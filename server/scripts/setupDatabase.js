import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const setupDatabase = async () => {
  // Check if we're using a remote database (requires SSL)
  const isRemote = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1');
  
  // Connect without database name to create the database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'defaultdb', // Use defaultdb for Aiven/managed databases
    ssl: isRemote ? {
      rejectUnauthorized: false // Accept self-signed certificates for managed databases
    } : false
  });

  try {
    await client.connect();
    console.log('📦 Connected to PostgreSQL server');

    // Create database if it doesn't exist (only for local databases)
    const dbName = process.env.DB_NAME || 'mut_study_hub';
    
    if (!isRemote) {
      // For local databases, create the database if needed
      const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
      const result = await client.query(checkDbQuery, [dbName]);

      if (result.rows.length === 0) {
        await client.query(`CREATE DATABASE ${dbName}`);
        console.log(`✅ Database '${dbName}' created successfully`);
      } else {
        console.log(`ℹ️  Database '${dbName}' already exists`);
      }
      
      await client.end();
      
      // Connect to the new database
      const dbClient = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: dbName,
        ssl: isRemote ? {
          rejectUnauthorized: false
        } : false
      });
      
      await dbClient.connect();
      console.log(`📦 Connected to database '${dbName}'`);
      
      // Create tables
      await createTables(dbClient);
      await dbClient.end();
    } else {
      // For remote databases (Aiven, etc.), the database already exists
      // Just create tables in the connected database
      console.log(`ℹ️  Using remote database '${dbName}' (managed service)`);
      await createTables(client);
      await client.end();
    }

    console.log('✅ Database setup completed successfully!');
    console.log('📝 Next step: Run "npm run db:seed" to populate the database with MUT data');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
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

  try {
    await client.query(schema);
    console.log('✅ All tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

setupDatabase();
