# Page-Based Progress Tracking Implementation

## Overview
This document explains the page-based progress tracking system that allows users to resume reading documents from where they left off.

## Features Implemented

### 1. Database Schema Updates
**File:** `server/migrations/012_add_page_tracking.sql`

Added two new columns to the `study_progress` table:
- `current_page` - Tracks the last page the user was on
- `total_pages` - Stores the total number of pages in the document

Updated the trigger function to automatically calculate `progress_percentage` based on page numbers:
```sql
progress_percentage = (current_page / total_pages) * 100
```

### 2. Backend API Updates
**File:** `server/controllers/progressController.js`

Enhanced `updateProgress()` function to accept:
- `currentPage` - Current page number
- `totalPages` - Total pages in document
- Falls back to `progressPercentage` for non-paginated content

**API Endpoint:** `POST /api/progress/:resourceId/update`

**Request Body:**
```json
{
  "currentPage": 15,
  "totalPages": 100,
  "timeSpent": 10,
  "lastPosition": "page_15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resourceId": 123,
    "progress": 15,
    "currentPage": 15,
    "totalPages": 100,
    "completed": false
  }
}
```

### 3. Frontend FileViewer Component
**File:** `client/src/components/FileViewer.jsx`

#### Key Features:

1. **PDF.js Integration**
   - Dynamically loads PDF.js library
   - Detects total pages in PDF documents
   - Tracks current page as user navigates

2. **Auto-Save Progress**
   - Saves progress every 10 seconds
   - Saves on component unmount
   - Tracks viewing time

3. **Visual Progress Indicator**
   - Shows "Page X of Y (Z%)" in header
   - Progress bar visualization
   - Real-time updates

4. **Continue Reading Support**
   - Accepts `savedProgress` prop
   - Loads user's last page on open
   - Google Docs Viewer supports #page parameter

### 4. Client API Service
**File:** `client/src/services/api.js`

Added `progressAPI` with methods:
```javascript
progressAPI.updateProgress(resourceId, data)
progressAPI.getProgress(resourceId)
progressAPI.getStudyHistory(params)
progressAPI.markAsCompleted(resourceId)
```

## How It Works

### 1. Opening a Document

```javascript
// Get saved progress
const progress = await progressAPI.getProgress(resourceId);

// Open FileViewer with saved progress
<FileViewer
  file={resource}
  savedProgress={progress.data}
  onClose={handleClose}
/>
```

### 2. Tracking Progress

The FileViewer:
1. Loads the PDF and detects total pages
2. Monitors user's current page
3. Auto-saves progress every 10 seconds
4. Calculates percentage: `(currentPage / totalPages) * 100`

### 3. Continue Reading

When reopening a document:
1. Fetch progress: `GET /api/progress/:resourceId`
2. Pass `currentPage` to Google Docs Viewer URL
3. URL format: `viewer?url=...&embedded=true#page=15`

## Database Migration

Run the migration to add page tracking:

```bash
cd server
psql -U your_username -d mut_study_hub -f migrations/012_add_page_tracking.sql
```

Or use Node.js script:
```javascript
import pg from 'pg';
import fs from 'fs';

const client = new pg.Client(/* your config */);
await client.connect();

const sql = fs.readFileSync('./migrations/012_add_page_tracking.sql', 'utf8');
await client.query(sql);

console.log('✅ Page tracking migration complete!');
await client.end();
```

## Installation

Install PDF.js in the client:

```bash
cd client
npm install pdfjs-dist@^4.0.379
```

## Usage Example

### In DashboardPage or ResourcePage:

