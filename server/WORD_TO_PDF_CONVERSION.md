# Word to PDF Conversion System

## Overview

The MUT Study Hub platform now automatically converts Word documents (.doc, .docx) to PDF format before uploading them to Cloudinary. This ensures that all study materials are stored in a standardized, universally accessible PDF format.

## Architecture

### Conversion Pipeline

```
User Upload → Authentication → File Size Check → Multer (Memory Storage) 
→ Document Conversion → Cloudinary Upload → Database Storage → Response
```

### Key Components

1. **Document Converter Service** (`services/documentConverter.js`)
   - Main conversion logic with multiple fallback strategies
   - Detects Word documents and triggers conversion
   - Handles conversion failures gracefully

2. **Cloudinary Configuration** (`config/cloudinary.js`)
   - Switched from direct CloudinaryStorage to memory storage
   - Added `uploadBufferToCloudinary()` function for buffer uploads
   - Maintains file type validation and size checking

3. **Resource Routes** (`routes/resourceRoutes.js`)
   - Integrates conversion middleware into upload pipeline
   - Maintains authentication and authorization checks

4. **Resource Controller** (`controllers/resourceController.js`)
   - Handles buffer-based uploads to Cloudinary
   - Includes conversion metadata in responses
   - Proper error handling with Cloudinary cleanup

## Conversion Methods

The system uses **Mammoth + PDF-lib** for document conversion:

### Current Method: Mammoth + PDF-lib

**Requirements:**
- No external dependencies required
- Works out of the box

**Process:**
1. Extracts text from Word document using Mammoth
2. Creates PDF from extracted text using PDF-lib
3. Adds basic formatting and pagination

**Advantages:**
- ✅ No external dependencies required
- ✅ Fast conversion (<1 second)
- ✅ Works on any system
- ✅ No installation needed

**Limitations:**
- ⚠️ Text-only conversion (basic formatting)
- ⚠️ May lose images, tables, and complex formatting
- ⚠️ Best for simple text documents

### Why Not LibreOffice?

The original plan included LibreOffice conversion via the `docx-pdf` npm package, but:
- ❌ `docx-pdf` is deprecated and unmaintained
- ❌ Requires PhantomJS (no longer maintained, security issues)
- ❌ Installation complexity on various systems
- ❌ Would crash the server with assertion errors

### Future Enhancement Options

For better formatting preservation in production, consider:

1. **Direct LibreOffice CLI** (best quality)
   ```bash
   soffice --headless --convert-to pdf document.docx --outdir ./output
   ```
   Requires LibreOffice installation but provides excellent conversion quality.

2. **Cloud Conversion APIs**
   - CloudConvert API
   - Convertio API
   - PDFShift
   - Professional quality, pay-per-conversion

3. **Modern npm packages**
   - `@fileforge/pandoc` - Uses Pandoc for conversion
   - `libreoffice-convert` - Direct LibreOffice integration
   - Requires additional system dependencies

### Graceful Failure (Safety Net)

If Mammoth conversion fails, the system uploads the original Word document with a warning flag. This ensures uploads never fail completely due to conversion issues.

## Usage

### For Developers

The conversion happens **automatically** in the upload pipeline. No code changes needed in client applications.

**Example Upload Request:**

```javascript
const formData = new FormData();
formData.append('file', wordDocumentFile); // .doc or .docx
formData.append('title', 'Lecture Notes Week 5');
formData.append('courseId', '123');

const response = await fetch('/api/resources/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.data.fileType); // Will be 'application/pdf' after conversion
```

**Response with Conversion Metadata:**

```json
{
  "status": "success",
  "message": "Resource uploaded successfully",
  "data": {
    "id": 456,
    "title": "Lecture Notes Week 5",
    "fileUrl": "https://res.cloudinary.com/..../lecture_notes_week_5.pdf",
    "fileType": "application/pdf",
    "conversionInfo": {
      "converted": true,
      "method": "libreoffice",
      "originalFormat": "docx"
    }
  }
}
```

### For System Administrators

**Check LibreOffice Availability:**

```javascript
import { checkLibreOfficeAvailability } from './services/documentConverter.js';

const isAvailable = await checkLibreOfficeAvailability();
console.log('LibreOffice available:', isAvailable);
```

**Monitor Conversion Logs:**

The system logs conversion attempts and results:

