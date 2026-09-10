# Database VARCHAR Fix - File Type Column Too Short

## Issue
Upload fails with database error:
```
error: value too long for type character varying(50)
```

## Root Cause
The `file_type` column in `study_materials` table is VARCHAR(50), but modern MIME types can be much longer.

**Examples of long MIME types**:
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (73 chars) - DOCX
- `application/vnd.openxmlformats-officedocument.presentationml.presentation` (78 chars) - PPTX
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (67 chars) - XLSX

These exceed the 50-character limit!

---

## Solution
Increase the `file_type` column size from VARCHAR(50) to VARCHAR(100).

---

## Migration Script

**File**: `server/scripts/fixFileTypeColumn.js`

### What It Does
```sql
ALTER TABLE study_materials 
ALTER COLUMN file_type TYPE VARCHAR(100);
```

Changes the column from 50 to 100 characters to accommodate all MIME types.

---

## How to Run

### 1. Navigate to server folder
```bash
cd server
```

### 2. Run the migration
```bash
npm run db:fix-file-type
```

### 3. Expected Output
```
🔧 Fixing file_type column in study_materials table...
✅ Successfully updated file_type column to VARCHAR(100)
   This allows longer MIME types like:
   - application/vnd.openxmlformats-officedocument.wordprocessingml.document
   - application/vnd.openxmlformats-officedocument.presentationml.presentation
   - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

✅ Migration completed successfully!
```

---

## Verification

### Check the change worked:
```sql
-- Connect to your database and run:
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'study_materials' 
AND column_name = 'file_type';
```

**Expected result**:
```
column_name | data_type       | character_maximum_length
------------|-----------------|-------------------------
file_type   | character varying | 100
```

---

## What This Fixes

### Before Migration
❌ DOCX files fail (MIME type too long)
❌ PPTX files fail (MIME type too long)  
❌ XLSX files fail (MIME type too long)
✅ PDF files work (MIME type: `application/pdf` - 15 chars)
✅ ZIP files work (MIME type: `application/zip` - 15 chars)

### After Migration
✅ All file types work
✅ DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
✅ PPTX: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
✅ XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
✅ All other formats

---

## MIME Types and Their Lengths

| Format | MIME Type | Length |
|--------|-----------|--------|
| PDF | `application/pdf` | 15 |
| DOC | `application/msword` | 19 |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 73 ⚠️ |
| PPT | `application/vnd.ms-powerpoint` | 30 |
| PPTX | `application/vnd.openxmlformats-officedocument.presentationml.presentation` | 78 ⚠️ |
| XLS | `application/vnd.ms-excel` | 24 |
| XLSX | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | 67 ⚠️ |
| ZIP | `application/zip` | 15 |
| PNG | `image/png` | 9 |
| JPG | `image/jpeg` | 10 |
| MP4 | `video/mp4` | 9 |
| MP3 | `audio/mpeg` | 10 |

⚠️ = Exceeds VARCHAR(50) limit

---

## No Data Loss

This migration is **safe** and causes **no data loss**:
- ✅ Existing records are preserved
- ✅ Only increases column size
- ✅ No data conversion needed
- ✅ No downtime required
- ✅ Instant operation

---

## Troubleshooting

### Migration fails with "permission denied"?

**Solution**: Check database user has ALTER TABLE permission:
```sql
GRANT ALTER ON TABLE study_materials TO your_db_user;
```

### Migration fails with "relation does not exist"?

**Solution**: Check table name is correct and database is connected:
```bash
# Verify DB_NAME in .env matches your database
echo $DB_NAME
```

### Still getting VARCHAR error after migration?

**Possible causes**:

1. **Migration didn't run**
   - Check output for success message
   - Verify in database with SQL query above

2. **Different column causing error**
   - Check error line number in stack trace
   - May be different column with VARCHAR limit

3. **Server using old connection pool**
   - Restart server after migration
   ```bash
   # Stop server (Ctrl+C)
   npm start
   ```

---

## Alternative: Manual SQL

If npm script doesn't work, run SQL directly:

### Using psql:
```bash
psql -h your-host -p your-port -U your-user -d your-database

# Then run:
ALTER TABLE study_materials ALTER COLUMN file_type TYPE VARCHAR(100);
```

### Using pgAdmin or Database GUI:
1. Connect to database
2. Find `study_materials` table
3. Right-click → Properties
4. Go to Columns tab
5. Find `file_type` column
6. Change Data type to `character varying(100)`
7. Save

---

## Future-Proofing

### Why VARCHAR(100)?
- Current longest MIME type: 78 characters
- Leaves room for future formats
- Still reasonable for indexing
- Small memory overhead

### Why not TEXT?
- VARCHAR(100) is more efficient for indexing
- Faster equality comparisons
- Better for database optimization
- MIME types never exceed 100 characters

### If you need more space:
```sql
-- Change to 200 characters
ALTER TABLE study_materials ALTER COLUMN file_type TYPE VARCHAR(200);

-- Or use TEXT for unlimited
ALTER TABLE study_materials ALTER COLUMN file_type TYPE TEXT;
```

---

## Testing After Fix

### 1. Upload Different File Types
- [ ] PDF file
- [ ] DOCX file (was failing)
- [ ] PPTX file (was failing)
- [ ] XLSX file (was failing)
- [ ] Image file
- [ ] Video file

### 2. Check Database
```sql
SELECT id, title, file_type, LENGTH(file_type) as mime_length
FROM study_materials 
ORDER BY created_at DESC 
LIMIT 10;
```

Should show file_type values without truncation.

### 3. Verify No Errors
- Check server console
- Check browser console
- Upload should complete successfully
- Progress bar should reach 100%

---

## Date
December 2024

## Status
✅ Ready to run

## Priority
🔴 CRITICAL - Blocks DOCX, PPTX, XLSX uploads

## Impact
- Fixes upload errors for Office documents
- Enables all file type uploads
- No data loss or downtime
- One-time operation

---

## Command Summary

```bash
# Run the migration
cd server
npm run db:fix-file-type

# Then restart server
npm start

# Test upload with DOCX file
# Should work now!
```
