# Testing Advanced Features - Troubleshooting Guide

## Issue: Summarize Button Not Showing

The user has enabled AI summary but the button doesn't appear.

---

## Quick Checks

### 1. Check Browser Console
Open browser DevTools (F12) and look for these logs:

```javascript
// On page load:
✨ Advanced features status: true  // Should be true if enabled

// When opening a file:
🔄 Refreshed advanced features status: true
🎬 FileViewer Props: {
  hasFile: true,
  advancedFeaturesEnabled: true,  // ← Must be true
  isSummarizing: false,
  hasOnSummarize: true,
  hasOnMarkComplete: true
}
```

**If you see `advancedFeaturesEnabled: false`**, the backend isn't returning the correct value.

---

### 2. Check Database Directly

Run this SQL query to verify the user has the feature enabled:

```sql
-- Replace 123 with actual user ID
SELECT id, email, first_name, last_name, advanced_features_enabled 
FROM users 
WHERE id = 123;
```

**Expected Result:**
```
 id  |       email        | first_name | last_name | advanced_features_enabled
-----+-------------------+------------+-----------+--------------------------
 123 | user@example.com  | John       | Doe       | t
```

The `advanced_features_enabled` should show `t` (true).

---

### 3. Check If Migration Ran

Verify the column exists:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'advanced_features_enabled';
```

**Expected Result:**
```
        column_name         | data_type
---------------------------+-----------
 advanced_features_enabled | boolean
```

---

### 4. Test the Backend API

Open browser DevTools → Network tab, then test:

#### Get Settings:
```bash
# In browser console or using curl:
fetch('/api/auth/settings', {
  headers: { 
    'Authorization': 'Bearer YOUR_TOKEN_HERE' 
  }
})
.then(r => r.json())
.then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "advancedFeaturesEnabled": true
  }
}
```

---

## Common Issues & Fixes

### Issue 1: Column Doesn't Exist
**Symptom**: SQL error "column advanced_features_enabled does not exist"

**Fix**:
```sql
-- Run migration manually
\i server/migrations/018_add_user_settings_ai_summaries.sql
```

Or restart the server (migration runs automatically).

---

### Issue 2: User Setting is NULL or FALSE
**Symptom**: Query returns `null` or `f` for advanced_features_enabled

**Fix**:
```sql
-- Update the user's setting
UPDATE users 
SET advanced_features_enabled = true 
WHERE id = 123;  -- Replace with actual user ID
```

Then refresh the page.

---

### Issue 3: Frontend Not Receiving Value
**Symptom**: Backend returns `true` but frontend shows `false`

**Fix**: Clear browser cache and hard refresh:
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

Or check if there's a CORS issue in browser console.

---

### Issue 4: Button Still Not Showing
**Symptom**: Everything looks correct but button is missing

**Check FileViewer Props**:
1. Open file viewer
2. Check browser console for: `🎬 FileViewer Props`
3. Verify all values:
   - `advancedFeaturesEnabled: true` ✓
   - `hasOnSummarize: true` ✓
   - `hasFile: true` ✓

If `hasOnSummarize: false`, check DashboardPage is passing the `onSummarize` prop.

---

## Manual Testing Steps

### 1. Enable Feature
1. Login as a user
2. Go to Settings page (`/settings`)
3. Toggle "Advanced Features" ON
4. Should see: "Advanced features enabled! AI Summarization is now available."

### 2. Verify Backend
```bash
# Check server logs
npm run dev

# Should see on startup:
✅ User settings and AI summaries migration completed!
```

### 3. Test Button Appears
1. Go to Dashboard
2. Open any resource (PDF, DOCX, etc.)
3. Should see TWO buttons:
   - 🔵 "Mark Complete" (blue)
   - 🟣 "Summarize" (purple with sparkles ✨)

### 4. Test Summarization
1. Click "Summarize" button
2. Button should show loading: "Summarizing..."
3. Wait 3-5 seconds
4. Should see success alert
5. Go to "AI Summaries" page
6. Should see the generated summary

---

## Debug SQL Queries

### Check All Users with Advanced Features:
```sql
SELECT id, email, first_name, advanced_features_enabled 
FROM users 
WHERE advanced_features_enabled = true;
```

### Check If ai_summaries Table Exists:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'ai_summaries';
```

### Count Summaries:
```sql
SELECT COUNT(*) as total_summaries 
FROM ai_summaries;
```

---

## Quick Fix Script

If migration didn't run, execute this:

```sql
-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'advanced_features_enabled'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN advanced_features_enabled BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Enable for a specific user (replace email)
UPDATE users 
SET advanced_features_enabled = true 
WHERE email = 'user@example.com';

-- Verify
SELECT id, email, advanced_features_enabled 
FROM users 
WHERE email = 'user@example.com';
```

---

## Expected Browser Console Output

When everything is working:

```
✨ Advanced features status: true
🔄 Refreshed advanced features status: true
🎬 FileViewer Props: {
  hasFile: true,
  advancedFeaturesEnabled: true,
  isSummarizing: false,
  hasOnSummarize: true,
  hasOnMarkComplete: true
}
```

---

## Still Not Working?

1. **Restart the server**: `npm run dev` in server directory
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
3. **Check for JavaScript errors**: Open browser console
4. **Verify Gemini API key**: Check `server/.env` has valid key
5. **Check user is logged in**: Verify token exists in localStorage

---

## Contact for Help

If issue persists, provide:
1. Screenshot of browser console (with logs)
2. Result of SQL query: `SELECT id, email, advanced_features_enabled FROM users WHERE id = YOUR_ID;`
3. Server startup logs
4. Network tab showing `/api/auth/settings` request/response

---

**Last Updated**: 2026-09-09
