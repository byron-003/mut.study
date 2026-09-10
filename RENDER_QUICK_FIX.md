# Quick Fix for Render Build Error

## The Problem

```
sh: 1: vite: not found
==> Build failed 😞
```

**Cause**: The build command `cd client && npm run build` runs before installing dependencies.

---

## Solution: Update Render Settings

### In Render Dashboard

1. **Go to your service** (mut-study-hub)
2. **Click "Settings"** (left sidebar)
3. **Scroll to "Build & Deploy"**
4. **Update these fields**:

   **Build Command**:
   ```bash
   npm run build
   ```
   
   **Start Command**:
   ```bash
   npm start
   ```

5. **Click "Save Changes"**
6. **Trigger a new deploy**: Go to "Manual Deploy" → "Deploy latest commit"

---

## What This Does

The root `package.json` (newly created) has these scripts:

```json
{
  "scripts": {
    "build": "npm run install:all && npm run build:client",
    "start": "cd server && node server.js"
  }
}
```

**Build process**:
1. `npm run build` → Runs install + build
2. `install:all` → Installs server AND client dependencies
3. `build:client` → Builds the React app
4. Creates `client/dist` with production files

**Start process**:
1. `npm start` → Starts the server
2. Server serves both API and client files

---

## Alternative: Use render.yaml

If you prefer automated configuration:

1. **Commit the files**:
   ```bash
   git add render.yaml package.json
   git commit -m "Add Render configuration"
   git push
   ```

2. **In Render Dashboard**:
   - Delete current service (or keep it)
   - Click **"New +"** → **"Blueprint"**
   - Connect your repository
   - Render reads `render.yaml` automatically
   - Click **"Apply"**

---

## Files You Need in Repository

Make sure these files are committed:

- ✅ `package.json` (root level) - **NEW**
- ✅ `render.yaml` (root level) - **NEW**
- ✅ `client/package.json` - Already exists
- ✅ `server/package.json` - Already exists
- ✅ `client/vite.config.js` - Already exists
- ✅ `server/server.js` - Already exists

---

## Commit and Push

```bash
git add package.json render.yaml
git commit -m "Fix Render deployment configuration"
git push origin main
```

Then trigger a redeploy in Render.

---

## Verify After Deploy

1. **Check build logs** - Should see:
   ```
   ✓ Installing server dependencies
   ✓ Installing client dependencies  
   ✓ Building client
   ✓ vite build succeeded
   ```

2. **Check your app URL**: `https://your-app.onrender.com`
   - Should show your landing page
   - Check API: `https://your-app.onrender.com/api/health`

3. **If 503 error**: Check environment variables are set

---

## Still Having Issues?

### Check:
1. ✅ Root `package.json` exists in repository
2. ✅ Build command is: `npm run build`
3. ✅ Start command is: `npm start`
4. ✅ All environment variables added in Render
5. ✅ Database credentials are correct

### Debug:
- Check Render logs (real-time in dashboard)
- Try local build: `npm run build`
- Check Shell access in Render to see files

---

**Quick Summary**:
- Created `package.json` at root with proper scripts
- Update Render build command to: `npm run build`
- Update Render start command to: `npm start`
- Commit, push, redeploy
