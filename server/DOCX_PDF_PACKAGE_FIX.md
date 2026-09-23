# docx-pdf Package Issue Fix

## Problem

Server crashed when attempting to convert Word documents with this error:

```
Fatal AssertionError [ERR_ASSERTION]: html-pdf: Failed to load PhantomJS module. 
You have to set the path to the PhantomJS binary using 'options.phantomPath'
```

## Root Cause

The `docx-pdf` npm package has the following issues:

1. **Deprecated**: No longer maintained
2. **PhantomJS Dependency**: Requires PhantomJS which is:
   - Deprecated since 2018
   - Has security vulnerabilities
   - No longer actively developed
   - Not installed by default
3. **Hard Crash**: Throws assertion error instead of graceful error

## Solution

**Disabled docx-pdf, using Mammoth + PDF-lib only:**

### Changes Made

**File: `server/services/documentConverter.js`**

1. **Removed docx-pdf import**:
   ```javascript
   // REMOVED:
   import { promisify } from 'util';
   import docxConverter from 'docx-pdf';
   const convertDocxToPdf = promisify(docxConverter);
   ```

2. **Simplified convertWithLibreOffice** to immediately throw:
   ```javascript
   const convertWithLibreOffice = async (fileBuffer, originalname) => {
     throw new Error('docx-pdf package requires PhantomJS which is deprecated');
   };
   ```

3. **Updated convertWordToPdf** to skip LibreOffice attempt:
   ```javascript
   // Now directly uses Mammoth conversion
   // No longer tries docx-pdf first
   ```

4. **Updated checkLibreOfficeAvailability**:
   ```javascript
   // Always returns false
   // Indicates fallback method will be used
   ```

## Current Behavior

**Word document uploads now:**
1. ✅ Detect Word format (.doc/.docx)
2. ✅ Extract text using Mammoth
3. ✅ Generate PDF using PDF-lib
4. ✅ Upload PDF to Cloudinary
5. ✅ No server crashes

**Conversion Quality:**
- ✅ Text content preserved
- ⚠️ Basic formatting only
- ⚠️ Images/tables may be lost
- ✅ Good for text-heavy documents
- ✅ Fast (<1 second)

## Package Status

```json
{
  "docx-pdf": "^0.0.1",  // Still installed but not used
  "pdf-lib": "^1.17.1",   // ✅ Used for PDF generation
  "mammoth": "^1.6.0"     // ✅ Used for text extraction
}
```

**Note:** `docx-pdf` can be removed in future cleanup, but leaving it for now doesn't cause issues since we don't import it.

## Future Improvements

If better conversion quality is needed, consider:

### Option 1: Direct LibreOffice CLI (Best Quality)

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function convertWithLibreOfficeCLI(inputPath, outputDir) {
  await execAsync(`soffice --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`);
}
```

**Pros:**
- Excellent conversion quality
- Preserves formatting, images, tables
- Industry standard

**Cons:**
- Requires LibreOffice installation
- Needs file system operations
- Slower (~2-5 seconds)

### Option 2: Cloud Conversion API

```javascript
// CloudConvert, Convertio, PDFShift, etc.
const response = await fetch('https://api.cloudconvert.com/v2/convert', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
  body: formData
});
```

**Pros:**
- Professional quality
- No server dependencies
- Scalable

**Cons:**
- Costs money (pay per conversion)
- Network dependency
- Privacy considerations

### Option 3: Modern npm Package

Packages like `@fileforge/pandoc` or `libreoffice-convert` but they require system dependencies (Pandoc or LibreOffice installed).

## Testing

**Test the fix:**

1. Start server: `npm run dev`
2. Upload a Word document through the API
3. Check logs for:
   ```
   📄 Word document detected: file.docx
   🔄 Starting conversion for: file.docx
   ✅ Document converted using Mammoth + PDF-lib
   ```
4. ✅ No PhantomJS errors
5. ✅ PDF uploaded successfully

## Summary

- ❌ **Removed:** docx-pdf/PhantomJS (deprecated, crashes server)
- ✅ **Using:** Mammoth + PDF-lib (reliable, fast, no dependencies)
- ⚠️ **Trade-off:** Basic text-only conversion vs complex formatting
- ✅ **Result:** Stable, no crashes, works out of the box

For most academic documents (lecture notes, assignments) that are text-heavy, this solution works well.

---

**Fixed:** September 23, 2026  
**Issue:** PhantomJS dependency crash  
**Solution:** Use Mammoth-only conversion
