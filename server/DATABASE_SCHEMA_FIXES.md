# Database Schema Fixes

## Fixed Schema Mismatches

This document lists all database column mismatches that were fixed between the actual database schema and the application code.

---

## Database Schema Reference

### `study_materials` Table Columns:
- `id`, `course_id`, `uploader_id`
- `title`, `description`, `category` (**NOT** `type`)
- `file_url` (**NOT** `file_path`), `cloudinary_public_id`
- `file_size`, `file_type`
- `status`, `approved_by` (**NOT** `reviewed_by`), `approved_at` (**NOT** `reviewed_at`)
- `rejection_reason`, `download_count`
- `created_at`, `updated_at`
- **NOTE**: NO `academic_year` column (it's in `courses` table)

### `courses` Table Columns:
- `id`, `program_id`
- `unit_code`, `unit_title`
- `academic_year` (**NOT** in `study_materials`), `semester`
- `credits`, `description`
- `created_at`, `updated_at`
- **NOTE**: NO `level` column (it's in `programs` table)

### `programs` Table Columns:
- `id`, `department_id`
- `name`, `code`
- `level` (**NOT** in `courses` table)
- `duration_years`, `description`
- `created_at`, `updated_at`

### `users` Table Columns:
- `id`, `email`, `password_hash` (**NOT** `password`)
- `first_name`, `last_name`, `role`
- `program_id`, `is_active`
- `created_at`, `updated_at`

---

## Fixed Issues in `server/controllers/adminController.js`

### 1. ✅ Fixed: `sm.type` → `sm.category`
**Location**: Multiple queries
**Fix**: Use `sm.category as type` (database has `category`, frontend expects `type`)

```sql
-- BEFORE (WRONG):
SELECT sm.type FROM study_materials sm

-- AFTER (CORRECT):
SELECT sm.category as type FROM study_materials sm
```

---

### 2. ✅ Fixed: `sm.reviewed_by` → `sm.approved_by`
**Location**: getResources query and all UPDATE queries
**Fix**: Use `sm.approved_by as reviewed_by` in SELECT, `approved_by` in UPDATE

```sql
-- BEFORE (WRONG):
SELECT sm.reviewed_by FROM study_materials sm
LEFT JOIN users reviewer ON sm.reviewed_by = reviewer.id
UPDATE study_materials SET reviewed_by = $1

-- AFTER (CORRECT):
SELECT sm.approved_by as reviewed_by FROM study_materials sm
LEFT JOIN users reviewer ON sm.approved_by = reviewer.id
UPDATE study_materials SET approved_by = $1
```

---

### 3. ✅ Fixed: `sm.reviewed_at` → `sm.approved_at`
**Location**: getResources query and all UPDATE queries
**Fix**: Use `sm.approved_at as reviewed_at` in SELECT, `approved_at` in UPDATE

```sql
-- BEFORE (WRONG):
SELECT sm.reviewed_at FROM study_materials sm
UPDATE study_materials SET reviewed_at = NOW()

-- AFTER (CORRECT):
SELECT sm.approved_at as reviewed_at FROM study_materials sm
UPDATE study_materials SET approved_at = NOW()
```

---

### 4. ✅ Fixed: `sm.file_path` → `sm.file_url`
**Location**: getResources and deleteResource
**Fix**: Use `sm.file_url as file_path` (database has `file_url`, frontend expects `file_path`)

```sql
-- BEFORE (WRONG):
SELECT sm.file_path FROM study_materials sm

-- AFTER (CORRECT):
SELECT sm.file_url as file_path FROM study_materials sm
```

---

### 5. ✅ Fixed: `c.level` → `p.level`
**Location**: getCourses query
**Fix**: `level` is in `programs` table, not `courses` table

```sql
-- BEFORE (WRONG):
SELECT c.level FROM courses c WHERE c.level = 'Degree'

-- AFTER (CORRECT):
SELECT p.level FROM courses c 
JOIN programs p ON c.program_id = p.id
WHERE p.level = 'Degree'
```

---

### 6. ✅ Fixed: `sm.academic_year` → `c.academic_year`
**Location**: getResources query filter
**Fix**: `academic_year` is in `courses` table, not `study_materials` table

```sql
-- BEFORE (WRONG):
WHERE sm.academic_year = 2

-- AFTER (CORRECT):
WHERE c.academic_year = 2
```

---

## Fixed Issues in `server/scripts/createAdmin.js`

### 7. ✅ Fixed: `password` → `password_hash`
**Location**: INSERT query
**Fix**: The `users` table column is `password_hash`, not `password`

```sql
-- BEFORE (WRONG):
INSERT INTO users (email, password, ...) VALUES (...)

-- AFTER (CORRECT):
INSERT INTO users (email, password_hash, ...) VALUES (...)
```

---

## Summary of Changes

| File | Line Area | Wrong Column | Correct Column | Status |
|------|-----------|--------------|----------------|--------|
| adminController.js | getStats | `sm.type` | `sm.category as type` | ✅ Fixed |
| adminController.js | getResources SELECT | `sm.type` | `sm.category as type` | ✅ Fixed |
| adminController.js | getResources SELECT | `sm.reviewed_by` | `sm.approved_by as reviewed_by` | ✅ Fixed |
| adminController.js | getResources SELECT | `sm.reviewed_at` | `sm.approved_at as reviewed_at` | ✅ Fixed |
| adminController.js | getResources SELECT | `sm.file_path` | `sm.file_url as file_path` | ✅ Fixed |
| adminController.js | getResources SELECT | `c.level` | `p.level` (JOIN programs) | ✅ Fixed |
| adminController.js | getResources SELECT | `sm.academic_year` | `c.academic_year` | ✅ Fixed |
| adminController.js | getResources WHERE | `sm.academic_year` | `c.academic_year` | ✅ Fixed |
| adminController.js | getResources JOIN | `sm.reviewed_by` | `sm.approved_by` | ✅ Fixed |
| adminController.js | approveResource | `reviewed_by` | `approved_by` | ✅ Fixed |
| adminController.js | approveResource | `reviewed_at` | `approved_at` | ✅ Fixed |
| adminController.js | rejectResource | `reviewed_by` | `approved_by` | ✅ Fixed |
| adminController.js | rejectResource | `reviewed_at` | `approved_at` | ✅ Fixed |
| adminController.js | bulkApproveResources | `reviewed_by` | `approved_by` | ✅ Fixed |
| adminController.js | bulkApproveResources | `reviewed_at` | `approved_at` | ✅ Fixed |
| adminController.js | bulkRejectResources | `reviewed_by` | `approved_by` | ✅ Fixed |
| adminController.js | bulkRejectResources | `reviewed_at` | `approved_at` | ✅ Fixed |
| adminController.js | deleteResource | `file_path` | `file_url` | ✅ Fixed |
| adminController.js | getCourses SELECT | `c.level` | `p.level` | ✅ Fixed |
| adminController.js | getCourses WHERE | `c.level` | `p.level` | ✅ Fixed |
| adminController.js | getAnalytics | `type` | `category as type` | ✅ Fixed |
| createAdmin.js | INSERT | `password` | `password_hash` | ✅ Fixed |

---

## Testing Checklist

After fixing these issues, test the following:

### Admin Portal Tests:
- [ ] Dashboard loads without errors
- [ ] Resources list displays correctly
- [ ] Resources can be filtered by type, status, academic_year
- [ ] Resources can be approved/rejected
- [ ] Bulk approve/reject works
- [ ] Resource details show correct information
- [ ] Courses list displays with correct program level
- [ ] Courses can be filtered by level
- [ ] Analytics page loads
- [ ] Reports generate correctly

### Admin User Creation:
- [ ] Run `npm run create-admin`
- [ ] Admin user created successfully
- [ ] Can login with admin credentials

---

## Prevention

To prevent similar issues in the future:

1. **Always refer to `server/scripts/initDatabase.js`** for the authoritative schema
2. **Use database migrations** when changing column names
3. **Run integration tests** that query actual database
4. **Use TypeScript** with typed database queries
5. **Add schema validation** in development mode
6. **Document all column aliases** used for frontend compatibility

---

## Related Files

- Schema definition: `server/scripts/initDatabase.js`
- Admin controller: `server/controllers/adminController.js`
- Admin script: `server/scripts/createAdmin.js`
- This document: `server/DATABASE_SCHEMA_FIXES.md`
