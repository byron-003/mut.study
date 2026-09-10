# Admin Deployment Checklist

## Current Status

✅ **Admin Deployed**: https://admin-mutstudy.onrender.com
❌ **API Connection**: Trying to connect to localhost instead of production

---

## Fix Steps (Do This Now!)

### Step 1: Find Your Backend URL

Go to your Render Dashboard and find your backend service.

**Possible names**:
- mut-study-hub
- mutstudy-backend
- mut-study-hub-server

**URL format**: `https://[service-name].onrender.com`

**Example**: `https://mut-study-hub-abc123.onrender.com`

### Step 2: Add Environment Variable

1. **Go to**: https://dashboard.render.com
2. **Select**: Your admin static site (admin-mutstudy)
3. **Click**: "Environment" (left sidebar)
4. **Click**: "Add Environment Variable"
5. **Add**:
   ```
   Key: VITE_API_URL
   Value: https://[YOUR-BACKEND-URL].onrender.com/api
   ```
   
   **Example**:
   ```
   Key: VITE_API_URL
   Value: https://mut-study-hub-abc123.onrender.com/api
   ```

6. **Click**: "Save"

### Step 3: Clear Cache & Rebuild

1. **Click**: "Deploys" tab
2. **Click**: "Manual Deploy"
3. **Select**: "Clear build cache & deploy"
4. **Wait**: For build to complete (~2-3 minutes)

### Step 4: Verify

1. **Open**: https://admin-mutstudy.onrender.com
2. **Open DevTools**: Press F12
3. **Go to Network tab**
4. **Try to login**
5. **Check**: Request URL should be your backend, not localhost

---

## Complete Deployment Checklist

### Backend (Main App)

- [ ] Backend deployed to Render
- [ ] Database created and connected
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` or DB credentials
  - [ ] `JWT_SECRET`
  - [ ] `CLOUDINARY_*` credentials
  - [ ] `ADMIN_URL=https://admin-mutstudy.onrender.com`
- [ ] Database migrations run
- [ ] API health check works: `/api/health`
- [ ] CORS configured to allow admin URL

### Admin Panel

- [ ] Admin deployed as static site
- [ ] Environment variable `VITE_API_URL` set
- [ ] Build completed successfully
- [ ] Admin site loads
- [ ] Login connects to backend (not localhost)
- [ ] Dashboard loads data

### CORS Configuration

Your backend `server.js` should have:

```javascript
app.use(cors({
  origin: [
    'https://admin-mutstudy.onrender.com',  // ← Must include this
    'https://your-main-app.onrender.com',
    process.env.CLIENT_URL,
    process.env.ADMIN_URL
  ],
  credentials: true
}));
```

Or in `server/.env`:
```env
ADMIN_URL=https://admin-mutstudy.onrender.com
CLIENT_URL=https://your-main-app.onrender.com
```

---

## Testing the Fix

### Test 1: API Connection

1. Open https://admin-mutstudy.onrender.com
2. Open DevTools (F12) → Network tab
3. Try to login
4. **Expected**: See request to `https://your-backend.onrender.com/api/auth/login`
5. **Not**: `http://localhost:5000/api/auth/login`

### Test 2: Login Success

1. Enter valid admin credentials
2. **Expected**: Redirect to dashboard
3. **Expected**: Dashboard shows statistics

### Test 3: Data Loading

1. Navigate to different pages
2. **Expected**: Resources, users, courses load
3. **Expected**: No localhost errors in console

---

## Common Issues

### Issue 1: Still Seeing localhost?

**Causes**:
- Environment variable not set
- Build not triggered after setting variable
- Browser cache

**Fix**:
1. Verify environment variable is set in Render
2. Clear build cache and redeploy
3. Hard refresh browser (Ctrl+Shift+R)

### Issue 2: CORS Error

```
Access-Control-Allow-Origin error
```

**Fix**: Add admin URL to backend CORS (see CORS Configuration above)

### Issue 3: 401 Unauthorized

**Causes**:
- Wrong credentials
- Backend database doesn't have admin user
- JWT secret mismatch

**Fix**: Check backend logs, verify admin user exists in database

### Issue 4: 404 Not Found

**Causes**:
- Backend URL is wrong
- Backend not deployed
- API routes not set up

**Fix**: Verify backend URL is correct and health check works

---

## URLs Reference

### Local Development
```
Backend: http://localhost:5000
Admin: http://localhost:5174
```

### Production
```
Backend: https://[your-backend].onrender.com
Admin: https://admin-mutstudy.onrender.com
API Endpoint: https://[your-backend].onrender.com/api
```

---

## Next Steps After Fix

1. ✅ Verify admin can login
2. ✅ Test all admin features
3. ✅ Deploy main client app
4. ✅ Test complete workflow
5. ✅ Set up custom domain (optional)
6. ✅ Enable monitoring

---

## Quick Commands

### Check API Health
```bash
curl https://your-backend.onrender.com/api/health
```

### Check Admin Environment
Open browser console on admin site:
```javascript
// Check what API URL is being used
console.log('API URL:', import.meta.env.VITE_API_URL);
```

---

**Priority Action**: Add `VITE_API_URL` environment variable in Render NOW! 🚀

**Admin URL**: https://admin-mutstudy.onrender.com
**Needs**: Your backend API URL