```
📄 Word document detected: lecture_notes.docx
🔄 Starting conversion for: lecture_notes.docx
✅ Document converted using Mammoth + PDF-lib
✅ File uploaded to Cloudinary: lecture_notes_1234567890
```

Failed conversions log warnings but don't block uploads:

```
⚠️ Mammoth conversion failed: No text content extracted
⚠️ Conversion failed, uploading original file
```

## Configuration

### Environment Variables

No additional environment variables needed. The system uses existing Cloudinary configuration:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=mut_study_hub_docs
```

### Supported File Types

The system automatically detects and converts:
- `.doc` - Microsoft Word 97-2003
- `.docx` - Microsoft Word 2007+

Other file types pass through unchanged.

### File Size Limits

Conversion respects existing file size limits configured in the admin panel or environment variables.

## API Changes

### Breaking Changes

**None.** The conversion is transparent to client applications.

### New Response Fields

- `conversionInfo`: Optional object with conversion metadata
  - `converted`: Boolean indicating if conversion occurred
  - `method`: String ('libreoffice', 'mammoth', or 'none')
  - `originalFormat`: String (e.g., 'docx')

## Performance Considerations

### Memory Usage

- Files are processed in memory (not written to disk)
- Memory usage = ~2-3x the original file size during conversion
- Automatic cleanup after upload completes

### Conversion Speed

| Method | Speed | Quality |
|--------|-------|---------|
| Mammoth + PDF-lib | < 1 second | Basic (text only) |

For a 1MB Word document:
- Mammoth conversion: ~0.5-1 second total upload time

### Recommendations

1. **For Current Use:** Mammoth works fine for text-heavy documents
2. **For Production with Better Quality:** Consider implementing direct LibreOffice CLI conversion
3. **For High Volume:** Consider dedicated conversion server or cloud API
4. **For Complex Documents:** May need to accept Word format or implement advanced conversion

## Troubleshooting

### Issue: "Mammoth conversion failed: No text content extracted"

**Cause:** Word document is empty or contains only images/objects

**Solution:** This is expected behavior. The system will upload the original document. For documents with only images, users should upload as PDF or image files instead.

### Issue: "Cloudinary upload error"

**Cause:** Network issue or Cloudinary configuration problem

**Solution:** Check Cloudinary credentials and network connectivity. The system automatically cleans up failed uploads.

### Issue: "ENOSPC: no space left on device"

**Cause:** Server disk is full

**Solution:** 
1. Free up disk space
2. The conversion uses memory storage, minimal disk usage
3. Check temporary directories and clean old files

## Testing

### Manual Testing

**Test Mammoth Conversion:**

No external tools needed - conversion happens automatically when you upload a Word document.

**Test Upload:**

```bash
curl -X POST http://localhost:5000/api/resources/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample.docx" \
  -F "title=Test Document" \
  -F "courseId=1"
```

### Automated Testing

```javascript
import { convertWordToPdf } from './services/documentConverter.js';
import fs from 'fs';

// Test conversion
const wordBuffer = fs.readFileSync('./test-files/sample.docx');
const result = await convertWordToPdf(wordBuffer, 'sample.docx');

console.assert(result.success === true, 'Conversion should succeed');
console.assert(result.mimetype === 'application/pdf', 'Output should be PDF');
```

## Security Considerations

1. **File Type Validation:** Only .doc/.docx files trigger conversion
2. **Size Limits:** Respects admin-configured max file size
3. **Memory Safety:** Files processed in memory, no persistent storage
4. **Error Handling:** Failed conversions don't expose system details
5. **Cloudinary Security:** Uses secure HTTPS uploads with authentication

## Future Enhancements

Potential improvements for future versions:

1. **Cloud-Based Conversion:** Integrate with CloudConvert or similar API
2. **Batch Conversion:** Convert multiple files simultaneously
3. **Conversion Queue:** Background processing for large files
4. **Format Options:** Allow users to choose output format
5. **Preview Generation:** Create thumbnail images of PDF pages
6. **OCR Support:** Extract text from scanned documents
7. **Conversion Settings:** Admin panel for conversion preferences

## Support

For issues or questions:
- Check server logs for conversion errors
- Verify LibreOffice installation
- Test with simple Word documents first
- Report issues with sample documents for debugging

## Version History

### v1.0.0 (Current)
- Initial implementation
- LibreOffice and Mammoth conversion methods
- Automatic fallback handling
- Conversion metadata in responses

---

**Last Updated:** September 23, 2026  
**Maintained By:** MUT Study Hub Development Team
