# Progress Tracking Update - Time & Manual Completion

## Problem
Progress bar stayed at 0% even after users finished reading documents because:
1. Google Docs Viewer is in an iframe → can't track scrolling (cross-origin)
2. Old system relied on scroll position → doesn't work with embedded viewers

## Solution Implemented
**Hybrid Tracking System**:
1. **Time-based auto-progress**: Automatically estimates progress based on viewing time
2. **Manual completion**: "Mark as Complete" button for user to mark as 100% done
3. **Smart auto-save**: Saves progress every 30 seconds

---

## How It Works

### 1. Time-Based Progress Estimation
```javascript
// Formula: 1 minute of viewing = ~20% progress
const estimatedProgress = Math.min(Math.floor(timeSpent / 3), 100);
```

**Examples:**
- View for 1 minute = 20% progress
- View for 2.5 minutes = 50% progress
- View for 5 minutes = 100% progress (auto-complete)

### 2. Manual Completion
User can click **"Mark as Complete"** button at any time to set progress to 100%.

### 3. View Duration Tracking
Displays real-time viewing duration in the header:
```
PDF Document • Viewing: 2:35
```

---

## Changes Made

### 1. `client/src/components/FileViewer.jsx`

#### Added Features:
- **View duration counter**: Tracks seconds spent viewing
- **Time formatter**: Displays time as `MM:SS`
- **Mark Complete button**: Blue button to manually complete
- **New prop**: `onMarkComplete` callback

#### New Props:
```javascript
<FileViewer
  file={resource}
  onClose={closeHandler}
  onDownload={downloadHandler}
  onMarkComplete={markCompleteHandler}  // NEW
  downloadsEnabled={true}
/>
```

#### UI Updates:
```
[PDF Document • Viewing: 2:35]  [Mark Complete] [Download] [X]
```

### 2. `client/src/pages/DashboardPage.jsx`

#### Updated Functions:

**`saveProgress(resourceId, progressPercentage, additionalTime)`**
- Now takes `progressPercentage` directly instead of scroll position
- Simpler, more accurate

**`markAsComplete()`** (NEW)
- Sets progress to 100%
- Shows success message
- Updates UI immediately

**`closeViewer()`**
- Auto-saves progress on close
- Calculates progress based on time spent
- Only saves if not already at 100%

**Auto-save interval**:
- Runs every 30 seconds
- Calculates progress: `timeSpent / 3` seconds
- Updates only if < 100%

#### Removed:
- `handleViewerScroll()` - No longer needed
- `scrollPosition` state dependency
- `viewerContentRef` - No longer needed
- Scroll restoration logic

---

## Progress Calculation Logic

### Auto-Progress Formula
```javascript
const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
const estimatedProgress = Math.min(Math.floor(timeSpent / 3), 100);
const newProgress = Math.max(currentProgress, estimatedProgress);
```

### Rules:
1. **Never decrease progress**: `Math.max(current, new)`
2. **Cap at 100%**: `Math.min(progress, 100)`
3. **Gradual increase**: Every 3 seconds = +1%
4. **Auto-complete at 5 minutes**: 300 seconds / 3 = 100%

### Example Timeline:
```
0:00  →  0%   (just opened)
0:30  →  10%  (30s / 3 = 10%)
1:00  →  20%  (60s / 3 = 20%)
2:00  →  40%  (120s / 3 = 40%)
3:00  →  60%  (180s / 3 = 60%)
4:00  →  80%  (240s / 3 = 80%)
5:00  →  100% (300s / 3 = 100% - auto-complete)
```

---

## User Experience

### Opening a Resource
1. User clicks "View" on a PDF
2. FileViewer opens with:
   - PDF displayed via Google Docs Viewer
   - Timer starts: "Viewing: 0:00"
   - Progress tracking begins

### While Viewing
1. Timer counts up: "Viewing: 0:45", "Viewing: 1:30", etc.
2. Every 30 seconds:
   - Auto-calculates progress
   - Saves to database
   - Updates progress bar in resource list
3. User sees progress increase automatically

### Completing a Resource

**Option 1: Auto-Complete (5+ minutes)**
- User views for 5 minutes
- Progress automatically reaches 100%
- Green checkmark appears on resource card

**Option 2: Manual Complete (any time)**
- User clicks "Mark as Complete" button
- Progress jumps to 100%
- Success message: "Resource marked as complete! 🎉"
- Green checkmark appears on resource card

**Option 3: Partial Progress (close early)**
- User closes after 2 minutes
- Progress saved at 40%
- Can resume later from 40%

### Closing the Viewer
1. User clicks "X" to close
2. Final progress is saved
3. Can resume later if < 100%

---

## Progress Display

### On Resource Cards:
```javascript
{hasProgress && (
  <div className="mb-3">
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-gray-600">Your Progress</span>
      <span className="font-semibold text-mut-primary">
        {progress.progress}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${
          isCompleted ? 'bg-green-500' : 'bg-mut-primary'
        }`}
        style={{ width: `${progress.progress}%` }}
      ></div>
    </div>
  </div>
)}
```

### Completion Badge:
```javascript
{isCompleted && (
  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
    <CheckCircle className="w-4 h-4" />
  </div>
)}
```

---

## API Integration

### Update Progress
```javascript
POST /api/progress/:resourceId

