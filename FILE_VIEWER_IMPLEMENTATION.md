# File Viewer Implementation - Fix for Cloudinary Files

## Problem
Cloudinary stores files as "raw" resource type, meaning URLs don't have file extensions (e.g., `.pdf`). The old code checked URLs with regex patterns like `fileUrl.match(/\.(pdf)$/i)`, which always failed, causing "Preview not available" errors.

## Solution
Created a universal **FileViewer component** that uses **MIME types from the database** instead of parsing URL extensions.

---

## Changes Made

### 1. Created `client/src/components/FileViewer.jsx`
A universal file viewer component with the following features:

#### Supported File Types:
- **PDF Documents**: 
  - Primary: Direct iframe embed
  - Fallback: Google Docs Viewer (`https://docs.google.com/viewer`)
- **Images**: Native `<img>` tag (JPEG, PNG, GIF, WebP, BMP)
- **Videos**: Native `<video>` tag with controls (MP4, WebM, OGG)
- **Office Documents**: 
  - Microsoft Office Online Viewer
  - Supports: Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx)
- **Text Files**: Iframe preview

#### Features:
- Full-screen modal viewer with dark background
- Header showing file title and type
- Download button (respects admin download settings)
- Close button
- Error handling with fallback options
- Responsive design

#### Props:
```javascript
<FileViewer 
  file={{
    fileUrl: string,      // Cloudinary URL
    fileType: string,     // MIME type (e.g., 'application/pdf')
    title: string         // Resource title
  }}
  onClose={function}      // Called when user clicks close
  onDownload={function}   // Called when user clicks download
  downloadsEnabled={bool} // Whether downloads are enabled by admin
/>
```

### 2. Updated `client/src/pages/DashboardPage.jsx`
- Imported and integrated FileViewer component
- Replaced inline viewer logic with `<FileViewer />` usage
- Viewer shows when user clicks "View" button on any resource

### 3. Updated `client/src/pages/MyUploadsPage.jsx`
- Imported and integrated FileViewer component
- Replaced inline viewer logic with `<FileViewer />` usage
- Viewer shows when user clicks "View" button on uploaded resources

### 4. Backend Changes

#### `server/controllers/resourceController.js`
- Changed MIME type storage from `substring(0, 50)` to `substring(0, 100)`
- This allows storing long Office document MIME types like:
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### Database Migration
- Ran `server/scripts/fixFileTypeColumn.js`
- Expanded `file_type` column from `VARCHAR(50)` to `VARCHAR(100)`
- This ensures long MIME types aren't truncated

---

## How It Works

### Old Flow (BROKEN):
```
1. Get file URL from database
2. Check URL extension: fileUrl.match(/\.(pdf)$/i)
3. ❌ Cloudinary URLs have no extension → FAILED
4. Show "Preview not available"
```

### New Flow (FIXED):
```
1. Get file URL AND fileType (MIME type) from database
2. Check MIME type: if (fileType === 'application/pdf')
3. ✅ MIME type is stored in database → SUCCESS
4. Show appropriate viewer (PDF embed, image, video, etc.)
```

---

## Testing Guide

### Prerequisites
1. Ensure database migration has run: `cd server && node scripts/fixFileTypeColumn.js`
2. Start the server: `cd server && npm start`
3. Start the client: `cd client && npm run dev`

### Test Cases

#### 1. Test PDF Files
1. Upload a PDF file
2. After approval, click "View" button
3. **Expected**: PDF should display in the viewer
   - Primary: Direct embed in iframe
   - Fallback: Google Docs Viewer if direct embed fails
4. Check browser console for debug logs:
   ```
   FileViewer - File info: {
     title: "Your PDF Title",
     fileUrl: "https://res.cloudinary.com/...",
     fileType: "application/pdf",
     hasFileType: true
   }
   ```

#### 2. Test Word Documents (.docx)
1. Upload a Word document
2. Click "View" button
3. **Expected**: Document displays via Microsoft Office Online Viewer
4. Check console for MIME type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### 3. Test Excel Spreadsheets (.xlsx)
1. Upload an Excel file
2. Click "View" button
3. **Expected**: Spreadsheet displays via Microsoft Office Online Viewer
4. Check console for MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

#### 4. Test PowerPoint Presentations (.pptx)
1. Upload a PowerPoint file
2. Click "View" button
3. **Expected**: Presentation displays via Microsoft Office Online Viewer
4. Check console for MIME type: `application/vnd.openxmlformats-officedocument.presentationml.presentation`

#### 5. Test Images
1. Upload an image (JPEG, PNG, GIF)
2. Click "View" button
3. **Expected**: Image displays in full screen with proper scaling
4. Check console for MIME type: `image/jpeg`, `image/png`, etc.

#### 6. Test Videos
1. Upload a video (MP4, WebM)
2. Click "View" button
3. **Expected**: Video player with controls
4. Check console for MIME type: `video/mp4`, `video/webm`, etc.

#### 7. Test Unsupported File Types
1. Upload a ZIP file or other unsupported format
2. Click "View" button
3. **Expected**: 
   - Message: "Preview not available for this file type"
   - Download button displayed
   - No error in console

