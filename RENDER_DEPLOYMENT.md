# Render Deployment Guide for MUT Study Hub

This guide explains how to deploy MUT Study Hub on Render with the client served from the same server.

## Prerequisites

- GitHub repository with your code
- Render account ([Sign up free](https://render.com))
- PostgreSQL database (Render provides free PostgreSQL)
- Cloudinary account for file uploads

---

## Quick Deploy

### Option 1: Using render.yaml (Recommended)

1. **Push `render.yaml` to your repository**
   ```bash
   git add render.yaml package.json
   git commit -m "Add Render configuration"
   git push
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`
   - Click **"Apply"**

3. **Add Environment Variables** (see section below)

### Option 2: Manual Setup

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select the repository

2. **Configure Build Settings**
   ```
   Name: mut-study-hub
   Region: Oregon (US West) or nearest to you
   Branch: main
   Root Directory: (leave blank)
   Environment: Node
   Build Command: npm run build
   Start Command: npm start
   ```

3. **Add Environment Variables** (see section below)

4. **Create**

---

## Environment Variables

In your Render service dashboard, add these environment variables:

### Required Variables

```env
NODE_ENV=production
PORT=10000

# Database (use your Render PostgreSQL or external DB)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=mut_study_hub
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true

# JWT
JWT_SECRET=your-super-secure-random-secret-here-change-this
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_FOLDER=mut_study_hub_docs

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com

# URLs (update after deployment)
CLIENT_URL=https://your-app-name.onrender.com
ADMIN_URL=https://your-admin-url.com

# File Upload
MAX_FILE_SIZE=52428800
```

### How to Add Environment Variables in Render

1. Go to your service dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable one by one
5. Click **"Save Changes"**

---

## Database Setup

### Option 1: Render PostgreSQL (Free Tier)

1. **Create PostgreSQL Database**
   - In Render Dashboard, click **"New +"** → **"PostgreSQL"**
   - Name: `mut-study-hub-db`
   - Region: Same as your web service
   - Plan: **Free**
   - Create

2. **Get Connection Details**
   - Go to your database dashboard
   - Copy **Internal Database URL**
   - This URL includes host, port, database, user, and password

3. **Add to Web Service**
   - Go to your web service dashboard
   - Environment tab
   - Add `DATABASE_URL` with the internal database URL
   - **OR** add individual variables (DB_HOST, DB_PORT, etc.)

4. **Run Migrations**
   - After first deploy, use Render Shell:
   - In service dashboard → **"Shell"** tab
   - Run:
     ```bash
     cd server
     node migrations/001_init.js
     node migrations/002_courses.js
     # ... run all your migration files
     ```

### Option 2: External Database (Aiven, etc.)

Use your existing database credentials in the environment variables.

---

## Build Process Explained

The build process in `package.json`:

```json
"scripts": {
  "build": "npm run install:all && npm run build:client"
}
```

**What happens**:
1. `npm run install:all` → Installs dependencies for both server and client
2. `npm run build:client` → Builds the React client to `client/dist`
3. Server serves the built client files from `client/dist`

---

## Deployment Steps Summary

### First Time Deployment

1. ✅ Push code to GitHub (with render.yaml and package.json)
2. ✅ Create Render Web Service (or use Blueprint)
3. ✅ Create PostgreSQL database on Render
4. ✅ Add all environment variables
5. ✅ Deploy (automatic)
6. ✅ Run database migrations via Shell
7. ✅ Test the deployment

### Subsequent Deployments

- Just push to GitHub
- Render automatically rebuilds and deploys
- Zero downtime deployments

---

## Troubleshooting

### Build Failed: "vite: not found"

**Cause**: Dependencies not installed before build

**Fix**: Ensure your build command is:
```bash
npm run build
```

This runs the root package.json script which installs dependencies first.

### Build Failed: "Cannot find module"

**Cause**: Missing dependencies

**Fix**: 
1. Check `package.json` in both client and server
2. Run locally: `npm run build` to test
3. Make sure all dependencies are in `dependencies`, not `devDependencies`

### Database Connection Failed

**Cause**: Wrong database credentials or SSL settings

**Fix**:
1. Check environment variables are correct
2. For Render PostgreSQL, use **Internal Database URL**
3. Set `DB_SSL=true`
4. Check firewall/network rules

### Static Files Not Loading

**Cause**: Build didn't complete or wrong path

**Fix**:
1. Check build logs - should see "Building for production"
2. Verify `client/dist` folder is created
3. Check `server.js` static file serving code
4. Ensure `NODE_ENV=production`

### 404 on Page Refresh

**Cause**: Server not serving index.html for client routes

**Fix**: Ensure this code is in `server.js`:
```javascript
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}
```

---

## Performance Tips

### 1. Enable Compression

In `server.js`, add:
```javascript
import compression from 'compression';
app.use(compression());
```

Install:
```bash
cd server
npm install compression
```

### 2. Use Render CDN

Render automatically serves your app through their CDN.

### 3. Health Check Endpoint

Already implemented at `/api/health`. Render uses this to monitor your service.

### 4. Database Connection Pooling

Already configured in your database config.

---

## Monitoring

### Render Dashboard

- **Logs**: View real-time logs
- **Metrics**: CPU, Memory, Response time
- **Events**: Deploy history
- **Shell**: Access server terminal

### Health Check

Your app has a health check endpoint:
```
https://your-app.onrender.com/api/health
```

Returns:
```json
{
  "status": "ok",
  "database": { "connected": true },
  "websocket": { "connected": true }
}
```

---

## Custom Domain

1. **Buy domain** (Namecheap, GoDaddy, etc.)
2. **In Render Dashboard**:
   - Go to your service
   - Click **"Settings"** → **"Custom Domain"**
   - Add your domain
   - Follow DNS configuration instructions
3. **Update environment variables**:
   ```env
   CLIENT_URL=https://yourdomain.com
   ```

---

## Scaling

### Free Tier Limitations

- 750 hours/month (enough for one app running 24/7)
- Spins down after 15 minutes of inactivity
- 512 MB RAM
- Shared CPU

### Paid Plans

- **Starter ($7/month)**: No spin down, more resources
- **Standard ($25/month)**: More RAM/CPU, autoscaling
- **Pro**: Custom needs

---

## CI/CD Pipeline

Render automatically:
1. Detects new commits to `main` branch
2. Runs build command
3. Deploys if build succeeds
4. Rolls back if deploy fails

### Branch Deploys

Create preview environments:
1. Go to service settings
2. Enable **"Preview Environments"**
3. Each PR gets its own URL

---

## Backup Strategy

### Database Backups

**Render Free Tier**: No automatic backups

**Solutions**:
1. Upgrade to paid PostgreSQL plan ($7/month) - daily backups
2. Manual backups via pg_dump:
   ```bash
   # In Render Shell
   pg_dump $DATABASE_URL > backup.sql
   ```
3. Use external backup service

### File Backups

Files are on Cloudinary - already backed up and redundant.

---

## Migration from Other Platforms

### From Heroku

1. Export Heroku config: `heroku config`
2. Add to Render environment variables
3. Migrate database using `pg_dump`/`pg_restore`
4. Update DNS

### From Vercel/Netlify

Your app can't fully deploy there (need Node.js server). Render is the right choice.

---

## Cost Estimate

### Free Tier Setup
- Web Service: **Free**
- PostgreSQL: **Free** (1GB storage, no backups)
- **Total: $0/month**

### Production Setup
- Web Service: **$7/month** (Starter, no spin down)
- PostgreSQL: **$7/month** (daily backups, 10GB)
- **Total: $14/month**

---

## Security Checklist

- [ ] Use strong `JWT_SECRET` (random 32+ characters)
- [ ] Enable SSL/HTTPS (automatic on Render)
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables for all secrets
- [ ] Enable database SSL (`DB_SSL=true`)
- [ ] Keep dependencies updated
- [ ] Review Cloudinary security settings
- [ ] Set up proper CORS origins
- [ ] Enable rate limiting (already implemented)
- [ ] Regular database backups

---

## Support

### Render Support
- [Documentation](https://render.com/docs)
- [Community Forum](https://community.render.com)
- [Status Page](https://status.render.com)

### Your App Issues
- Check logs in Render Dashboard
- Use Shell to debug
- Test health endpoint: `/api/health`

---

## Quick Reference

### Important URLs After Deploy

```
Application: https://your-app.onrender.com
Health Check: https://your-app.onrender.com/api/health
Database: Internal URL in Render dashboard
Logs: Render Dashboard → Logs tab
Shell: Render Dashboard → Shell tab
```

### Important Commands

```bash
# Local build test
npm run build

# Local start test
npm start

# Install dependencies
npm run install:all

# Build client only
npm run build:client
```

---

**Status**: Ready for Deployment
**Last Updated**: 2026-09-09
**Platform**: Render.com
**Deployment Type**: Node.js + Static Frontend