Body:
{
  "progressPercentage": 75,     // 0-100
  "lastPosition": "75",          // String representation
  "timeSpent": 150              // Total seconds spent
}

Response:
{
  "status": "success",
  "data": {
    "resourceId": 123,
    "userId": 456,
    "progress": 75,
    "completed": false,
    "timeSpent": 150,
    "lastPosition": "75",
    "lastAccessed": "2026-09-09T12:34:56Z"
  }
}
```

### Get Progress
```javascript
GET /api/progress/:resourceId

Response:
{
  "status": "success",
  "data": {
    "progress": 75,
    "completed": false,
    "timeSpent": 150,
    "lastPosition": "75"
  }
}
```

---

## Testing Guide

### Test Case 1: Auto-Progress
1. Open a PDF file
2. Wait 30 seconds
3. Check resource card → should show ~10% progress
4. Wait another 30 seconds
5. Check again → should show ~20% progress
6. Continue for 5 minutes
7. Should auto-complete at 100%

### Test Case 2: Manual Complete
1. Open a PDF file
2. After any amount of time, click "Mark as Complete"
3. Should see success message
4. Close viewer
5. Check resource card → should show 100% with green checkmark

### Test Case 3: Partial Progress
1. Open a PDF file
2. View for 1 minute
3. Close viewer
4. Check resource card → should show ~20% progress
5. Open same file again
6. Should resume from ~20%

### Test Case 4: Multiple Sessions
1. Open a PDF, view for 1 minute, close (20% progress)
2. Open again, view for 1 minute, close (40% progress)
3. Open again, view for 1 minute, close (60% progress)
4. Progress should accumulate across sessions

### Test Case 5: Time Display
1. Open any file
2. Verify timer starts at "Viewing: 0:00"
3. After 1 minute, should show "Viewing: 1:00"
4. After 90 seconds, should show "Viewing: 1:30"
5. Timer should update every second

---

## Advantages of This Approach

### ✅ Works with Any Viewer
- Google Docs Viewer
- Microsoft Office Viewer
- Direct PDF embed
- No cross-origin issues

### ✅ User Control
- Can mark complete instantly
- Don't have to scroll to last page
- Flexible completion criteria

### ✅ Automatic Tracking
- Still tracks time automatically
- Estimates progress
- No manual intervention required

### ✅ Smart Logic
- Progress never decreases
- Auto-saves regularly
- Persists across sessions

### ✅ Clear Feedback
- Real-time timer display
- Progress bar updates
- Completion confirmation

---

## Limitations & Future Enhancements

### Current Limitations
1. **Time-based is estimated**: Not based on actual pages viewed
2. **5-minute threshold**: Arbitrary, may be too short/long for some resources
3. **No page tracking**: Can't show "Page 5 of 20"

### Possible Future Enhancements

#### 1. PDF.js Integration
Use PDF.js library to:
- Count actual PDF pages
- Track which pages user has viewed
- Show page navigation
- More accurate progress

#### 2. Adjustable Time Thresholds
Let users or admins configure:
- Minutes required for auto-complete
- Progress calculation rate
- Warning before auto-complete

#### 3. Page-Level Tracking
For PDFs specifically:
- Extract page count from PDF
- Track page views
- Calculate: `progress = (pagesViewed / totalPages) * 100`

#### 4. Video Progress
For video files:
- Use video player API
- Track playback position
- Calculate: `progress = (currentTime / duration) * 100`

#### 5. Smart Recommendations
Based on progress data:
- "Resume where you left off"
- "Similar resources you might like"
- "Complete your in-progress resources"

---

## Configuration

### Adjusting Auto-Complete Time
To change the 5-minute threshold, modify the formula in `DashboardPage.jsx`:

```javascript
// Current: 5 minutes = 100%
const estimatedProgress = Math.min(Math.floor(timeSpent / 3), 100);

// For 10 minutes = 100%
const estimatedProgress = Math.min(Math.floor(timeSpent / 6), 100);

// For 3 minutes = 100%
const estimatedProgress = Math.min(Math.floor(timeSpent / 1.8), 100);
```

### Adjusting Auto-Save Interval
Currently saves every 30 seconds:

```javascript
// Current: 30 seconds
setInterval(() => { ... }, 30000);

// For 1 minute
setInterval(() => { ... }, 60000);

// For 15 seconds
setInterval(() => { ... }, 15000);
```

---

## Deployment Notes

### Database
No schema changes needed - existing `study_progress` table supports this:
- `progress_percentage`: Stores 0-100 value
- `time_spent`: Accumulates total seconds
- `last_position`: Stores progress value as string

### Backward Compatibility
✅ Fully compatible with existing progress data
✅ Old scroll-based progress values still work
✅ New time-based values use same fields

### Migration
No data migration needed - seamless upgrade

---

## Summary

The new progress tracking system:
1. ✅ **Works with Google Docs Viewer** (no cross-origin issues)
2. ✅ **Time-based auto-progress** (gradual, automatic)
3. ✅ **Manual completion button** (user control)
4. ✅ **Real-time timer** (clear feedback)
5. ✅ **Smart auto-save** (every 30 seconds)
6. ✅ **Never loses progress** (accumulates across sessions)
7. ✅ **Auto-complete at 5 minutes** (optional, user can complete earlier)

Users can now properly track their reading progress and see meaningful completion percentages!
