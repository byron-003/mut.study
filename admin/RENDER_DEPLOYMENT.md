# Admin Panel - Render Deployment Guide

This guide explains how to deploy the MUT Study Hub Admin Panel as a static site on Render.

## Issue: "vite: Permission denied"

### Root Cause
The error occurs when:
1. `vite` is in `devDependencies` and not installed in production
2. The vite executable doesn't have proper permissions
3. The build command doesn't use `npx`

### Solution Applied

**1. Updated `package.json`:**
- Moved `vite` and `@vitejs/plugin-react` to `dependencies`
- Changed build command to use `npx vite build`

**2. Created `render.yaml`:**
- Configured as static site
- Proper build command with `npx`
- Cache headers for optimal performance
- SPA routing configuration

---

## Quick Deploy

### Option 1: Using render.yaml (Recommended)

1. **Commit the changes:**
   ```bash
   cd admin
   git add package.json render.yaml vite.config.js
   git commit -m "Fix Render deployment - move vite to dependencies"
   git push
   ```

2. **Deploy to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Static Site"**
   - Connect your GitHub repository (admin.mutstudy)
   - Render will auto-detect `render.yaml`
   - Click **"Create Static Site"**

3. **Environment Variables:**
   Add in Render dashboard:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

### Option 2: Manual Configuration

1. **Create Static Site in Render:**
   - Go to Render Dashboard
   - Click **"New +"** → **"Static Site"**
   - Connect repository

2. **Configure Build Settings:**
   ```
   Name: mut-study-hub-admin
   Branch: main
   Build Command: npm install && npx vite build
   Publish Directory: dist
   ```

3. **Add Environment Variable:**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

---

## Files Modified

### 1. `package.json`

**Changes:**
- ✅ Moved `vite` from devDependencies to dependencies
- ✅ Moved `@vitejs/plugin-react` from devDependencies to dependencies
- ✅ Updated build command to `npx vite build`

**Why:**
- Some platforms don't install devDependencies in production
- `npx` ensures the locally installed vite is used
- Build tools should be in dependencies for CI/CD

### 2. `vite.config.js`

**Added:**
```javascript
build: {
  outDir: 'dist',
  assetsDir: 'assets',
  sourcemap: false,
  base: '/'
}
```

**Why:**
- Ensures consistent build output
- Proper asset organization
- No source maps in production (faster builds)
- Correct base path for deployment

### 3. `render.yaml` (NEW)

**Created configuration for:**
- Static site deployment
- Build command with `npx`
- Cache headers for performance
- SPA routing (all routes → index.html)

---

## Deployment Architecture

### Admin Panel (Static Site)
```
Render Static Site
├── Build: npm install && npx vite build
├── Publish: dist/
├── Routes: /* → index.html (SPA)
└── Environment: VITE_API_URL
```

### Main App (Node.js Server + Client)
```
Render Web Service
├── Server: Node.js on port 10000
├── Client: Served from server
└── API: /api/*
```

### Separate Deployments

**Admin**: Static site (Vercel, Netlify, or Render Static)
**Main App**: Web service with Node.js server

---

## Build Process

### What Happens During Build

```
1. npm install
   ↓ Installs all dependencies (including vite)
   
2. npx vite build
   ↓ Runs locally installed vite
   ↓ Builds React app for production
   ↓ Outputs to dist/
   
3. dist/ folder structure:
   ├── index.html
   ├── assets/
   │   ├── index-abc123.js
   │   └── index-xyz789.css
   └── favicon.ico
   
4. Deploy to Render CDN
   ↓ Files served via Render's global CDN
```

---

## Environment Variables

### Required

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

**Important**: 
- Use your actual backend URL
- Must include `/api` at the end
- Should be HTTPS in production

### How to Add in Render

1. Go to your static site dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Key: `VITE_API_URL`
5. Value: Your backend URL with `/api`
6. **Save** and rebuild

---

## Troubleshooting

### Still Getting "Permission Denied"?

**Solution 1: Clear Cache**
```bash
cd admin
rm -rf node_modules dist
npm install
npx vite build
```

**Solution 2: Verify package.json**
Ensure vite is in dependencies:
```json
"dependencies": {
  "vite": "^5.0.8"
}
```

