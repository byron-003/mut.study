# 📄 Word to PDF Conversion Feature

## What's New?

The MUT Study Hub platform now **automatically converts Word documents to PDF** before uploading them to cloud storage. This ensures all study materials are in a standardized, universally accessible format.

## Key Features

✅ **Automatic Conversion** - Upload .doc or .docx files, get PDF in storage  
✅ **Multiple Strategies** - LibreOffice (high quality) + Mammoth (fallback)  
✅ **Zero Config** - Works out of the box with fallback support  
✅ **Graceful Handling** - Never blocks uploads, even if conversion fails  
✅ **Metadata Tracking** - Know which files were converted and how  
✅ **Memory Efficient** - Processes files in memory, no disk writes  

## How It Works

```
User Uploads Word Doc → Server Receives → Converts to PDF → Uploads to Cloudinary → Stores in DB
```

### Example

**Before:**
- User uploads: `lecture_notes.docx`
- Stored as: `lecture_notes.docx` (Word format)
- Users need Word/Office to view

**After:**
- User uploads: `lecture_notes.docx`
- Converted to: `lecture_notes.pdf` (PDF format)
- Anyone can view in browser, no software needed

## For Users

**Nothing changes!** Just upload Word documents as usual:

- Upload .doc or .docx files normally
- System automatically converts to PDF
- Files appear as PDFs in your course resources
- View directly in browser, no downloads needed

## For Developers

### Client-Side (No Changes Needed)

Your existing upload code works without modification:

```javascript
// This code doesn't need to change!
const formData = new FormData();
formData.append('file', wordFile);  // Can be .docx
formData.append('title', 'My Notes');
formData.append('courseId', courseId);

await fetch('/api/resources/upload', {
  method: 'POST',
  body: formData
});
```

### Server-Side (Already Integrated)

The conversion pipeline is automatically active in the upload route:

```
POST /api/resources/upload
→ Authentication
→ File size check
→ Multer upload (memory)
→ Convert Word to PDF (if needed)
→ Upload to Cloudinary
→ Save to database
```

### New Response Field

Converted files include metadata:

```json
{
  "status": "success",
  "data": {
    "fileType": "application/pdf",
    "conversionInfo": {
      "converted": true,
      "method": "libreoffice",
      "originalFormat": "docx"
    }
  }
}
```

## For System Administrators

### Option 1: Install LibreOffice (Recommended)

**Best quality conversion with full formatting support**

```bash
# Ubuntu/Debian
sudo apt-get install libreoffice

# Windows
choco install libreoffice

# macOS
brew install --cask libreoffice
```

### Option 2: Use Fallback (No Installation)

**Basic text conversion, works out of the box**

- Don't install anything
- System uses Mammoth + PDF-lib automatically
- Good for testing and development
- Converts text content (may lose formatting)

### Verify Installation

```javascript
// In server console or startup script
import { checkLibreOfficeAvailability } from './server/services/documentConverter.js';

const available = await checkLibreOfficeAvailability();
console.log('LibreOffice:', available ? '✅ Available' : '⚠️ Using fallback');
```

## Documentation

📚 **Full Documentation:** [`server/WORD_TO_PDF_CONVERSION.md`](./server/WORD_TO_PDF_CONVERSION.md)  
🔧 **Setup Guide:** [`server/SETUP_LIBREOFFICE.md`](./server/SETUP_LIBREOFFICE.md)

### Quick Links

- **Architecture & How It Works** → `WORD_TO_PDF_CONVERSION.md#architecture`
- **Conversion Methods** → `WORD_TO_PDF_CONVERSION.md#conversion-methods`
- **Installation Guide** → `SETUP_LIBREOFFICE.md`
- **Troubleshooting** → `WORD_TO_PDF_CONVERSION.md#troubleshooting`
- **Performance** → `WORD_TO_PDF_CONVERSION.md#performance-considerations`

## Technical Details

### Dependencies (Already Installed)

```json
{
  "docx-pdf": "^0.0.1",      // LibreOffice wrapper
  "pdf-lib": "^1.17.1",       // PDF generation
  "mammoth": "^1.6.0"         // Text extraction (already in project)
}
```

### Modified Files

- ✅ `server/services/documentConverter.js` - New conversion service
- ✅ `server/config/cloudinary.js` - Memory storage + buffer upload
- ✅ `server/routes/resourceRoutes.js` - Integration middleware
- ✅ `server/controllers/resourceController.js` - Buffer-based upload

## Testing

### Quick Test

1. Start your server:
   ```bash
   npm run dev
   ```

2. Upload a Word document through the web interface or API

3. Check logs for conversion status:
   ```
   🔄 Starting conversion for: test.docx
   ✅ Document converted using LibreOffice
   ✅ File uploaded to Cloudinary: test_1234567890
   ```

4. Verify the file in Cloudinary is a PDF

### Manual API Test

```bash
curl -X POST http://localhost:5000/api/resources/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample.docx" \
  -F "title=Test Document" \
  -F "courseId=1"
```

## FAQ

**Q: Do I need to install anything?**  
A: No! The system works with a fallback method. Installing LibreOffice provides better quality.

**Q: What if conversion fails?**  
A: The original Word document is uploaded with a warning. Uploads never fail due to conversion.

**Q: Does this work with .doc (old Word format)?**  
A: Yes! Both .doc and .docx are supported.

**Q: Can I disable conversion?**  
A: Currently, conversion is automatic. To disable, remove `convertDocumentMiddleware` from the upload route.

**Q: What about other formats (Excel, PowerPoint)?**  
A: Currently only Word documents. Other formats can be added similarly.

**Q: How much memory does conversion use?**  
A: ~2-3x the file size. A 5MB Word doc uses ~10-15MB during conversion.

**Q: How long does conversion take?**  
A: LibreOffice: 2-5 seconds. Mammoth: <1 second.

## Rollback (If Needed)

To revert to direct uploads without conversion:

1. **Remove conversion middleware:**
   ```javascript
   // In routes/resourceRoutes.js
   // Remove: convertDocumentMiddleware
   ```

2. **Revert to CloudinaryStorage:**
   ```javascript
   // In config/cloudinary.js
   // Change: storage: memoryStorage
   // Back to: storage: storage (CloudinaryStorage)
   ```

3. **Update controller:**
   ```javascript
   // In controllers/resourceController.js
   // Change: uploadBufferToCloudinary(req.file.buffer, ...)
   // Back to: req.file.path and req.file.filename
   ```

## Support & Issues

- 📖 Check documentation in `server/WORD_TO_PDF_CONVERSION.md`
- 🔍 Review server logs for conversion errors
- 🐛 Report issues with sample files for debugging
- 💬 Ask questions about specific conversion failures

---

**Feature Version:** 1.0.0  
**Last Updated:** September 23, 2026  
**Status:** ✅ Production Ready
