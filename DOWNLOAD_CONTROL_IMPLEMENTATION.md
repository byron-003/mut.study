# Download Control & Resource Upload Implementation

## Overview

This document explains the implementation of:
1. **Admin Download Control** - Admin can globally enable/disable downloads
2. **Read vs Download** - Students see "Read" button instead of download icon
3. **Course-Based Uploads** - Resources are uploaded to specific courses (not during course creation)

---

## ✅ Implementation Summary

### 1. Database Changes

**File**: `server/migrations/012_add_downloads_setting.sql`

Created `system_settings` table with:
- `setting_key` - Unique setting identifier
- `setting_value` - Setting value (stored as text)
- `downloads_enabled` - Default setting (true)

**To Apply**:
```bash
cd server/migrations
node run_downloads_migration.js
```

### 2. Backend API

**Files Modified**:
- `server/controllers/adminController.js`
- `server/routes/adminRoutes.js`  
- `server/server.js`

**New Endpoints**:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/settings` | Admin Only | Get all system settings |
| PUT | `/api/admin/settings` | Admin Only | Update a system setting |
| GET | `/api/settings/downloads-enabled` | Public | Check if downloads are enabled |

**Example Usage**:
```javascript
// Admin toggles downloads
PUT /api/admin/settings
{
  "key": "downloads_enabled",
  "value": false
}

// Student checks if downloads enabled
GET /api/settings/downloads-enabled
// Returns: { "downloads_enabled": false }
```

### 3. Client (Student Portal)

**File Modified**: `client/src/pages/DashboardPage.jsx`

**Changes**:

1. **Fetch Downloads Status**:
   ```javascript
   const [downloadsEnabled, setDownloadsEnabled] = useState(false);
   
   useEffect(() => {
     const fetchDownloadsStatus = async () => {
       const response = await fetch('/api/settings/downloads-enabled');
       const data = await response.json();
       setDownloadsEnabled(data.data.downloads_enabled);
     };
     fetchDownloadsStatus();
   }, []);
   ```

2. **Read Button** (replaced download icon):
   ```jsx
   <button onClick={() => handleViewFile(resource)}>
     <BookOpen className="w-4 h-4" />
     {hasProgress ? 'Continue Reading' : 'Read'}
   </button>
   ```

3. **Conditional Download Button**:
   ```jsx
   {downloadsEnabled && (
     <button onClick={() => handleDownloadFile(viewerFile)}>
       <Download className="w-4 h-4" />
       Download
     </button>
   )}
   ```

**User Experience**:

| Downloads Enabled | User Sees |
|-------------------|-----------|
| ✅ Yes | "Read" button + "Download" button in viewer |
| ❌ No | "Read" button only (no download option) |

### 4. Admin Panel

**Files Modified**:
- `admin/src/pages/SettingsPage.jsx`
- `admin/src/services/api.js`

**Downloads Toggle** in Settings → General:

```jsx
<div className="flex items-center justify-between">
  <div>
    <p>Enable Resource Downloads</p>
    <p className="text-sm">Control whether students can download resources</p>
  </div>
  <Toggle
    checked={downloadsEnabled}
    onChange={(checked) => updateSetting('downloads_enabled', checked)}
  />
</div>
```

**Features**:
- ✅ Loads current setting on page load
- ✅ Real-time toggle with API call
- ✅ Success/error feedback
- ✅ Only accessible to admins

---

## 📋 Resource Upload Workflow

### Current Flow (Already Correct!)

#### 1. Admin Creates Course Structure

**Page**: Admin Panel → Courses → Add Course

**Fields**:
- Unit Code (e.g., CSC 2101)
- Unit Title (e.g., Data Structures)
- Level (Year 1-4)
- Semester (1 or 2)
- Credits (1-10)
- Program

**No file upload!** Admin only creates the course metadata.

#### 2. Students Upload Files to Courses

**Page**: Student Dashboard → Course → Upload button

**Process**:
1. Student navigates to their courses
2. Clicks "Upload" button for a specific course
3. UploadModal opens with `courseId` already set
4. Student uploads file with:
   - Title
   - Description
   - Category (notes, past_paper, CAT, etc.)
   - File (PDF, DOC, PPT, ZIP)

**File**: `client/src/components/UploadModal.jsx`

```javascript
<UploadModal
  isOpen={showUpload}
  courseId={selectedCourseId}  // ← Course is already selected!
  onClose={() => setShowUpload(false)}
  onSuccess={refreshResources}
