# Fix: Admin API Connection Error

## Current Issue

```
POST http://localhost:5000/api/auth/login net::ERR_CONNECTION_REFUSED
```

**Problem**: Admin is trying to connect to `localhost:5000` instead of your production backend.

**Cause**: Environment variable `VITE_API_URL` was not set during build.

---

## Solution (Choose One)

### Option 1: Set Environment Variable in Render (Recommended)

1. **Go to Render Dashboard**
   - Navigate to your admin static site: https://dashboard.render.com
   - Select your admin service

2. **Add Environment Variable**
   - Click **"Environment"** tab (left sidebar)
   - Click **"Add Environment Variable"**
   - Add:
     ```
     Key: VITE_API_URL
     Value: https://your-backend-app.onrender.com/api
     ```
   - **Important**: Replace with your actual backend URL!

3. **Trigger Rebuild**
   - Go to **"Deploys"** tab
   - Click **"Manual Deploy"** → **"Clear build cache & deploy"**
   - Wait for build to complete

4. **Verify**
   - Open https://admin-mutstudy.onrender.com
   - Open browser DevTools (F12) → Console
   - Should see API calls to your backend URL, not localhost

---

### Option 2: Update .env.production and Redeploy

1. **Update `.env.production`**
   
   Open `admin/.env.production` and change:
   ```env
   VITE_API_URL=https://your-backend-app.onrender.com/api
   ```

2. **Commit and Push**
   ```bash
   cd admin
   git add .env.production
   git commit -m "Set production API URL"
   git push
   ```

3. **Render Auto-Deploys**
   - Render will automatically rebuild with the new environment variable

---

## Finding Your Backend URL

### If Your Backend is on Render

1. Go to Render Dashboard
2. Find your backend web service (e.g., "mut-study-hub")
3. Copy the URL (looks like: `https://mut-study-hub-xyz123.onrender.com`)
4. Add `/api` at the end

**Example**:
```
Backend URL: https://mut-study-hub-xyz123.onrender.com
API URL: https://mut-study-hub-xyz123.onrender.com/api
```

### If Your Backend is Elsewhere

Use your backend's full URL with `/api`:
```
https://yourdomain.com/api
```

---

## Verification Steps

After redeploying:

### 1. Check Environment Variable

In the built app, it should use your production URL. You can verify by:
- Open admin site
- Open DevTools → Console
- Try to login
- Check Network tab - requests should go to your backend URL

### 2. Check CORS

If you get CORS errors instead, you need to add the admin URL to your backend CORS configuration.

**In `server/server.js`**:
```javascript
app.use(cors({
  origin: [
    'https://admin-mutstudy.onrender.com',  // Add this
    'https://your-main-app.onrender.com',
    process.env.CLIENT_URL,
    process.env.ADMIN_URL
  ],
  credentials: true
}));
```

**Or update `server/.env`**:
```env
ADMIN_URL=https://admin-mutstudy.onrender.com
```

---

## Quick Fix Summary

### Immediate Fix (No Code Changes)

1. **Render Dashboard** → Admin Static Site → **Environment**
2. **Add**:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
3. **Clear cache & deploy**
4. **Done!** ✅

### Permanent Fix (With Code)

1. **Update** `admin/.env.production` with production URL
2. **Commit and push**
3. **Render auto-deploys**
4. **Done!** ✅

---

## Testing Locally with Production API

To test locally against production API:

```bash
cd admin
npm run dev
```

Then manually set in browser console:
```javascript
localStorage.setItem('VITE_API_URL', 'https://your-backend.onrender.com/api');
```

Or create `.env.local`:
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Troubleshooting

### Still Getting localhost?

**Check**:
1. Environment variable is saved in Render
2. Build was triggered AFTER adding the variable
3. Cache was cleared during rebuild
4. Your browser cache is cleared (Ctrl+Shift+R)

### CORS Error Instead?

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Fix**: Add admin URL to backend CORS:
```javascript
// server/server.js
origin: ['https://admin-mutstudy.onrender.com', ...]
```

### 401 Unauthorized?

**Fix**: Check admin credentials are correct for production database

### 404 Not Found?

**Fix**: Ensure backend routes are correct and deployed

---

## Environment Files Explained

### `.env` (Development)
```env
VITE_API_URL=http://localhost:5000/api
```
Used when: Running `npm run dev` locally

### `.env.production` (Production)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```
Used when: Running `npm run build` for production

### Render Environment Variables
```
VITE_API_URL=https://your-backend.onrender.com/api
```
Used when: Render builds your app
**Priority**: Overrides `.env.production`

---

## Expected Behavior After Fix

### Before Fix ❌
```
POST http://localhost:5000/api/auth/login
❌ net::ERR_CONNECTION_REFUSED
```

### After Fix ✅
```
POST https://your-backend.onrender.com/api/auth/login
✅ 200 OK (or 401 if credentials wrong)
```

---

**Quick Action**: Go to Render Dashboard → Admin → Environment → Add `VITE_API_URL` → Rebuild!
