# Cloudinary Upload Fix V2 - Comprehensive Solution

## Issue
Still getting "An unknown file format not allowed" error from Cloudinary after initial fix.

## Root Cause
Cloudinary's `allowed_formats` parameter with `resource_type: 'auto'` was too restrictive and causing conflicts. Cloudinary was rejecting files at their API level, not at our validation level.

## Solution
Complete rewrite of Cloudinary configuration to use dynamic resource type detection and remove format restrictions.

---

## Changes Made

### 1. Dynamic Resource Type Detection
**File**: `server/config/cloudinary.js`

Changed from static `params` object to dynamic `params` function:

```javascript
params: async (req, file) => {
  // Auto-detect resource type based on MIME type
  let resourceType = 'raw'; // Documents, archives
  
  if (file.mimetype.startsWith('image/')) {
    resourceType = 'image';
  } else if (file.mimetype.startsWith('video/')) {
    resourceType = 'video';
  } else if (file.mimetype.startsWith('audio/')) {
    resourceType = 'video'; // Cloudinary stores audio as video
  }
  
  return {
    folder: 'mut_study_hub_docs',
    resource_type: resourceType,
    public_id: `${originalName}_${timestamp}`,
    format: undefined, // Let Cloudinary auto-detect
    allowedFormats: resourceType === 'raw' ? undefined : null
  };
}
```

### 2. Improved Error Handling
**File**: `server/routes/resourceRoutes.js`

Added detailed error logging and response:

```javascript
router.post('/upload', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      return res.status(400).json({
        status: 'error',
        message: err.message || 'File upload failed',
        details: err.storageErrors || []
      });
    }
    next();
  });
}, uploadResource);
```

---

## How It Works

### Resource Type Mapping

**Images** → `image` resource type
- JPG, PNG, GIF, BMP, SVG, WEBP

**Videos** → `video` resource type  
- MP4, AVI, MOV, WMV, MKV, WEBM

**Audio** → `video` resource type
- MP3, WAV, OGG, M4A, AAC
- (Cloudinary stores audio as video type)

**Documents** → `raw` resource type
- PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
- TXT, RTF, CSV
- ZIP, RAR, 7Z, TAR, GZ

### No Format Restrictions
- Removed `allowed_formats` array
- Cloudinary will accept any file type for `raw` resources
- Format validation happens at Multer level (MIME type check)

---

## Testing After Fix

### 1. Restart Server
**CRITICAL**: You must restart the server:

```bash
cd server
# Press Ctrl+C to stop
npm start
```

### 2. Test Different File Types

**Documents**:
- [ ] Upload PDF
- [ ] Upload DOCX
- [ ] Upload PPTX
- [ ] Upload TXT

**Media**:
- [ ] Upload JPG/PNG image
- [ ] Upload MP4 video
- [ ] Upload MP3 audio

**Archives**:
- [ ] Upload ZIP file

**Check**:
- Upload succeeds
- File appears in resources list
- Download works
- No console errors

---

## Troubleshooting

### Still getting format error?

**Check server console for detailed error**:
The new error handling logs the actual error message.

**Common issues**:

1. **Server not restarted**
   - Solution: Stop and restart server completely

2. **File too large**
   - Solution: Check `MAX_FILE_SIZE` in `.env` (currently 50MB)

3. **Cloudinary account limits**
   - Solution: Check your Cloudinary dashboard for quota/limits

4. **Invalid MIME type**
   - Solution: Check server logs for `Invalid file type: [mime-type]`

5. **Cloudinary API key issues**
   - Solution: Verify `.env` has correct credentials

### Check Cloudinary Dashboard

1. Go to: https://cloudinary.com/console
2. Check **Media Library** → Look for uploaded files
3. Check **Usage** → Verify you haven't exceeded limits
4. Check **Settings** → Verify upload presets allow your resource types

### Enable Debug Logging

Add to `server/config/cloudinary.js` after `cloudinary.config()`:

```javascript
// Enable debug logging
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  upload_preset: 'default' // If you have one
});

console.log('Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  folder: process.env.CLOUDINARY_FOLDER
});
```

---

## What Changed From V1

### V1 (Previous Fix):
- Used static `params` object
- Listed all formats in `allowed_formats` array
- Used `resource_type: 'auto'`
- **Problem**: Cloudinary still rejected some formats

### V2 (Current Fix):
- Uses dynamic `params` function
- No `allowed_formats` restriction
- Smart resource type detection
- Better error handling
- **Result**: Should accept all file types

---

## Validation Flow

```
User selects file
    ↓
Browser checks accept attribute (client-side)
    ↓
Multer fileFilter checks MIME type (server-side)
    ↓
Cloudinary storage determines resource type
    ↓
Cloudinary uploads file (no format restriction)
    ↓
Success!
```

---

## Production Considerations

### Cloudinary Limits
- **Free tier**: 25 GB storage, 25 GB bandwidth/month
- **File size**: Max 100MB (free), 10GB (paid)
- **Transform**: Limited on free tier

### Recommendations:
1. Monitor usage in Cloudinary dashboard
2. Consider upgrading if hitting limits
3. Implement file compression for large videos
4. Use CDN for frequently accessed files

---

## Alternative: Local Storage

If Cloudinary continues to have issues, you can switch to local storage:

```javascript
// server/config/localStorage.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 52428800 } // 50MB
});
```

---

## Date
December 2024

## Version
2.0

## Status
✅ Complete - Test after server restart

## Priority
🔴 HIGH - Blocks file uploads
