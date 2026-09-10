# 🚀 Production Quick Start

## One-Command Production Test

```powershell
.\start-production.ps1
```

This will:
1. ✅ Build the client
2. ✅ Start the server in production mode
3. ✅ Serve both client and API on port 5000

## Access

```
http://localhost:5000
```

## Before You Start

Make sure you have:
- ✅ Node.js installed
- ✅ PostgreSQL running
- ✅ Dependencies installed (`npm install` in both client and server)
- ✅ Environment variables configured (`.env` files)

## Production Mode Checklist

```powershell
# 1. Test setup (optional but recommended)
.\test-production-setup.ps1

# 2. Build and start
.\start-production.ps1

# 3. Verify
# Open: http://localhost:5000
# Check: http://localhost:5000/api/health
```

## Enable Production Mode

Edit `server/.env`:
```env
NODE_ENV=production
```

## Architecture

```
┌────────────────────────────────────┐
│    http://localhost:5000           │
│                                    │
│    Express Server                  │
│    ┌──────────┐   ┌────────────┐  │
│    │  Client  │   │    API     │  │
│    │  (React) │   │  /api/*    │  │
│    │  Static  │   │  Routes    │  │
│    └──────────┘   └────────────┘  │
└────────────────────────────────────┘
```

## Manual Steps

```powershell
# Build client
cd client
npm run build

# Start server (make sure NODE_ENV=production in .env)
cd ../server
node server.js
```

## Documentation

- **Full Deployment Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Setup Summary**: See [PRODUCTION_SETUP_SUMMARY.md](./PRODUCTION_SETUP_SUMMARY.md)
- **Installation**: See [INSTALLATION.md](./INSTALLATION.md)

## Troubleshooting

**Issue**: Can't access localhost:5000
- Check if server is running
- Check `NODE_ENV=production` in server/.env
- Check if client was built (client/dist folder exists)

**Issue**: API returns 404
- Check if API routes are registered before catch-all route
- Check server logs for errors

**Issue**: Page blank or assets not loading
- Rebuild client: `cd client && npm run build`
- Check browser console for errors
- Check `base: '/'` in vite.config.js

**Need Help?**
- Run: `.\test-production-setup.ps1`
- Check: Server console logs
- Visit: http://localhost:5000/api/health

---

**Last Updated**: 2026-09-09
