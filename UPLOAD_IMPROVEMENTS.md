# Upload Modal Improvements - Unit Code & Unit Name

## 🎯 Change Summary

The upload modal has been updated to use **Unit Code** and **Unit Name** input fields instead of course dropdowns, providing more flexibility and ease of use.

## ✨ What Changed

### Before:
- **Program dropdown** - Select from list of programs
- **Course dropdown** - Select from courses in that program
- Required both selections
- Limited to existing courses in database

### After:
- **Unit Code input** - Type the course code (e.g., "CSC 2101")
- **Unit Name input** - Type the course name (e.g., "Data Structures and Algorithms")
- More flexible
- Works even if course isn't in database yet

## 📝 New Upload Form Fields

### 1. **Title** (Required)
- Text input
- Example: "Week 5 Lecture Notes - Linked Lists"

### 2. **Description** (Optional)
- Textarea
- Brief description of the resource

### 3. **Resource Type** (Required)
- Dropdown with options:
  - Lecture Notes
  - Assignment
  - Past Paper
  - Video Lecture
  - Other

### 4. **Unit Code** (Required) ✨ NEW
- Text input
- Auto-converts to uppercase (e.g., "csc 2101" → "CSC 2101")
- Placeholder: "e.g., CSC 2101"
- Format examples:
  - CSC 2101
  - MAT 3201
  - ENG 1101
  - PHY 2301

### 5. **Unit Name** (Required) ✨ NEW
- Text input
- Full course title
- Placeholder: "e.g., Data Structures and Algorithms"
- Examples:
  - Data Structures and Algorithms
  - Linear Algebra
  - Introduction to Programming
  - Digital Electronics

### 6. **File** (Required)
- File input
- Max 10MB
- Shows selected file name and size

## 🔄 Backend Logic

### Smart Course Handling:

1. **Check if course exists** by unit code
   ```sql
   SELECT id FROM courses WHERE unit_code = 'CSC 2101'
   ```

2. **If exists:**
   - Use existing course ID
   - Upload resource linked to that course

3. **If doesn't exist:**
   - Create new course record
   - Use user's program ID if available
   - Set default values (Year 1, Semester 1, 3 credits)
   - Upload resource linked to new course

### Automatic Course Creation:
When a student uploads a resource for a course that doesn't exist:
```javascript
INSERT INTO courses (unit_code, unit_title, program_id, year, semester, credits)
VALUES ('CSC 2101', 'Data Structures and Algorithms', userProgramId, 1, 1, 3)
```

## 🎨 UI Design

### Layout:
```
┌─────────────────────────────────────────┐
│  Upload Resource                    [X] │
├─────────────────────────────────────────┤
│                                         │
│  Title *                                │
│  [_________________________________]    │
│                                         │
│  Description                            │
│  [_________________________________]    │
│  [_________________________________]    │
│  [_________________________________]    │
│                                         │
│  Resource Type *    Unit Code *         │
│  [Lecture Notes▼]   [CSC 2101______]   │
│                                         │
│  Unit Name *                            │
│  [Data Structures and Algorithms___]   │
│                                         │
│  File * (Max 10MB)                      │
│  [Choose File]                          │
│  Selected: notes.pdf (2.5 MB)           │
│                                         │
│  [Upload Resource]  [Cancel]            │
└─────────────────────────────────────────┘
```

## 🎯 Benefits

### For Students:
1. **Faster uploads** - No need to select program first
2. **More flexible** - Works for any course
3. **Type course code** - Faster than scrolling through dropdown
4. **No restrictions** - Upload for courses not yet in system
5. **Less clicks** - 2 inputs vs 2 dropdowns with selections

### For the System:
1. **Auto-growing** - Courses added automatically
2. **User-driven** - Students populate course database
3. **Less maintenance** - No need to pre-populate all courses
4. **Flexible** - Works across all programs

### For Class Reps:
1. **More uploads** - Students not blocked by missing courses
2. **Better coverage** - Resources for all courses
3. **Less setup** - Courses created on demand

## 🔍 Validation

### Frontend:
- ✅ Title required
- ✅ Unit code required
- ✅ Unit name required
- ✅ Type required
- ✅ File required
- ✅ File size ≤ 10MB
- ✅ Unit code auto-uppercase