**Solution 3: Use Full Path**
Update build command to:
```bash
npm install && ./node_modules/.bin/vite build
```

### Build Succeeds but Blank Page?

**Check:**
1. Environment variable `VITE_API_URL` is set
2. Backend URL is correct and accessible
3. CORS is configured on backend to allow admin URL
4. Check browser console for errors

### API Calls Fail?

**Check:**
1. `VITE_API_URL` environment variable
2. Backend CORS settings include admin URL:
   ```javascript
   // In server/server.js
   cors({
     origin: [
       'https://your-admin.onrender.com',
       'https://your-main-app.onrender.com'
     ]
   })
   ```

### Routes Don't Work (404 on Refresh)?

**Solution:** Ensure render.yaml has:
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

Or in manual setup, enable "Auto-deploy" and "Rewrite all paths to /index.html"

---

## Performance Tips

### 1. Enable Asset Caching

Already configured in `render.yaml`:
- Assets cached for 1 year
- HTML cached with revalidation

### 2. Optimize Images

Use optimized images in `/public`:
```bash
# Use image optimization tools
npm install -g sharp-cli
sharp input.png -o output.png
```

### 3. Code Splitting

Vite automatically splits code. Import lazy components:
```javascript
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

---

## Alternative Deployment Platforms

### Vercel (Recommended for Static Sites)

```bash
cd admin
npm install -g vercel
vercel
```

**Advantages:**
- Fast global CDN
- Automatic HTTPS
- Easy custom domains
- Zero config for Vite

### Netlify

```bash
cd admin
npm install -g netlify-cli
netlify deploy --prod
```

**Build Settings:**
```
Build Command: npm run build
Publish Directory: dist
```

### GitHub Pages

```bash
# Add to package.json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

npm install -g gh-pages
npm run deploy
```

---

## Security

### HTTPS
- ✅ Automatic on Render
- ✅ Free SSL certificate
- ✅ Force HTTPS redirect

### Environment Variables
- ✅ Stored securely in Render
- ✅ Not exposed in frontend code
- ✅ Injected at build time

### CORS
Ensure backend allows admin URL:
```javascript
cors({
  origin: [
    'https://admin.yourdomain.com',
    'https://admin.onrender.com'
  ]
})
```

---

## Cost

### Render Static Site
- **Free Tier**: 100GB bandwidth/month
- **Paid**: $1/month for 100GB, then $0.10/GB

### Vercel
- **Free**: Unlimited bandwidth for personal projects
- **Pro**: $20/month for commercial

### Netlify
- **Free**: 100GB bandwidth/month
- **Pro**: $19/month

---

## Monitoring

### Render Dashboard
- Build logs
- Deploy history
- Bandwidth usage
- Response times

### Analytics
Add analytics in `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

---

## CI/CD

### Automatic Deploys
- Push to `main` branch
- Render automatically builds and deploys
- Zero downtime

### Preview Deploys
- Enable in Render settings
- Each PR gets preview URL
- Test before merging

---

## Custom Domain

1. **Buy domain** (Namecheap, GoDaddy)
2. **In Render:**
   - Settings → Custom Domain
   - Add: `admin.yourdomain.com`
3. **Update DNS:**
   - Add CNAME record
   - Point to Render URL
4. **Update Backend CORS:**
   ```env
   ADMIN_URL=https://admin.yourdomain.com
   ```

---

## Quick Reference

### Important Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Clean install
rm -rf node_modules dist && npm install

# Test build locally
npm run build && npx vite preview
```

### Important URLs After Deploy

```
Admin Panel: https://your-admin.onrender.com
Backend API: https://your-backend.onrender.com/api
Build Logs: Render Dashboard → Deploys
```

---

## Summary

**Issue**: `vite: Permission denied`

**Solution**:
1. ✅ Moved vite to dependencies
2. ✅ Use `npx vite build` 
3. ✅ Created render.yaml
4. ✅ Updated vite.config.js

**Deploy**: Push changes and Render will build successfully! 🚀

---

**Status**: Ready for Deployment
**Last Updated**: 2026-09-09
**Platform**: Render (Static Site)
