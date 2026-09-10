# Admin Portal CORS Fix

## Issue
Admin portal login failed with CORS error:
```
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/login' from origin 'http://localhost:5174' 
has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value 
'http://localhost:5173' that is not equal to the supplied origin.
```

## Root Cause
The backend CORS configuration only allowed requests from the main client app (`http://localhost:5173`), but the admin portal runs on a different port (`http://localhost:5174`).

## Solution
Updated CORS configuration to allow requests from both applications.

---

## Changes Made

### 1. Backend CORS Configuration
**File**: `server/server.js`

**Before**:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
```

**After**:
```javascript
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174'
  ],
  credentials: true
}));
```

### 2. Environment Variables
**File**: `server/.env`

Added:
```
ADMIN_URL=http://localhost:5174
```

---

## Allowed Origins

The backend now accepts requests from:
1. **Main Client App**: `http://localhost:5173`
2. **Admin Portal**: `http://localhost:5174`

Both applications can:
- Login/Logout
- Make API requests
- Use authentication tokens
- Access protected routes

---

## Restart Required

**IMPORTANT**: You must restart the backend server for CORS changes to take effect:

```bash
# Stop the server (Ctrl+C in the server terminal)
# Then restart:
cd server
npm start
```

---

## Testing Steps

After restarting the server:

1. **Test Main Client App** (http://localhost:5173):
   - [ ] Login works
   - [ ] Dashboard loads
   - [ ] Upload works
   - [ ] Search works

2. **Test Admin Portal** (http://localhost:5174):
   - [ ] Login works (admin or class_rep)
   - [ ] Dashboard loads
   - [ ] User management works
   - [ ] Resource approval works

---

## Production Deployment

For production, update `.env` with actual domains:

```bash
CLIENT_URL=https://mutstudyhub.com
ADMIN_URL=https://admin.mutstudyhub.com
```

Or if both are on same domain with different paths:
```bash
CLIENT_URL=https://mutstudyhub.com
ADMIN_URL=https://mutstudyhub.com
```

Then update CORS to match your deployment setup.

---

## Security Notes

### Development
- CORS allows localhost on both ports 5173 and 5174
- Credentials enabled for cookie-based auth
- Safe for local development

### Production
- Update CORS origins to match your actual domains
- Consider using environment-specific configuration
- Never allow `*` (wildcard) with credentials enabled
- Use HTTPS in production

---

## Alternative: Nginx Reverse Proxy

If deploying both apps on same domain:

```nginx
# Main app
location / {
    proxy_pass http://localhost:5173;
}

# Admin portal
location /admin {
    proxy_pass http://localhost:5174;
}

# API
location /api {
    proxy_pass http://localhost:5000;
}
```

Then you only need one CORS origin: your domain.

---

## Troubleshooting

### Still seeing CORS error after restart?

1. **Check server restarted**: Look for "Server is running" message
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
3. **Check .env file**: Ensure ADMIN_URL is set correctly
4. **Check server logs**: Look for any startup errors

### CORS error in production?

1. **Verify environment variables**: Check actual production domains
2. **Check HTTPS**: Both client and server should use HTTPS
3. **Check firewall**: Ensure ports are open
4. **Check domain spelling**: Typos will cause CORS errors

---

## Date
December 2024

## Status
✅ Complete - Ready for testing after server restart