/>
```

**Benefits**:
- ✅ Resources are always linked to a course
- ✅ No orphan resources
- ✅ Admin doesn't need to upload files
- ✅ Students contribute materials to their courses

---

## 🔄 Complete User Flows

### Flow 1: Admin Disables Downloads

```
1. Admin logs into Admin Panel
2. Goes to Settings → General
3. Toggles "Enable Resource Downloads" OFF
4. Clicks "Save Changes"
   ↓
5. API: PUT /api/admin/settings { key: "downloads_enabled", value: false }
   ↓
6. Database: system_settings.downloads_enabled = 'false'
   ↓
7. All students now see only "Read" button (no download)
```

### Flow 2: Student Reads Resource (Downloads Disabled)

```
1. Student opens Dashboard
2. API call: GET /api/settings/downloads-enabled → { downloads_enabled: false }
3. Student sees courses with "Read" button
4. Clicks "Read" on a resource
   ↓
5. Resource opens in viewer
6. Download button is HIDDEN
7. Student can only read/view online
```

### Flow 3: Student Reads Resource (Downloads Enabled)

```
1. Student opens Dashboard
2. API call: GET /api/settings/downloads-enabled → { downloads_enabled: true }
3. Student sees courses with "Read" button
4. Clicks "Read" on a resource
   ↓
5. Resource opens in viewer
6. Download button is VISIBLE
7. Student can:
   - Read online
   - OR click "Download" to save file
```

### Flow 4: Admin Creates Course → Student Uploads File

```
1. Admin Panel → Courses → Add Course
2. Admin enters:
   - Unit Code: CSC 2101
   - Unit Title: Data Structures
   - Level: 2
   - Semester: 1
   - Credits: 4
3. Clicks "Create"
   ↓
4. Course is created (no files yet)
   ↓
