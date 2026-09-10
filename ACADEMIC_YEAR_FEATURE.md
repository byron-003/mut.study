# Academic Year Feature - Enhanced Upload System

## 🎯 Overview

The upload modal now includes comprehensive academic information: **Year of Study**, **Semester**, and **Academic Year** to improve organization, searchability, and data quality.

## ✨ New Fields

### 1. Year of Study
- **Type**: Dropdown (select)
- **Options**: Year 1, Year 2, Year 3, Year 4, Year 5
- **Purpose**: Indicates which year the course belongs to
- **Example**: Year 2 for second-year courses

### 2. Semester
- **Type**: Dropdown (select)
- **Options**: Semester 1, Semester 2
- **Purpose**: Indicates which semester the course is taught
- **Example**: Semester 1 (September-December), Semester 2 (January-May)

### 3. Academic Year
- **Type**: Dropdown (select)
- **Format**: `YYYY/YYYY` (e.g., `2026/2027`)
- **Options**: Current academic year + past 5 years
- **Purpose**: Indicates when the resource was used/relevant
- **Validation**: Cannot upload for future academic years
- **Example**: 2026/2027, 2025/2026, 2024/2025

## 📝 Complete Upload Form

```
┌──────────────────────────────────────────────────┐
│  Upload Resource                             [X] │
├──────────────────────────────────────────────────┤
│                                                  │
│  📝 Title *                                      │
│  [Week 3 Lecture Notes - Arrays_____________]   │
│                                                  │
│  📄 Description                                  │
│  [Comprehensive notes on arrays__________]       │
│  [_____________________________________]         │
│                                                  │
│  📚 Resource Type *    🔢 Unit Code *            │
│  [Lecture Notes▼]      [CSC 2101________]       │
│                                                  │
│  📖 Unit Name *                                  │
│  [Data Structures and Algorithms_______]         │
│                                                  │
│  📅 Year of Study *  📆 Semester *  📅 Academic Year *│
│  [Year 2▼]           [Semester 1▼]  [2026/2027▼]│
│                                                  │
│  📎 File * (Max 10MB)                            │
│  [Choose File] → notes.pdf (2.5 MB)             │
│                                                  │
│  [✅ Upload Resource]  [Cancel]                  │
└──────────────────────────────────────────────────┘
```

## 🔒 Validation Rules

### Frontend Validation:
1. **All fields required** - Cannot submit with empty fields
2. **Academic year format** - Must match `YYYY/YYYY` pattern
3. **File size** - Maximum 10MB
4. **Unit code** - Auto-converts to uppercase

### Backend Validation:
1. **Required fields**:
   - ✅ Title
   - ✅ Type
   - ✅ Unit Code
   - ✅ Unit Name
   - ✅ Year of Study
   - ✅ Semester
   - ✅ Academic Year

2. **Format validation**:
   - Academic year must match `/^\d{4}\/\d{4}$/`
   - Example: `2026/2027` ✅, `2026-2027` ❌, `26/27` ❌

3. **Future year prevention**:
   ```javascript
   Current date: September 15, 2026
   Current academic year: 2026/2027
   
   Upload attempts:
   - 2026/2027 ✅ Allowed (current year)
   - 2025/2026 ✅ Allowed (past year)
   - 2027/2028 ❌ Blocked (future year)
   - 2030/2031 ❌ Blocked (too far in future)
   ```

4. **Year/Semester validation**:
   - Year must be 1-5
   - Semester must be 1 or 2

## 🧮 Academic Year Calculation

### Determining Current Academic Year:

```javascript
// September-December → Current year is start year
// January-August → Previous year is start year

Examples:
- Date: September 15, 2026 → Academic Year: 2026/2027
- Date: March 10, 2026 → Academic Year: 2025/2026
- Date: December 31, 2026 → Academic Year: 2026/2027
- Date: January 1, 2027 → Academic Year: 2026/2027
```

### Academic Year Options:

The dropdown shows:
1. **Current academic year** (default selection)
2. **Past 5 years** (for uploading historical resources)

Example on September 2026:
```
[2026/2027] ← Current (default)
[2025/2026]
[2024/2025]
[2023/2024]
[2022/2023]
[2021/2022]
```

## 💾 Database Structure

### Study Materials Table:
```sql
ALTER TABLE study_materials 
ADD COLUMN academic_year VARCHAR(9) 
CHECK (academic_year ~ '^\d{4}/\d{4}$');

CREATE INDEX idx_materials_academic_year 
ON study_materials(academic_year);
```

### Example Record:
```json
{
  "id": 123,
  "title": "Week 3 Lecture Notes - Arrays",
  "type": "notes",
  "unitCode": "CSC 2101",
  "unitName": "Data Structures and Algorithms",
  "yearOfStudy": 2,
  "semester": 1,
  "academicYear": "2026/2027",
  "fileUrl": "https://...",
  "status": "pending"
}
```

## 🔍 Benefits for Search & Organization

### 1. Better Search Results
Students can find resources by:
- Specific academic year
- Year of study
- Semester
- Course code
- Resource type

### 2. Chronological Organization
```
CSC 2101 - Data Structures and Algorithms
├─ 2026/2027
│  ├─ Year 2, Semester 1
│  │  ├─ Lecture Notes (5)
│  │  ├─ Assignments (3)
│  │  └─ Past Papers (2)
│  └─ Year 2, Semester 2
│     └─ Lecture Notes (4)
├─ 2025/2026
│  └─ Year 2, Semester 1
│     └─ Lecture Notes (3)
```

