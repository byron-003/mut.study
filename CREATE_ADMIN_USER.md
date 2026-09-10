# Create Admin User

Quick guide to create an administrator account for the MUT Study Hub platform.

---

## 🚀 Quick Start

```bash
cd server
npm run create-admin
```

That's it! The script will create an admin user with default credentials.

---

## 📋 Default Admin Credentials

After running the script, you'll get:

```
📧 Email: admin@mutstudy.ac.za
🔐 Password: Admin@123
👤 Role: admin
```

---

## 🔗 Where to Login

### Admin Portal
- URL: http://localhost:5174/login
- Full admin access
- Manage users, resources, programs, courses

### Main Portal  
- URL: http://localhost:5173/login
- Also works with admin credentials
- Student/user interface

---

## ✨ What the Script Does

1. **Checks if admin exists**
   - If exists: Shows existing credentials
   - If user exists but not admin: Upgrades to admin role
   - If doesn't exist: Creates new admin user

2. **Creates admin with**:
   - Email: `admin@mutstudy.ac.za`
   - Password: `Admin@123` (hashed with bcrypt)
   - Name: System Administrator
   - Role: admin
   - Status: Active

3. **Shows credentials**:
   - Displays login information
   - Provides portal URLs
   - Reminds to change password

---

## 🔄 Running Multiple Times

Safe to run multiple times:
- ✅ Won't create duplicates
- ✅ Won't overwrite existing admin
- ✅ Shows current credentials if exists

---

## 🔐 Security Notes

### ⚠️ IMPORTANT
1. **Change password immediately** after first login
2. **Don't use default password** in production
3. **Use strong password** with mix of characters

### Recommended Password Format
- At least 12 characters
- Mix of uppercase and lowercase
- Include numbers and symbols
- Example: `MyS3cure!Pass2024`

---

## 🛠️ Troubleshooting

### Script fails with "relation does not exist"?

**Issue**: Users table not created yet

**Solution**: Initialize database first
```bash
npm run db:init
```

### Script fails with "connection refused"?

**Issue**: Database not accessible

**Solution**: Check `.env` configuration
```bash
# Verify these in server/.env:
DB_HOST=your-host
DB_PORT=your-port
DB_NAME=mut_study_hub
DB_USER=your-user
DB_PASSWORD=your-password
DB_SSL=true
```

### Admin exists but forgot password?

**Option 1**: Delete and recreate
```sql
-- Connect to database and run:
DELETE FROM users WHERE email = 'admin@mutstudy.ac.za';
```
Then run script again: `npm run create-admin`

**Option 2**: Update password manually
```sql
-- New password hash for 'Admin@123'
UPDATE users 
SET password = '$2b$10$...' -- Use bcrypt to generate
WHERE email = 'admin@mutstudy.ac.za';
```

### Want different admin credentials?

**Edit the script**: `server/scripts/createAdmin.js`

Change these values:
```javascript
const adminData = {
  email: 'youremail@example.com',  // Change email
  password: 'YourPassword123!',     // Change password
  firstName: 'Your',                // Change first name
  lastName: 'Name',                 // Change last name
  role: 'admin'                     // Keep as admin
};
```

---

## 👥 Creating Multiple Admins

To create additional admin users:

### Option 1: Use the Script
1. Edit `server/scripts/createAdmin.js`
2. Change the email address
3. Run `npm run create-admin`

### Option 2: Promote Existing User
```sql
-- Upgrade any user to admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

### Option 3: Through Admin Portal
1. Login as admin
2. Go to Users page
3. Find the user
4. Click "Change Role"
5. Select "Administrator"

---

## 🎭 User Roles Explained

### Admin
- ✅ Full system access
- ✅ User management (all actions)
- ✅ Resource approval/rejection
- ✅ Programs and courses CRUD
- ✅ Analytics and reports
- ✅ System settings
- ✅ Delete operations

### Class Rep
- ✅ Dashboard access
- ✅ User activation/deactivation
- ✅ Resource approval/rejection
- ✅ Analytics and reports
- ❌ Can't change user roles
- ❌ Can't manage programs/courses
- ❌ Can't delete resources
- ❌ Limited settings access

### Student
- ✅ Browse and download resources
- ✅ Upload resources (pending approval)
- ✅ Manage own uploads
- ❌ No admin portal access
- ❌ No approval permissions

---

## 📊 Verify Admin Created

### Check in Database
```sql
SELECT id, email, first_name, last_name, role, is_active 
FROM users 
WHERE role = 'admin';
```

### Check via API
```bash
# Login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mutstudy.ac.za","password":"Admin@123"}'
```

Should return:
```json
{
  "status": "success",
  "data": {
    "user": {
      "role": "admin",
      ...
    },
    "token": "..."
  }
}
```

---

## 🔄 After Creating Admin

### Next Steps

1. **Test Login**
   - Go to http://localhost:5174/login
   - Use admin credentials
   - Verify access to all features

2. **Change Password**
   - Go to Settings → My Profile
   - Update password to secure one
   - Logout and login again

3. **Create Class Reps** (if needed)
   - Register users normally
   - Login as admin
   - Change their role to "class_rep"

4. **Configure System**
   - Go to Settings page
   - Configure notifications
   - Set approval workflow
   - Adjust file upload limits

---

## 📝 Script Output Example

```
🔧 Creating admin user...

✅ Admin user created successfully!

═══════════════════════════════════════
📋 ADMIN CREDENTIALS
═══════════════════════════════════════
📧 Email: admin@mutstudy.ac.za
🔐 Password: Admin@123
👤 Name: System Administrator
🎭 Role: admin
🆔 User ID: 1
═══════════════════════════════════════

⚠️  IMPORTANT: Change this password after first login!
🔗 Admin Portal: http://localhost:5174
🔗 Main Portal: http://localhost:5173

✅ Script completed successfully!
```

---

## 🆘 Need Help?

### Common Issues

**Q: Can't login with admin credentials?**
- Check email spelling (exact match required)
- Verify password (case-sensitive)
- Ensure user is active (`is_active = true`)
- Check server is running

**Q: Login successful but no admin features?**
- Verify role is exactly 'admin' (not 'Admin')
- Check in admin portal (port 5174)
- Clear browser cache
- Check user.role in localStorage

**Q: Want to reset everything?**
```bash
# Delete all users and start fresh
npm run db:init
npm run create-admin
```

---

## 📅 Date Created
December 2024

## ✅ Status
Ready to use

## 🎯 Quick Command
```bash
cd server && npm run create-admin
```
