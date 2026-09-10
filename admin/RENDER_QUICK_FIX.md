# Quick Fix: "vite: Permission denied"

## The Problem
```
sh: 1: vite: Permission denied
==> Build failed 😞
```

## The Solution (3 Steps)

### Step 1: Update Render Build Command

In Render Dashboard → Your Admin Service → Settings:

**Change Build Command from:**
```bash
npm install; npm run build
```

**To:**
```bash
npm install && npx vite build
```

### Step 2: Commit Fixed Files

The following files have been updated:
- ✅ `package.json` - vite moved to dependencies, build uses npx
- ✅ `render.yaml` - proper static site configuration
- ✅ `vite.config.js` - added build configuration

Commit and push:
```bash
git add package.json render.yaml vite.config.js RENDER_DEPLOYMENT.md
git commit -m "Fix Render deployment - vite permission issue"
git push
```

### Step 3: Redeploy

- Go to Render Dashboard
- Click **"Manual Deploy"** → **"Deploy latest commit"**
- Watch the logs - should see successful build

---

## What Changed?

### package.json
```json
// BEFORE (devDependencies - not always installed)
"devDependencies": {
  "vite": "^5.0.8"
}

// AFTER (dependencies - always installed)
"dependencies": {
  "vite": "^5.0.8"
}

// Build command
"scripts": {
  "build": "npx vite build"  // Uses npx
}
```

### Why This Works

1. **`dependencies` vs `devDependencies`**:
   - Some platforms skip devDependencies in production
   - Moving to dependencies ensures vite is always installed

2. **`npx` prefix**:
   - Runs the locally installed vite from node_modules/.bin/
   - Avoids permission issues with global executables
   - Ensures correct version is used

---

## Verify Build Works Locally

Test before pushing:

```powershell
# Clean install
cd admin
Remove-Item -Recurse -Force node_modules, dist -ErrorAction SilentlyContinue
npm install

# Build
npx vite build

# Should output:
# ✓ built in XXXms
# dist/index.html
```

---

## Alternative: Use Render Static Site

If still having issues, deploy as **Static Site** instead:

1. **In Render Dashboard:**
   - Delete current service (or create new)
   - Click **"New +"** → **"Static Site"**
   - Connect repository

2. **Configure:**
   ```
   Build Command: npm install && npx vite build
   Publish Directory: dist
   ```

3. **Add Environment Variable:**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

---

## Checklist After Fix

- [ ] Build command updated in Render
- [ ] Files committed and pushed
- [ ] Redeploy triggered
- [ ] Build logs show success
- [ ] Admin site loads
- [ ] Login works
- [ ] API calls work

---

## Still Not Working?

### Check These:

1. **Node.js version in Render:**
   - Settings → Environment
   - Should be 18 or higher

2. **Build command is correct:**
   ```bash
   npm install && npx vite build
   ```

3. **Environment variable set:**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

4. **Files in repository:**
   - `package.json` (with vite in dependencies)
   - `render.yaml` (optional but recommended)

---

## Quick Summary

**Problem**: vite permission denied
**Root Cause**: vite in devDependencies, not using npx
**Solution**: Move to dependencies, use npx
**Deploy**: Commit, push, redeploy

**Expected Result**: ✅ Build succeeds, admin deploys!