### 3. Resource Freshness
- See which year the resource is from
- Identify up-to-date vs. historical materials
- Track curriculum changes over years

### 4. Better Analytics
- Track uploads per academic year
- Identify active vs. inactive periods
- Monitor resource coverage by year/semester

## 🚀 User Workflows

### Complete Upload Example:

**Scenario**: Student uploading Week 5 notes for Data Structures course

1. **Open Upload Modal**
   - Click "Upload Resource" button

2. **Fill Basic Info**
   - Title: "Week 5 Lecture Notes - Linked Lists"
   - Description: "Covers singly, doubly linked lists, and circular lists"
   - Type: Lecture Notes

3. **Course Information**
   - Unit Code: CSC 2101
   - Unit Name: Data Structures and Algorithms

4. **Academic Context** ✨ NEW
   - Year of Study: Year 2
   - Semester: Semester 1
   - Academic Year: 2026/2027 (auto-selected current year)

5. **Upload File**
   - Select PDF file
   - Verify size < 10MB

6. **Submit**
   - Click "Upload Resource"
   - See success message
   - Resource added with pending status

**Total time: ~45 seconds** ⚡

## 📊 Data Flow

```
User fills form including academic details
    ↓
Frontend validates:
  - All fields filled
  - Academic year format (YYYY/YYYY)
  - File size ≤ 10MB
    ↓
Backend receives data
    ↓
Backend validates:
  - Required fields present
  - Academic year format correct
  - Academic year not in future
  - Year/Semester values valid
    ↓
Find or create course:
  - Match: unit_code + year + semester
  - If not exists: create with details
    ↓
Insert study_material:
  - Link to course
  - Store academic_year
  - Set status = pending
    ↓
Return success with full details
    ↓
Display in My Uploads list
```

## 🗄️ Database Migration

### Run Migration:
```powershell
cd server
npm run db:add-academic-year
```

### What it does:
1. Checks if `academic_year` column exists
2. Adds column if missing:
   - Type: `VARCHAR(9)`
   - Constraint: Must match `YYYY/YYYY` format
3. Creates index on `academic_year` for fast queries
4. Confirms success

### Output:
```
🔄 Adding academic_year column to study_materials table...
✅ Successfully added academic_year column
✅ Created index on academic_year column
🎉 Migration completed successfully!
```

## 🎨 UI Design

### Field Layout:
```
Row 1: [Title (full width)]
Row 2: [Description (full width, multiline)]
Row 3: [Resource Type (50%)] [Unit Code (50%)]
Row 4: [Unit Name (full width)]
Row 5: [Year (33%)] [Semester (33%)] [Academic Year (33%)]
Row 6: [File Upload (full width)]
Row 7: [Upload Button] [Cancel Button]
```

### Visual Hierarchy:
1. **Primary info** (Title, Description) - Large, prominent
2. **Course info** (Type, Code, Name) - Medium importance
3. **Academic context** (Year, Semester, Academic Year) - Supporting info
4. **File** - Action-oriented
5. **Buttons** - Clear CTAs

## 🔮 Future Enhancements

### Search & Filter:
- [ ] Filter by academic year in dashboard
- [ ] Show "Latest" badge for current year resources
- [ ] Archive old academic year resources
- [ ] "Show only current year" toggle

### Analytics:
- [ ] Most active academic years
- [ ] Upload trends by semester
- [ ] Year-over-year comparisons
- [ ] Coverage gaps by year/semester

### Smart Features:
- [ ] Auto-suggest academic year based on upload date
- [ ] Warn when uploading old academic year content
- [ ] Highlight when curriculum changed
- [ ] Compare resources across academic years

### Admin Tools:
- [ ] Bulk update academic years
- [ ] Merge duplicate courses from different years
- [ ] Generate reports by academic year
- [ ] Archive entire academic year

## 📞 Support & FAQs

### Q: What is the academic year format?
**A**: Always `YYYY/YYYY` with a forward slash. Example: `2026/2027`, `2025/2026`

### Q: Which academic year should I select?
**A**: Select the year when you used/received the resource. Default is the current academic year.

### Q: Can I upload resources from previous years?
**A**: Yes! You can upload resources from the past 5 academic years.

### Q: Why can't I select future academic years?
**A**: To prevent uploading speculative or incorrect content. You can only upload for current and past years.

### Q: What if I select the wrong academic year?
**A**: You can edit the resource metadata after upload (if the field is editable), or delete and re-upload.

### Q: Does academic year affect approval?
**A**: No, class reps approve based on content quality, regardless of academic year.

### Q: How is academic year different from year of study?
**A**:
- **Year of Study**: Which year the course is taught (Year 1-5)
- **Academic Year**: When the resource was used (2026/2027, 2025/2026, etc.)

Example: A Year 2 course in 2026/2027 academic year.

## 🎉 Summary

The new academic year fields provide:

✅ **Better Organization** - Resources categorized by year, semester, and academic year
✅ **Improved Search** - Find resources for specific periods
✅ **Quality Control** - Prevent future-dated uploads
✅ **Historical Tracking** - See evolution of course materials
✅ **Smart Defaults** - Auto-selects current academic year
✅ **Validation** - Ensures data integrity
✅ **Scalability** - Supports years of historical data

**Result**: More organized, searchable, and useful resource library! 📚🚀
