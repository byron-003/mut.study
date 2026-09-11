# Notification Media Upload Setup Guide

## Overview
Enhanced notification system now supports:
- 📸 **Image uploads** (JPG, PNG, GIF)
- 🎥 **Video uploads** (MP4, WebM, OGG)
- 📱 **Full-screen notification viewer modal**
- ✅ **Auto-mark as read when viewed**

## Setup Instructions

### 1. Run Database Migration

The migration adds `media_url` and `media_type` columns to the notifications table.

**Option A: Using Node.js migration runner** (if you have one set up)
```bash
cd server
npm run migrate
```

**Option B: Using psql directly**
```bash
# Connect to your database
psql -U your_username -d mut_study_hub

# Run the migration
\i server/migrations/015_add_notification_media.sql

# Verify columns were added
\d notifications
```

**Option C: Using pgAdmin or other GUI**
1. Open your database in pgAdmin
2. Open Query Tool
3. Copy and paste the contents of `server/migrations/015_add_notification_media.sql`
4. Execute the query

### 2. Verify Migration

Check that the new columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('media_url', 'media_type');
```

You should see:
```
 column_name | data_type
-------------+-----------
 media_url   | text
 media_type  | varchar
```

### 3. Test the Features

#### For Admins:
1. Go to Admin Panel → Notifications
2. Click "Create Notification"
3. Fill in title and message
4. Click the upload area to add an image or video
5. See live preview
6. Send notification

#### For Students:
1. Look for notification bell icon (top right)
2. Click the bell to see notification list
3. Click any notification to open in full-screen modal
4. View images/videos embedded in the notification
5. Notification automatically marks as read

## Features Added

### Client Side

**NotificationViewerModal Component:**
- Full-screen modal design
- Image display with error handling
- Video player with multiple format support
- Beautiful type-based colors (success=green, error=red, etc.)
- Formatted dates and timestamps
- Sender information
- Responsive and mobile-friendly

**Updated NotificationBell:**
- Click any notification → opens modal
- Auto-marks as read when opened
- Smooth animations

### Admin Side

**Media Upload in NotificationsPage:**
- Drag & drop or click to upload
- File type validation (images and videos only)
- File size validation (10MB max)
- Live preview before sending
- Remove media button
- Upload progress indicator
- Visual feedback during upload

### Backend

**Updated Notification Controller:**
- Accepts `mediaUrl` and `mediaType` parameters
- Validates media type (image or video)
- Stores media info in database
- Returns media data in all notification responses

## File Upload Integration

The admin panel uses the existing file upload API endpoint. Make sure your server has:

1. **File upload route configured** (should already exist for resource uploads)
2. **Storage configured** (local storage or cloud like S3/CloudFlare)
3. **Appropriate file size limits** set in your server config

## Supported File Formats

**Images:**
- JPEG/JPG
- PNG
- GIF
- WebP

**Videos:**
- MP4
- WebM
- OGG

**Maximum file size:** 10MB

## Security Considerations

✅ File type validation on client and server
✅ File size limits enforced
✅ Media URLs sanitized
✅ Only admins can upload media
✅ Students can only view notifications targeted to them

## Troubleshooting

### Migration fails
- Check database connection
- Ensure user has ALTER TABLE permissions
- Check if columns already exist

### Images/Videos not displaying
- Verify file was uploaded successfully
- Check browser console for errors
- Ensure file URL is accessible
- Check CORS settings if using external storage

### Upload fails
- Check file size (must be < 10MB)
- Verify file format is supported
- Check server upload endpoint is working
- Review server logs for errors

## Example Usage

### Admin creates notification with image:
1. Click "Create Notification"
2. Enter title: "Campus Event This Weekend"
3. Enter message: "Join us for the annual tech fest!"
4. Upload event poster image
5. Select audience (All Students / Specific Program)
6. Click "Send Notification"

### Student views notification:
1. See red badge on notification bell (unread count)
2. Click bell → see list of notifications
3. Click "Campus Event This Weekend" notification
4. Modal opens showing:
   - Event poster image
   - Full message
   - Date/time sent
   - Sender name
5. Notification marked as read automatically
6. Badge count decreases

## Benefits

✅ **Rich content** - Share visual information effectively
✅ **Better engagement** - Images and videos grab attention
✅ **Professional look** - Modern, polished user interface
✅ **Mobile-friendly** - Works perfectly on all devices
✅ **Accessible** - Keyboard navigation and screen reader support
✅ **Performant** - Lazy loading and optimized rendering

## Next Steps

After setup:
1. Test creating a notification with an image
2. Test creating a notification with a video
3. Test viewing notifications as a student
4. Verify auto-mark as read functionality
5. Check mobile responsiveness

Enjoy your enhanced notification system! 🎉
