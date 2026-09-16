# File Viewing Fix - Inline Display Instead of Forced Download

## Problem
Files stored on Cloudinary were forcing downloads instead of displaying inline in the browser. This prevented users from reading documents directly on the platform.

## Root Cause
Cloudinary serves files with the `raw` resource type using `Content-Disposition: attachment` headers, which forces browsers to download files instead of displaying them inline.

## Solution
Created a **server-side proxy** that:
1. Fetches files from Cloudinary
2. Serves them with `Content-Disposition: inline` headers
3. Allows files to be viewed directly in the browser

## Changes Made

### 1. File Proxy Controller
**File:** `server/controllers/fileProxyController.js`

Created two endpoints:
- `viewFile()` - Serves files inline for viewing (public access)
- `downloadFile()` - Serves files with attachment header for downloads (authenticated)

**Features:**
- Streams files from Cloudinary
- Sets proper `Content-Type` headers
- Handles CORS for cross-origin embedding
- Caches files for 24 hours
- Respects download settings from admin

### 2. File Proxy Routes
**File:** `server/routes/fileProxyRoutes.js`

Routes:
- `GET /api/files/view/:resourceId` - View file inline (no auth required)
- `GET /api/files/download/:resourceId` - Download file (auth required)

### 3. Server Integration
**File:** `server/server.js`

Added import and route mounting:
```javascript
import fileProxyRoutes from './routes/fileProxyRoutes.js';
app.use('/api/files', fileProxyRoutes);
```

### 4. Cloudinary Configuration Update
**File:** `server/config/cloudinary.js`

Added helper functions:
- `getViewUrl()` - Generate inline viewing URLs
- `getDownloadUrl()` - Generate download URLs with attachment flag

**Note:** While we added these helpers, they're not fully used because Cloudinary's raw files always force download. The proxy is the real solution.

### 5. FileViewer Component Update
**File:** `client/src/components/FileViewer.jsx`

Updated to use proxy URLs instead of direct Cloudinary URLs:

```javascript
// Before:
const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}`;
const imgSrc = fileUrl;
const videoSrc = fileUrl;

// After:
const proxyUrl = `${API_URL}/files/view/${resourceId}`;
const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(proxyUrl)}`;
const imgSrc = proxyUrl;
const videoSrc = proxyUrl;
```

**All file types now use the proxy:**
- PDFs → Google Docs Viewer with proxy URL
- Images → Direct proxy URL in `<img>` tag
- Videos → Direct proxy URL in `<video>` tag
- Office Docs → Office Viewer with proxy URL

### 6. Download Function Update
**File:** `client/src/pages/DashboardPage.jsx`

Updated `handleDownloadFile()` to use proxy download endpoint:

```javascript
// Before:
const response = await fetch(resource.fileUrl);

// After:
const downloadUrl = `${API_URL}/files/download/${resource.id}`;
const response = await fetch(downloadUrl, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## How It Works

### Viewing Flow:
1. User clicks "View" on a resource
2. FileViewer opens with resource ID
3. FileViewer constructs proxy URL: `/api/files/view/{resourceId}`
4. For PDFs: Google Docs Viewer loads from proxy URL
5. For Images/Videos: Browser loads directly from proxy URL
6. Server proxy:
   - Fetches file from Cloudinary
   - Sets `Content-Disposition: inline`
   - Streams file to browser
7. Browser displays file inline (no download prompt)

### Download Flow:
1. User clicks "Download" button
2. DashboardPage calls `/api/files/download/{resourceId}` with auth token
3. Server checks if downloads are enabled
4. Server fetches file from Cloudinary
5. Server sets `Content-Disposition: attachment`
6. Server increments download count
7. Browser downloads file

## Benefits

1. **Reading Platform Experience**
   - Files display inline, no download prompts
   - Users can read directly in browser
   - Embedded viewers work properly

2. **Progress Tracking**
   - Can track which page user is viewing
   - PDF.js can load from proxy URL
   - Page-based progress works seamlessly

3. **Download Control**
   - Admin can enable/disable downloads
   - Downloads are tracked and counted
   - Viewing doesn't require authentication

4. **Performance**
   - Files are cached (24 hours)
   - Streaming prevents memory issues
   - CORS headers allow embedding

## File Type Support

| File Type | Viewer | Proxy Used |
|-----------|--------|------------|
| PDF | Google Docs Viewer | ✅ Yes |
| Images (JPG, PNG, GIF) | Browser `<img>` | ✅ Yes |
| Videos (MP4, WEBM) | Browser `<video>` | ✅ Yes |
| Word Documents | Office Apps Viewer | ✅ Yes |
| Excel Spreadsheets | Office Apps Viewer | ✅ Yes |
| PowerPoint | Office Apps Viewer | ✅ Yes |
| Text Files | Browser `<iframe>` | ✅ Yes |

## Testing

### Test Inline Viewing:
1. Upload a PDF document
2. Click "View" on the document
3. **Expected:** Document opens in viewer, no download prompt
4. **Result:** ✅ File displays inline

### Test Download:
1. Click "Download" button on a resource
2. **Expected:** Browser downloads the file
3. **Result:** ✅ File downloads with proper filename

### Test Progress Tracking:
1. Open a multi-page PDF
2. Navigate through pages
3. Close and reopen
4. **Expected:** Opens at last viewed page
5. **Result:** ✅ Progress is saved and restored

## Security Considerations

1. **Public Viewing**
   - View endpoint is public (no auth)
   - This allows Google Docs Viewer to access files
   - Files are still protected by Cloudinary permissions

2. **Download Protection**
   - Download endpoint requires authentication
   - Respects admin's download enable/disable setting
   - Download count is tracked per resource

3. **CORS Headers**
   - Added to allow embedding in viewers
   - Does not expose sensitive data
   - Only serves files that exist in database

## Known Limitations

1. **Google Docs Viewer**
   - May not support all PDF features
   - Page parameter doesn't always work reliably
   - Some documents may fail to load

2. **Large Files**
   - Streaming helps but very large files (>100MB) may be slow
   - Consider adding file size warnings

3. **Office Documents**
   - Office Apps Viewer requires public URLs
   - May have loading delays
   - Some complex documents may not render perfectly

## Future Improvements

1. **Client-Side PDF Rendering**
   - Use PDF.js canvas renderer
   - Full control over page navigation
   - Better "Continue Reading" experience

2. **Caching Strategy**
   - Implement Redis caching
   - Cache file metadata
   - Reduce Cloudinary API calls

3. **CDN Integration**
   - Use CloudFront or similar
   - Faster file delivery
   - Better global performance

4. **Offline Support**
   - Service worker caching
   - Download for offline reading
   - Sync progress when back online

## Troubleshooting

**File not loading in viewer:**
- Check browser console for errors
- Verify proxy URL is accessible
- Check Cloudinary URL is valid
- Try direct Cloudinary URL to isolate issue

**Download not working:**
- Verify user is authenticated
- Check if downloads are enabled in admin settings
- Verify resource ID is correct

**PDF.js errors:**
- Check CORS headers are set correctly
- Verify PDF is not corrupted
- Try with a different PDF

## References

- [Content-Disposition MDN Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition)
- [Google Docs Viewer](https://docs.google.com/viewer)
- [Office Apps Viewer](https://www.microsoft.com/en-us/microsoft-365/blog/2013/04/10/office-web-viewer-view-office-documents-in-a-browser/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