```javascript
import { useState, useEffect } from 'react';
import FileViewer from '../components/FileViewer';
import { progressAPI } from '../services/api';

function ResourceView() {
  const [showViewer, setShowViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);

  const handleOpenFile = async (resource) => {
    // Fetch saved progress
    try {
      const response = await progressAPI.getProgress(resource.id);
      setSavedProgress(response.data.data);
    } catch (error) {
      console.log('No saved progress');
      setSavedProgress(null);
    }

    setSelectedFile(resource);
    setShowViewer(true);
  };

  const handleClose = () => {
    setShowViewer(false);
    setSelectedFile(null);
    setSavedProgress(null);
  };

  return (
    <>
      {/* Resource List */}
      <button onClick={() => handleOpenFile(resource)}>
        {savedProgress?.currentPage > 1 ? 'Continue Reading' : 'Read'}
      </button>

      {/* File Viewer */}
      {showViewer && (
        <FileViewer
          file={selectedFile}
          savedProgress={savedProgress}
          onClose={handleClose}
          downloadsEnabled={true}
        />
      )}
    </>
  );
}
```

## Continue Reading Button Logic

```javascript
// Show "Continue Reading" if user has progress > page 1
const buttonText = (resource) => {
  const progress = resource.progress; // from getResourcesByCourse
  
  if (!progress) return 'Read';
  if (progress.currentPage > 1) return `Continue (Page ${progress.currentPage})`;
  if (progress.progress > 0) return 'Continue Reading';
  return 'Read';
};
```

## API Integration in Resource Lists

Update `getResourcesByCourse` to include progress:

```javascript
// Backend: resourceController.js
const result = await query(`
  SELECT 
    sm.*,
    sp.progress_percentage,
    sp.current_page,
    sp.total_pages,
    sp.completed
  FROM study_materials sm
  LEFT JOIN study_progress sp ON sp.resource_id = sm.id AND sp.user_id = $1
  WHERE sm.course_id = $2
`, [userId, courseId]);
```

## Benefits

1. **User Experience**
   - Resume reading exactly where they left off
   - No need to manually search for their page
   - Visual progress indication

2. **Engagement Tracking**
   - Accurate reading progress
   - Time spent per resource
   - Completion rates

3. **Gamification**
   - Progress bars motivate completion
   - Streak tracking for daily study
   - Achievement system possible

## Limitations

1. **Google Docs Viewer**
   - The `#page=X` parameter doesn't always work reliably
   - Viewer may cache and ignore page parameter
   - Alternative: Use Mozilla PDF.js viewer for full control

2. **Office Documents**
   - Office Apps Viewer doesn't support page parameters
   - Page tracking works only for PDFs currently

3. **Cross-tab Sync**
   - Progress saves every 10 seconds
   - Opening same document in multiple tabs may have conflicts
   - Last save wins

## Future Enhancements

1. **Client-side PDF Rendering**
   - Use PDF.js canvas renderer
   - Full control over page navigation
   - Better "Continue Reading" experience

2. **Highlight & Annotations**
   - Save user highlights
   - Store page-specific notes
   - Bookmarks feature

3. **Offline Support**
   - Cache progress locally
   - Sync when online
   - Service worker integration

4. **Real-time Sync**
   - WebSocket-based progress updates
   - Sync across devices instantly
   - Collaborative reading features

## Testing

1. **Test Page Tracking:**
   ```bash
   # Upload a PDF with multiple pages
   # Open and navigate through pages
   # Check database: SELECT * FROM study_progress WHERE resource_id = X
   # Verify current_page and progress_percentage update
   ```

2. **Test Continue Reading:**
   ```bash
   # Read to page 10 of a document
   # Close and reopen
   # Verify it opens at page 10
   ```

3. **Test Progress Calculation:**
   ```bash
   # Document with 100 pages
   # Navigate to page 50
   # Verify progress shows 50%
   ```

## Troubleshooting

**Progress not saving:**
- Check browser console for API errors
- Verify authentication token is valid
- Ensure database migration ran successfully

**Page number not resuming:**
- Google Docs Viewer may ignore #page parameter
- Try clearing browser cache
- Consider implementing custom PDF.js viewer

**Total pages showing null:**
- PDF.js failed to load
- CORS issues with PDF URL
- Check network tab for errors

## Support

For issues or questions, contact the development team or file an issue in the repository.