5. Student sees "Data Structures" in Dashboard
6. Clicks "Upload" button
7. UploadModal opens (courseId = CSC 2101's ID)
8. Student uploads PDF file with title "Week 1 Notes"
   ↓
9. Resource is saved linked to CSC 2101
10. All students in that course can now see/read it
```

---

## 🎨 UI/UX Changes

### Before (Old Behavior)

**Resource Cards**:
- ❌ Had download icon
- ❌ Clicking downloaded immediately

**Viewer**:
- ❌ Download always visible
- ❌ No admin control

### After (New Behavior)

**Resource Cards**:
- ✅ Show "Read" button with BookOpen icon
- ✅ Text changes based on progress:
  - "Read" (not started)
  - "Continue Reading" (in progress)
  - "Read Again" (completed)

**Viewer**:
- ✅ Download button only if admin enables
- ✅ Message shown when downloads disabled:
  - "Downloads are currently disabled by administrator"

**Admin Settings**:
- ✅ New "Enable Resource Downloads" toggle
- ✅ Visual feedback (spinner during save)
- ✅ Success message after save

---

## 🧪 Testing Guide

### Test 1: Download Toggle

1. **Login as Admin**
2. Go to Settings → General
3. Verify "Enable Resource Downloads" toggle exists
4. Toggle OFF → Save
5. **Expected**: Success message shown

6. **Login as Student** (different browser/incognito)
7. Open Dashboard
8. Open any resource
9. **Expected**: No download button in viewer

10. **Back to Admin**
11. Toggle ON → Save
12. **Back to Student**
13. Refresh page
14. Open resource
15. **Expected**: Download button appears

### Test 2: Read Button

1. **Login as Student**
2. Go to Dashboard
3. Click on a course
4. View resources list
5. **Expected**: All resources show "Read" button (not "Download")

6. Click "Read" on any resource
7. **Expected**: Resource opens in viewer
8. Scroll through document
9. Close viewer
10. Click "Read" again on same resource
11. **Expected**: Button now says "Continue Reading"

### Test 3: Course Creation & Upload

1. **Login as Admin**
2. Go to Courses → Add Course
3. Fill in course details
4. **Expected**: No file upload field
5. Click "Create"
6. **Expected**: Course created successfully

7. **Login as Student**
8. Go to Dashboard
9. Find the newly created course
10. Click "Upload" button
11. **Expected**: Upload modal opens
12. Upload a PDF file with title
13. Click "Submit"
14. **Expected**: File uploaded successfully

15. Refresh page
16. **Expected**: New file appears under that course
17. Click "Read"
18. **Expected**: File opens in viewer

### Test 4: Progress Tracking with Read

1. **Login as Student**
2. Click "Read" on a resource
3. Scroll to middle of document
4. Wait 30 seconds (auto-save)
5. Close viewer
6. **Expected**: Button now says "Continue Reading"

7. Click "Continue Reading"
8. **Expected**: Opens at previous scroll position
9. Scroll to end (100%)
10. **Expected**: Button changes to "Read Again"

---

## 📊 Database Schema

### system_settings Table

```sql
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default data
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('downloads_enabled', 'true', 'Global setting to enable or disable resource downloads');
```

**Query Examples**:

```sql
-- Check if downloads enabled
SELECT setting_value FROM system_settings WHERE setting_key = 'downloads_enabled';

-- Enable downloads
UPDATE system_settings SET setting_value = 'true' WHERE setting_key = 'downloads_enabled';

-- Disable downloads
UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'downloads_enabled';

-- See who last changed setting
SELECT setting_key, setting_value, updated_by, updated_at 
FROM system_settings 
WHERE setting_key = 'downloads_enabled';
```

---

## 🚀 Deployment Steps

### 1. Database Migration

**Automatic Migration**: The migration runs automatically when the server starts!

The server checks if `system_settings` table exists on startup. If not, it runs the migration automatically.

**Manual Option** (if needed):
```bash
# On Render, use the Shell tab to run:
cd server/migrations
node run_downloads_migration_production.js
```

### 2. Deploy Backend

```bash
git add server/
git commit -m "Add download control system"
git push
```

Backend will restart with new endpoints.

### 3. Deploy Frontend (Client)

```bash
cd client
npm run build
git add client/
git commit -m "Update UI for download control"
git push
```

### 4. Deploy Admin Panel

```bash
cd admin
npm run build
git add admin/
git commit -m "Add downloads toggle in settings"
git push
```

### 5. Verify Deployment

```bash
# Check health endpoint
curl https://your-backend.onrender.com/api/health

# Check downloads setting
curl https://your-backend.onrender.com/api/settings/downloads-enabled
```

---

## 🔧 Configuration

### Default Settings

By default, downloads are **ENABLED**.

### Change Default

Edit migration file before running:

```sql
-- In 012_add_downloads_setting.sql
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('downloads_enabled', 'false', '...');  -- Change to 'false'
```

---

## 📝 Files Modified

### Backend (8 files)
1. `server/migrations/012_add_downloads_setting.sql` ✨ NEW
2. `server/migrations/run_downloads_migration.js` ✨ NEW
3. `server/controllers/adminController.js` ✏️ MODIFIED
4. `server/routes/adminRoutes.js` ✏️ MODIFIED
5. `server/server.js` ✏️ MODIFIED

### Client (1 file)
6. `client/src/pages/DashboardPage.jsx` ✏️ MODIFIED

### Admin (2 files)
7. `admin/src/services/api.js` ✏️ MODIFIED
8. `admin/src/pages/SettingsPage.jsx` ✏️ MODIFIED

---

## 💡 Key Design Decisions

### Why System Settings Table?

- ✅ Scalable - can add more settings easily
- ✅ Auditable - tracks who changed what
- ✅ Flexible - settings stored as text, parsed as needed
- ✅ No code changes needed for new settings

### Why Public Endpoint for Downloads Status?

- ✅ Students need to check without authentication overhead
- ✅ Read-only, no security risk
- ✅ Cached by browser, reduces server load
- ✅ Fast response time

### Why "Read" Instead of "View"?

- ✅ More intuitive for study materials
- ✅ Emphasizes online reading
- ✅ Consistent with "Continue Reading", "Read Again"
- ✅ Clearer distinction from "Download"

### Why No File Upload in Course Creation?

- ✅ Separation of concerns - admin creates structure, students add content
- ✅ Encourages student participation
- ✅ Prevents admin becoming bottleneck
- ✅ Students upload what they need, when they need it

---

## 🎯 Future Enhancements

Possible additions to the system:

1. **Download Limits**
   - Max downloads per student per day
   - Prevent abuse

2. **Scheduled Downloads**
   - Enable downloads only during certain hours
   - Disable during exams

3. **Selective Downloads**
   - Enable downloads for specific courses
   - Disable for others

4. **Download Analytics**
   - Track download patterns
   - Popular resources

5. **Watermarking**
   - Add student name/ID to downloaded files
   - Prevent unauthorized sharing

---

## ✅ Summary

**What Changed**:
- ✅ Admin can toggle downloads globally
- ✅ Students see "Read" button (not download icon)
- ✅ Download button only shows when enabled
- ✅ Resource uploads are course-specific (already was!)

**What Stayed the Same**:
- ✅ Course creation flow (no file upload)
- ✅ Student upload workflow
- ✅ Resource viewing/reading
- ✅ Progress tracking

**Result**:
- ✅ Better control over resource distribution
- ✅ Clearer UI for students
- ✅ Encourages online reading
- ✅ Optional download when needed

---

**Implementation Date**: 2026-09-09
**Status**: ✅ Complete
**Ready for**: Production Deployment