#### 8. Test Error Handling
1. Upload a file with a broken/invalid Cloudinary URL
2. Click "View" button
3. **Expected**:
   - Error message: "Unable to load file preview"
   - Download button as fallback
   - Console shows error log

### Debugging

If viewer doesn't work:

1. **Check Browser Console**:
   ```javascript
   // You should see:
   FileViewer - File info: {
     title: "...",
     fileUrl: "https://res.cloudinary.com/...",
     fileType: "application/pdf", // Or other MIME type
     hasFileType: true
   }
   ```

2. **Check Network Tab**:
   - Verify file URL is accessible
   - Check for CORS errors
   - Verify response has correct Content-Type header

3. **Check Database**:
   ```sql
   SELECT id, title, file_type, file_url 
   FROM study_materials 
   WHERE id = YOUR_RESOURCE_ID;
   ```
   - Ensure `file_type` is populated
   - Ensure it's not truncated

4. **Check API Response**:
   ```bash
   # In browser DevTools Network tab, check the resource API response
   # Should include:
   {
     "fileType": "application/pdf",
     "fileUrl": "https://res.cloudinary.com/..."
   }
   ```

---

## MIME Type Reference

### Documents
- **PDF**: `application/pdf`
- **Word (.doc)**: `application/msword`
- **Word (.docx)**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Excel (.xls)**: `application/vnd.ms-excel`
- **Excel (.xlsx)**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **PowerPoint (.ppt)**: `application/vnd.ms-powerpoint`
- **PowerPoint (.pptx)**: `application/vnd.openxmlformats-officedocument.presentationml.presentation`

### Images
- **JPEG**: `image/jpeg` or `image/jpg`
- **PNG**: `image/png`
- **GIF**: `image/gif`
- **WebP**: `image/webp`
- **BMP**: `image/bmp`

### Videos
- **MP4**: `video/mp4`
- **WebM**: `video/webm`
- **OGG**: `video/ogg`

### Other
- **Text**: `text/plain`
- **ZIP**: `application/zip`
- **RAR**: `application/x-rar-compressed`

---

## Viewer Strategy

### PDF Files
1. **Try Direct Embed**: `<iframe src={fileUrl} />`
   - Fast, no third-party dependency
   - May fail on some browsers/configurations
2. **Fallback to Google Docs**: `<iframe src={googleDocsUrl} />`
   - High compatibility
   - Works even if direct embed fails

### Office Documents
- **Microsoft Office Online Viewer**: `https://view.officeapps.live.com/op/embed.aspx?src={fileUrl}`
- No fallback needed (MS viewer is highly reliable)

### Images & Videos
- Native HTML `<img>` and `<video>` tags
- Browser handles rendering automatically

---

## Known Limitations

1. **Internet Connection Required**: 
   - Google Docs Viewer and MS Office Online Viewer require internet
   - Files must be publicly accessible

2. **Large Files**: 
   - Very large PDFs may load slowly in Google Docs Viewer
   - Consider file size warnings for uploads > 10MB

3. **Cloudinary Public Access**: 
   - Files must be publicly accessible for viewers to work
   - Ensure Cloudinary resources are set to "public" resource_type

4. **Browser Compatibility**: 
   - Some older browsers may not support all features
   - PDF direct embed may fail on mobile browsers

---

## Future Enhancements

1. **Progress Tracking**: 
   - Save user's scroll position in PDFs
   - Resume from last viewed page

2. **Zoom Controls**: 
   - Add zoom in/out buttons for PDFs and images
   - Fit-to-width vs fit-to-screen options

3. **Page Navigation**: 
   - Show page number for multi-page PDFs
   - Next/Previous page buttons

4. **Full-Screen Mode**: 
   - Native browser full-screen API
   - Hide header for distraction-free reading

5. **Offline Support**: 
   - Cache frequently accessed files
   - Service worker for offline viewing

6. **Annotations**: 
   - Allow students to highlight and take notes
   - Save annotations to database

---

## Deployment Checklist

Before deploying to production:

- [x] Run database migration: `node server/scripts/fixFileTypeColumn.js`
- [x] Update resourceController.js to store full MIME type
- [x] Create FileViewer component
- [x] Integrate FileViewer in DashboardPage
- [x] Integrate FileViewer in MyUploadsPage
- [ ] Test all file types (PDF, Word, Excel, PowerPoint, images, videos)
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Test with actual Cloudinary-hosted files
- [ ] Monitor browser console for errors
- [ ] Check server logs for any issues

---

## Rollback Plan

If issues occur in production:

1. **Quick Fix**: Revert to old viewer code (show download button only)
2. **Database**: File type column change is backward compatible (VARCHAR(100) can still store VARCHAR(50) data)
3. **Files**: No changes to uploaded files, only viewer logic changed

---

## Support

For issues or questions:
- Check browser console for debug logs
- Verify MIME type is stored in database
- Test file URL accessibility
- Check Cloudinary configuration
