import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
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

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating admin user...\n');
    
    // Admin credentials
    const adminData = {
      email: 'admin@mutstudy.com',
      password: 'Admin@123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin'
    };
    
    // Check if admin already exists
    const existingUser = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [adminData.email]
    );
    
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      
      if (user.role === 'admin') {
        console.log('✅ Admin user already exists!');
        console.log('\n📧 Email:', adminData.email);
        console.log('🔐 Password:', adminData.password);
        console.log('👤 Role:', user.role);
        console.log('\n⚠️  If you forgot the password, delete this user and run script again.');
        return;
      } else {
        // Upgrade existing user to admin
        await client.query(
          'UPDATE users SET role = $1 WHERE email = $2',
          ['admin', adminData.email]
        );
        console.log('✅ Upgraded existing user to admin role!');
        console.log('\n📧 Email:', adminData.email);
        console.log('🔐 Password: (use your existing password)');
        console.log('👤 Role: admin');
        return;
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    
    // Get a program ID (any will do for admin)
    const programResult = await client.query(
      'SELECT id FROM programs LIMIT 1'
    );
    
    const programId = programResult.rows[0]?.id || null;
    
    // Create admin user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, program_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, email, first_name, last_name, role`,
      [adminData.email, hashedPassword, adminData.firstName, adminData.lastName, adminData.role, programId]
    );
    
    const newUser = result.rows[0];
    
    console.log('✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 ADMIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:', adminData.email);
    console.log('🔐 Password:', adminData.password);
    console.log('👤 Name:', `${newUser.first_name} ${newUser.last_name}`);
    console.log('🎭 Role:', newUser.role);
    console.log('🆔 User ID:', newUser.id);
    console.log('═══════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('🔗 Admin Portal: http://localhost:5174');
    console.log('🔗 Main Portal: http://localhost:5173\n');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
