# Profile Picture Upload Fix

## Issue

Profile picture and forum image uploads were failing with:
```
Error: ENOENT: no such file or directory, open 'C:\Users\oyooo\mut-study-hub\server\uploads\profile-...'
```

## Root Cause

The code was using **local disk storage** (`multer.diskStorage`) which requires an `uploads/` directory to exist on the server. This approach:
- ❌ Creates temporary files locally
- ❌ Requires manual cleanup
- ❌ Needs an uploads folder that might not exist
- ❌ Then uploads to Cloudinary as a second step

## Solution

Changed to use **Cloudinary direct upload** (`CloudinaryStorage`) which:
- ✅ Uploads directly to Cloudinary (no local files)
- ✅ No cleanup needed
- ✅ No local directory required
- ✅ Automatic transformations (resize, optimize)
- ✅ Organized into folders on Cloudinary

---

## Files Modified

### 1. `server/routes/authRoutes.js`

**Before**:
```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ❌ Requires local folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + '-' + file.originalname);
  }
});
```

**After**:
```javascript
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mut_study_hub_profiles', // ✅ Cloudinary folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});
```

### 2. `server/routes/forumRoutes.js`

**Before**: Local disk storage
**After**: Cloudinary direct upload to `mut_study_hub_forum` folder

### 3. `server/controllers/authController.js`

**Before**:
```javascript
// Upload to Cloudinary (manual)
const result = await cloudinary.uploader.upload(req.file.path, {
  folder: 'profile_pictures',
  resource_type: 'image'
});
imageUrl = result.secure_url;

// Delete temp file
await unlinkAsync(req.file.path); // ❌ Manual cleanup
```

**After**:
```javascript
// File is already uploaded to Cloudinary by multer
const imageUrl = req.file.path; // ✅ Cloudinary URL
```

### 4. `server/controllers/forumController.js`

**Before**: Manual Cloudinary upload + temp file cleanup
**After**: Direct Cloudinary upload (file already uploaded by multer)

---

## How It Works Now

### Profile Picture Upload Flow

```
1. User selects image
   ↓
2. Frontend sends to: POST /api/auth/profile/picture
   ↓
3. Multer middleware intercepts
   ↓
4. CloudinaryStorage uploads directly to Cloudinary
   ↓
5. req.file.path = Cloudinary URL
   ↓
6. Controller saves URL to database
   ↓
7. Response sent to client
```

### Cloudinary Organization

```
Cloudinary Account
├── mut_study_hub_profiles/       (Profile pictures)
│   ├── user_photo_1234567890.jpg
│   └── avatar_9876543210.png
│
├── mut_study_hub_forum/          (Forum images)
│   ├── discussion_pic_111.jpg
│   └── group_study_222.png
│
└── mut_study_hub_docs/           (Study resources)
    ├── lecture_notes_333.pdf
    └── assignment_444.docx
```

### Automatic Transformations

**Profile Pictures**:
- Max size: 500x500px
- Auto quality optimization
- Allowed formats: jpg, jpeg, png, gif, webp

**Forum Images**:
- Max size: 1200x1200px
- Auto quality optimization
- Allowed formats: jpg, jpeg, png, gif, webp

---

## Testing

### Test Profile Picture Upload

1. **Login to the app**
2. **Go to Profile page**
3. **Click "Upload Profile Picture"**
4. **Select an image**
5. **Verify**:
   - ✅ Upload completes successfully
   - ✅ Image appears in profile
   - ✅ No server errors in console
   - ✅ Image URL starts with `https://res.cloudinary.com/`

### Test Forum Image Upload

1. **Go to Forum**
2. **Create new post**
3. **Attach an image**
4. **Submit post**
5. **Verify**:
   - ✅ Post created with image
   - ✅ Image displays in feed
   - ✅ No server errors
   - ✅ Image URL is from Cloudinary

---

## Advantages of This Approach

### Performance
- ✅ Faster uploads (direct to Cloudinary CDN)
- ✅ No server disk I/O
- ✅ Automatic image optimization

### Reliability
- ✅ No temp file cleanup needed
- ✅ No local disk space issues
- ✅ Atomic operations (upload or fail, no orphan files)

### Scalability
- ✅ Works in serverless environments
- ✅ No local storage required
- ✅ Handles concurrent uploads better

### Maintenance
- ✅ Less code to maintain
- ✅ No file system permissions issues
- ✅ Cloudinary handles image processing

---

## Environment Variables Required

Ensure these are set in `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these from: [Cloudinary Dashboard](https://cloudinary.com/console)

---

## Troubleshooting

### Issue: Still getting upload errors

**Check**:
1. Cloudinary credentials in `.env` are correct
2. Cloudinary account is active
3. `multer-storage-cloudinary` package is installed:
   ```powershell
   cd server
   npm install multer-storage-cloudinary
   ```

### Issue: Images not displaying

**Check**:
1. Image URL in database starts with `https://res.cloudinary.com/`
2. Cloudinary account has the correct folders
3. Browser can access Cloudinary URLs (check CORS)

### Issue: Transformation not working

**Check**:
1. Transformation syntax in CloudinaryStorage config
2. Cloudinary plan supports transformations (free plan does)
3. Check Cloudinary dashboard for transformation details

---

## Migration Notes

### Existing Data

Old profile pictures stored locally (if any) are not automatically migrated. Options:

1. **Do nothing**: Old images become broken links, users re-upload
2. **Migrate manually**: Upload old images to Cloudinary and update database
3. **Set default**: Provide default avatar for users with broken image links

### Recommended: Add Default Avatar

In profile display logic:
```javascript
const profilePicture = user.profile_picture_url || '/default-avatar.png';
```

---

## Summary

✅ **Fixed**: Profile picture uploads now work correctly
✅ **Fixed**: Forum image uploads now work correctly
✅ **Improved**: No local file system dependencies
✅ **Improved**: Automatic image optimization
✅ **Improved**: Better organization on Cloudinary
✅ **Removed**: Unnecessary file cleanup code
✅ **Removed**: Unused imports (fs, promisify)

---

**Status**: ✅ Resolved
**Date**: 2026-09-09
