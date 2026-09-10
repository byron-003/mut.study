import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const addPasswordResetFields = async () => {
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
    
    console.log('📋 Adding password reset fields to users table...');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_otp_hash VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP;
    `);
    
    console.log('✅ Password reset fields added successfully!');
    console.log('\nNew columns:');
    console.log('  - reset_otp_hash: Stores hashed OTP');
    console.log('  - reset_otp_expires: OTP expiration timestamp');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
};

addPasswordResetFields();
