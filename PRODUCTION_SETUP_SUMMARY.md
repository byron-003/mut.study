# Production Setup Summary

## What Changed

Your MUT Study Hub is now configured to serve the client from the same server in production mode!

## Quick Start (Local Production Test)

```powershell
# 1. Test your setup
.\test-production-setup.ps1

# 2. Build and start
.\start-production.ps1
```

Then visit: **http://localhost:5000**

## Files Modified

### 1. `server/server.js`
- ✅ Added `path` and `fileURLToPath` imports
- ✅ Added static file serving for `client/dist` (production only)
- ✅ Added catch-all route to serve `index.html` for React Router
- ✅ Both changes are enabled only when `NODE_ENV=production`

### 2. `client/vite.config.js`
- ✅ Added build configuration
- ✅ Set output directory to `dist`
- ✅ Added Socket.IO proxy for WebSocket support
- ✅ Set base path to `/` for proper asset loading

### 3. `client/.env`
- ✅ Added comment explaining dev vs prod URLs

### 4. `client/.env.production` (NEW)
- ✅ Sets `VITE_API_URL=/api` for production (relative path)

## Files Created

### 1. `DEPLOYMENT_GUIDE.md`
Comprehensive deployment guide covering:
- Local production testing
- Cloud deployment (VPS, Heroku, Docker)
- Troubleshooting
- Performance optimization
- Security checklist

### 2. `start-production.ps1`
PowerShell script that:
- Builds the client
- Checks environment configuration
- Starts the server in production mode

### 3. `test-production-setup.ps1`
Verification script that checks:
- Client build exists
- Environment files configured correctly
- Server configuration is correct
- Dependencies installed

### 4. `PRODUCTION_SETUP_SUMMARY.md`
This file - quick reference guide

## How It Works

### Development Mode (`NODE_ENV=development`)
```
┌─────────────┐         ┌─────────────┐
│   Vite Dev  │  :5173  │   Express   │  :5000
│   Server    │────────▶│   API       │
│  (Client)   │  Proxy  │  (Server)   │
└─────────────┘         └─────────────┘
```

### Production Mode (`NODE_ENV=production`)
```
┌───────────────────────────────────┐
│        Express Server :5000       │
│                                   │
│  ┌─────────┐      ┌────────────┐ │
│  │ Static  │      │    API     │ │
│  │ Files   │      │  /api/*    │ │
│  │ (Client)│      └────────────┘ │
│  └─────────┘                     │
└───────────────────────────────────┘
```

## Request Routing in Production

| Request | Handler | Response |
|---------|---------|----------|
| `GET /` | Static files | `client/dist/index.html` |
| `GET /dashboard` | Catch-all route | `client/dist/index.html` |
| `GET /assets/main.js` | Static files | `client/dist/assets/main.js` |
| `GET /api/health` | API routes | JSON response |
| `POST /api/auth/login` | API routes | JSON response |

## Testing Checklist

Before deploying:

- [ ] Build client successfully: `cd client && npm run build`
- [ ] Client `dist` folder exists with `index.html`
- [ ] Server `.env` has `NODE_ENV=production`
- [ ] Client `.env.production` has `VITE_API_URL=/api`
- [ ] Server starts without errors
- [ ] Homepage loads at `http://localhost:5000`
- [ ] Login works
- [ ] Navigation works (React Router)
- [ ] API calls work (check Network tab)
- [ ] File uploads work
- [ ] Socket.IO connections work
- [ ] Health check responds: `/api/health`

## Common Issues & Solutions

### Issue: 404 on page refresh
**Solution**: Ensure server has catch-all route and `NODE_ENV=production`

### Issue: API calls return 404
**Solution**: Check `.env.production` has `VITE_API_URL=/api` and rebuild client

### Issue: Assets not loading (CSS/JS)
**Solution**: Check vite.config.js has `base: '/'` and rebuild

### Issue: "Cannot GET /api/health"
**Solution**: Ensure API routes are defined before catch-all route

### Issue: Page loads but blank screen
**Solution**: Check browser console for errors, ensure dist/index.html exists

## Environment Variables

### Development (server/.env)
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Production (server/.env)
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=http://yourdomain.com
```

### Client Development (client/.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Client Production (client/.env.production)
```env
VITE_API_URL=/api
```

## Manual Build & Start Steps

If you prefer manual steps:

```powershell
# 1. Navigate to client directory
cd client

# 2. Build the client
npm run build

# 3. Navigate to server directory
cd ../server

# 4. Ensure NODE_ENV=production in .env

# 5. Start the server
node server.js

# 6. Open browser
# Visit: http://localhost:5000
```

## Verification

After starting:

1. **Check homepage**: `http://localhost:5000` should show the landing page
2. **Check API**: `http://localhost:5000/api/health` should return JSON
3. **Check console**: Should see "Serving client from: ..." message
4. **Test navigation**: Click links, should not reload page (SPA behavior)
5. **Test login**: Should work normally
6. **Check DevTools**: Network tab should show API calls to `/api/*`

## Admin Panel

The admin panel is **NOT** included in this production setup. Deploy it separately:

### Option 1: Deploy to Vercel
```powershell
cd admin
npm install -g vercel
vercel
```

### Option 2: Deploy to Netlify
```powershell
cd admin
npm run build
# Upload dist folder to Netlify
```

### Option 3: Separate Server
Host admin on a different port or domain and update CORS in server/.env:
```env
ADMIN_URL=http://admin.yourdomain.com
```

## Next Steps

1. ✅ Test locally with `.\start-production.ps1`
2. 📖 Read `DEPLOYMENT_GUIDE.md` for cloud deployment
3. 🔒 Review security checklist
4. 🚀 Deploy to your production server
5. 🔍 Monitor with `/api/health` endpoint
6. 📊 Setup logging and monitoring

## Support

- **Local Testing**: Use `test-production-setup.ps1`
- **Troubleshooting**: Check `DEPLOYMENT_GUIDE.md`
- **Logs**: Check console output or `pm2 logs` if using PM2

---

**Status**: ✅ Ready for Production Testing
**Date**: 2026-09-09
