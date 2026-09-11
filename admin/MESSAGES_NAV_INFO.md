# Messages Navigation - Admin Panel

## Current Status

✅ **Messages Page**: Exists at `/messages`
✅ **Navigation Link**: Defined in sidebar
✅ **Icon**: Mail icon included
❓ **Visibility**: Only shows for users with `role = 'admin'`

---

## Why Messages Might Not Be Visible

### Reason 1: User Role is Not 'admin'

The Messages link only shows when:
```javascript
user.role === 'admin'  // Must be exactly 'admin'
```

If your role is:
- `'class_rep'` → Messages is hidden
- `'student'` → Messages is hidden
- `'admin'` → Messages is visible ✅

### Reason 2: Not Logged In Properly

If authentication failed or token expired, navigation won't show correctly.

---

## How to Check Your Role

### Option 1: Browser Console

1. Open admin panel
2. Press F12 → Console tab
3. Run:
```javascript
console.log(localStorage.getItem('admin_user'));
```

Look for `"role":"admin"` in the output.

### Option 2: Check Database

Query your database:
```sql
SELECT id, email, role, first_name, last_name 
FROM users 
WHERE email = 'your-admin-email@example.com';
```

Role should be `'admin'`.

---

## Fix Options

### Option 1: Make Messages Visible to Class Reps

If you want class reps to also see Messages:

**Edit `admin/src/components/Layout.jsx`:**

Find line 25:
```javascript
{ name: 'Messages', path: '/messages', icon: Mail, allowClassRep: false },
```

Change to:
```javascript
{ name: 'Messages', path: '/messages', icon: Mail, allowClassRep: true },
```

### Option 2: Verify User is Admin

Check your admin user in the database:

```sql
-- Check current role
SELECT email, role FROM users WHERE email = 'your-email@example.com';

-- Update to admin if needed
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Option 3: Create Admin User

If you don't have an admin user yet:

```sql
-- Update existing user to admin
UPDATE users 
SET role = 'admin' 
WHERE id = 1;  -- Replace with your user ID

-- Or create new admin user
INSERT INTO users (
  email, password_hash, first_name, last_name, 
  role, is_active, email_verified
) VALUES (
  'admin@mut.ac.ke',
  '$2b$10$...', -- Password hash from bcrypt
  'Admin',
  'User',
  'admin',
  true,
  true
);
```

---

## Navigation Structure

Current sidebar shows based on role:

### Admin Users See:
✅ Dashboard
✅ Users
✅ Resources
✅ **Messages** ← Here!
✅ Programs
✅ Courses
✅ Analytics
✅ Reports
✅ Settings

### Class Rep Users See:
✅ Dashboard
✅ Users
✅ Resources
❌ Messages (hidden)
❌ Programs (hidden)
❌ Courses (hidden)
✅ Analytics
✅ Reports
❌ Settings (hidden)

---

## Quick Test

### Test 1: Check Navigation Code

The Messages nav item is defined in `admin/src/components/Layout.jsx` line 25:

```javascript
{ 
  name: 'Messages', 
  path: '/messages', 
  icon: Mail, 
  allowClassRep: false  // ← Only admins
}
```

### Test 2: Direct URL Access

Try accessing directly:
```
https://admin-mutstudy.onrender.com/messages
```

**Expected**:
- If admin: Shows Messages page
- If class rep: Redirects to dashboard
- If not logged in: Redirects to login

### Test 3: Check Browser Console

Open DevTools → Console:
```javascript
// Check auth context
console.log('User:', JSON.parse(localStorage.getItem('admin_user')));
console.log('Is Admin:', JSON.parse(localStorage.getItem('admin_user'))?.role === 'admin');
```

---

## What the Messages Page Does

The Messages page shows:
- 📧 Contact form submissions from users
- 📊 Message statistics (unread, read, replied)
- 👁️ View full message details
- ✉️ Reply to messages
- 🗑️ Delete or archive messages

---

## Troubleshooting

### Issue: Logged in but Messages not showing

**Check**:
1. User role in database is `'admin'`
2. Not `'Admin'`, `'ADMIN'`, or `'administrator'`
3. Must be exactly: `'admin'` (lowercase)

**Fix**: Update database role to exactly `'admin'`

### Issue: Getting 403 Forbidden on /messages

**Cause**: User is not admin

**Fix**: 
- Update user role to admin in database
- OR change `allowClassRep: true` in Layout.jsx

### Issue: Page loads but shows empty

**Check**:
1. Backend contact routes are deployed
2. Database has contact_messages table
3. API endpoint works: `/api/contact/messages`

---

## Summary

**Messages Nav Item**: ✅ Exists
**Visible To**: Admins only (role = 'admin')
**Location**: Admin sidebar
**Route**: `/messages`

**To See Messages**:
1. Ensure user role is exactly `'admin'` (lowercase)
2. Log out and log back in
3. Messages should appear in sidebar

**To Allow Class Reps**:
1. Edit `Layout.jsx` line 25
2. Change `allowClassRep: false` to `allowClassRep: true`
3. Rebuild and redeploy

---

**Quick Fix**: Check your database user role is `'admin'` (not `'Admin'` or anything else)!