### Backend:
- ✅ All required fields validated
- ✅ File upload verified
- ✅ File size checked
- ✅ Type mapped to valid category
- ✅ Course created if needed
- ✅ Duplicate course codes handled

## 📊 Data Flow

```
User fills form
    ↓
Enters: CSC 2101, Data Structures and Algorithms
    ↓
Clicks Upload
    ↓
Frontend sends: unitCode, unitName, title, type, file
    ↓
Backend checks: Does course "CSC 2101" exist?
    ↓
If YES: Use existing course
If NO: Create new course
    ↓
Upload resource linked to course
    ↓
Return success with course info
    ↓
Resource added to My Uploads (pending status)
```

## 🔒 Security

### Course Creation Protection:
- Only authenticated users can upload
- User's program ID used if available
- Default values for year/semester
- Can't override existing courses
- All uploads require approval

### Input Validation:
- Unit code sanitized (uppercase)
- SQL injection protected (parameterized queries)
- File validation (size, type)
- Required fields enforced

## 📱 User Experience

### Example Upload Flow:

1. **Open upload modal**
   - Click "Upload Resource" button

2. **Fill in title**
   - "Week 3 Lecture Notes - Arrays and Strings"

3. **Add description (optional)**
   - "Covers dynamic arrays, string manipulation, and complexity analysis"

4. **Select type**
   - Choose "Lecture Notes"

5. **Enter unit code**
   - Type "CSC 2101"
   - Automatically converts to uppercase

6. **Enter unit name**
   - Type "Data Structures and Algorithms"

7. **Select file**
   - Choose PDF file
   - See: "Selected: dsa-week3.pdf (1.8 MB)"

8. **Click Upload**
   - Progress indicator shows
   - Success message appears
   - Modal closes
   - Resource appears in list (pending)

**Total time: ~30 seconds** ⚡

## 🎓 Examples

### Common Unit Codes:

**Computer Science:**
- CSC 1101 - Introduction to Programming
- CSC 2101 - Data Structures and Algorithms
- CSC 3301 - Database Management Systems
- CSC 4401 - Artificial Intelligence

**Mathematics:**
- MAT 1201 - Calculus I
- MAT 2301 - Linear Algebra
- MAT 3101 - Differential Equations

**Engineering:**
- ENG 1101 - Engineering Mathematics I
- EEE 2201 - Circuit Analysis
- MEE 3301 - Thermodynamics

**Business:**
- BUS 1101 - Principles of Management
- ACC 2201 - Financial Accounting
- MKT 3301 - Marketing Strategy

## 🔮 Future Enhancements

### Possible Improvements:
- [ ] **Autocomplete** - Suggest unit codes as you type
- [ ] **Recent courses** - Show recently uploaded courses
- [ ] **Popular courses** - List most common courses
- [ ] **Course templates** - Pre-fill from templates
- [ ] **Batch upload** - Multiple files for same course
- [ ] **Year/Semester** - Let user specify (currently defaults to Y1 S1)
- [ ] **Credits** - Let user specify (currently defaults to 3)
- [ ] **Course validation** - Warn if unit code format unusual

### Backend Improvements:
- [ ] **Course merging** - Combine duplicates with different cases
- [ ] **Course enrichment** - Admin can add full course details later
- [ ] **Analytics** - Track most uploaded courses
- [ ] **Suggestions** - Recommend courses based on program

## 📞 Support

### Common Questions:

**Q: What format should unit code be?**
A: Usually `ABC 1234` (letters, space, numbers). System auto-converts to uppercase.

**Q: Do I need to match exact course names?**
A: Try to be consistent. If course exists, exact code matters. Name can vary slightly.

**Q: What if I make a typo in unit code?**
A: Edit the resource after upload, or delete and re-upload with correct code.

**Q: Can I upload for courses not in my program?**
A: Yes! You can upload for any course. All uploads need approval.

**Q: What happens if course already exists?**
A: System uses existing course. Your resource is linked to it.

**Q: What if two people create same course differently?**
A: Unit code is unique. First one creates it, others use it.

## 🎉 Summary

The new **Unit Code + Unit Name** approach makes uploading resources:
- ✅ **Faster** - Type instead of selecting
- ✅ **Easier** - No program selection needed
- ✅ **Flexible** - Works for any course
- ✅ **Smart** - Auto-creates courses as needed
- ✅ **User-friendly** - Clear, simple inputs

**Result:** More uploads, better coverage, happier users! 🚀
