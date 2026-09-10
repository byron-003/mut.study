# Fix CORS Error - Admin to Backend

## Current Error

```
Access to XMLHttpRequest at 'https://mut-study.onrender.com/api/auth/login' 
from origin 'https://admin-mutstudy.onrender.com' has been blocked by CORS policy
```

**Good News**: Admin is now connecting to the correct backend URL! ✅
**Issue**: Backend CORS doesn't allow requests from admin URL

---

## Solution: Update Backend CORS Configuration

### Option 1: Update in Render Dashboard (Quick)

1. **Go to**: https://dashboard.render.com
2. **Select**: Your backend service (`mut-study`)
3. **Click**: **"Environment"** tab
4. **Update or Add** these variables:
   ```
   ADMIN_URL=https://admin-mutstudy.onrender.com
   CLIENT_URL=https://mut-study.onrender.com
   ```

5. **Save Changes**
6. **Wait**: Service will automatically redeploy

### Option 2: Update Code and Redeploy

The CORS configuration has been fixed in `server/server.js`:

```javascript
app.use(cors({
  origin: [
    'https://admin-mutstudy.onrender.com',  // ✅ Admin URL
    'https://mut-study.onrender.com',       // ✅ Main app URL
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
```

**Commit and Push**:
```bash
git add server/server.js server/.env
git commit -m "Fix CORS - add admin URL to allowed origins"
git push
```

Render will automatically redeploy.

---

## Verification

After the backend redeploys:

1. **Open**: https://admin-mutstudy.onrender.com
2. **Open DevTools**: F12 → Console
3. **Try Login**: Should work now!
4. **Check**: No CORS errors in console

---

## What Was Fixed

### Before ❌
```javascript
// Old CORS config (broken syntax)
origin: [
  'http://localhost:5173, https://admin-mutstudy.onrender.com',  // ❌ Wrong
  'https://admin-mutstudy.onrender.com,'                         // ❌ Extra comma
]
```

### After ✅
```javascript
// New CORS config (correct)
origin: [
  'https://admin-mutstudy.onrender.com',  // ✅ Admin URL
  'https://mut-study.onrender.com',       // ✅ Main app URL
  // ... other URLs
]
```

---

## Expected Behavior After Fix

### Before Fix ❌
```
1. Admin sends request to backend
2. Backend rejects (CORS error)
3. Login fails
```

### After Fix ✅
```
1. Admin sends request to backend
2. Backend accepts (CORS allows admin URL)
3. Login succeeds (or 401 if wrong credentials)
```

---

## Troubleshooting

### Still Getting CORS Error?

**Check**:
1. Backend environment variables are set correctly
2. Backend has redeployed after changes
3. Clear browser cache (Ctrl+Shift+R)
4. Check backend logs in Render

### Getting 401 Unauthorized?

**Good Sign!** CORS is fixed, but credentials are wrong.

**Fix**: Use correct admin credentials from your database

### Getting 404 Not Found?

**Check**:
1. Backend is actually deployed and running
2. Health check works: `https://mut-study.onrender.com/api/health`
3. Routes are set up correctly

---

## Quick Checklist

### Backend Environment Variables

In Render Dashboard → Backend Service → Environment:

```env
✅ ADMIN_URL=https://admin-mutstudy.onrender.com
✅ CLIENT_URL=https://mut-study.onrender.com
✅ NODE_ENV=production
✅ DATABASE_URL=postgresql://...
✅ JWT_SECRET=your-secret
✅ CLOUDINARY_*=your-credentials
```

### Admin Environment Variables

In Render Dashboard → Admin Service → Environment:

```env
✅ VITE_API_URL=https://mut-study.onrender.com/api
```

---

## Testing CORS

### Test 1: Health Check
```bash
curl https://mut-study.onrender.com/api/health
```
Should return JSON with `"status": "ok"`

### Test 2: CORS Headers
```bash
curl -I -X OPTIONS \
  -H "Origin: https://admin-mutstudy.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  https://mut-study.onrender.com/api/auth/login
```

Should include:
```
Access-Control-Allow-Origin: https://admin-mutstudy.onrender.com
Access-Control-Allow-Credentials: true
```

### Test 3: Admin Login

1. Open admin site
2. Enter credentials
3. Should login successfully (or show proper error message)

---

## Summary

**Issue**: CORS blocking admin requests
**Cause**: Backend CORS config had syntax errors and didn't include admin URL
**Fix**: Updated CORS configuration to properly allow admin URL
**Action**: Update environment variables in Render and redeploy

---

**Next Step**: Update `ADMIN_URL` in Render backend environment variables NOW! 🚀
