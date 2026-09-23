# Course Creation Fix - Database Schema Mismatch

## Issue
Admin panel was getting 500 Internal Server Error when trying to create courses.

## Root Cause
**Schema Mismatch:** The database uses `academic_year` column (integer 1-6), but the admin controller was trying to insert into a `level` column that doesn't exist.

### Database Schema (from `initDatabase.js`):
```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  unit_code VARCHAR(20) NOT NULL UNIQUE,
  unit_title VARCHAR(255) NOT NULL,
  academic_year INTEGER NOT NULL CHECK (academic_year >= 1 AND academic_year <= 6),
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  credits INTEGER DEFAULT 3,
  program_id INTEGER REFERENCES programs(id),
  ...
);
```

### Controller Issue:
The `createCourse` and `updateCourse` functions were using `level` instead of `academic_year`.

## Fix Applied

### Backend Changes

**File:** `server/controllers/adminController.js`

#### `createCourse` function:
```javascript
// OLD CODE (BROKEN):
const { unit_code, unit_title, level, semester, credits, program_id } = req.body;
INSERT INTO courses (unit_code, unit_title, level, semester, credits, program_id)

// NEW CODE (FIXED):
const { unit_code, unit_title, level, academic_year, semester, credits, program_id } = req.body;
const yearValue = academic_year || level || 1; // Backward compatibility
// Validate yearValue is between 1 and 6
INSERT INTO courses (unit_code, unit_title, academic_year, semester, credits, program_id)
VALUES (..., yearValue, ...)
```

#### `updateCourse` function:
```javascript
// OLD CODE (BROKEN):
const { unit_code, unit_title, level, semester, credits, program_id } = req.body;
UPDATE courses SET level = COALESCE($3, level), ...

// NEW CODE (FIXED):
const { unit_code, unit_title, level, academic_year, semester, credits, program_id } = req.body;
const yearValue = academic_year !== undefined ? academic_year : level;
UPDATE courses SET academic_year = COALESCE($3, academic_year), ...
```

### Frontend Changes

**File:** `admin/src/pages/CoursesPage.jsx`

Updated to handle both `academic_year` (new) and `level` (legacy) for backward compatibility:

```javascript
// OLD CODE:
level: course.level?.toString() || '',
{course.level ? `Level ${course.level}` : 'N/A'}

// NEW CODE:
level: (course.academic_year || course.level)?.toString() || '',
{(course.academic_year || course.level) ? `Year ${course.academic_year || course.level}` : 'N/A'}
```

## Backward Compatibility

The fix maintains backward compatibility:

1. **Frontend sends:** `level` field (unchanged)
2. **Backend accepts:** Both `level` and `academic_year`
3. **Backend prioritizes:** `academic_year` if provided, falls back to `level`
4. **Database stores:** `academic_year` column
5. **Backend returns:** `academic_year` in response
6. **Frontend displays:** Checks both fields for display

This approach ensures:
- Existing API calls continue to work
- New code can use `academic_year` directly
- No breaking changes for other clients
- Smooth transition path

## Testing

### Manual Test:
1. Log in as admin
2. Navigate to Courses Management
3. Click "Create Course"
4. Fill in course details:
   - Unit Code: TEST101
   - Unit Title: Test Course
   - Program: Select any program
   - Year: 1-6
   - Semester: 1 or 2
   - Credits: 3
5. Click "Create Course"
6. ✅ Course should be created successfully

### API Test:
```bash
curl -X POST https://mut-study.onrender.com/api/admin/courses \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "unit_code": "TEST101",
    "unit_title": "Test Course",
    "level": 1,
    "semester": 1,
    "credits": 3,
    "program_id": 1
  }'
```

Expected Response:
```json
{
  "status": "success",
  "message": "Course created successfully",
  "data": {
    "id": 123,
    "unit_code": "TEST101",
    "unit_title": "Test Course",
    "academic_year": 1,
    "semester": 1,
    "credits": 3,
    "program_id": 1
  }
}
```

## Related Files Modified

- ✅ `server/controllers/adminController.js` - Fixed `createCourse` and `updateCourse`
- ✅ `admin/src/pages/CoursesPage.jsx` - Updated to handle both field names

## Database Schema Reference

The `academic_year` field represents the year of study (1-6):
- 1 = First Year
- 2 = Second Year
- 3 = Third Year
- 4 = Fourth Year
- 5 = Fifth Year
- 6 = Sixth Year (if applicable)

This is consistent with how the field is used throughout the codebase:
- `server/controllers/resourceController.js`
- `server/controllers/classRepController.js`
- `server/controllers/searchController.js`
- `server/controllers/schoolController.js`

## Status
✅ **FIXED** - Course creation now works correctly in the admin panel.

---

**Fixed:** September 23, 2026  
**Issue:** Database column mismatch (`level` vs `academic_year`)  
**Impact:** High - Prevented all course creation by admins  
**Priority:** Critical  
