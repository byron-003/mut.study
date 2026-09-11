# Dashboard Simplification - Implementation Guide

## Goal
Redesign dashboard to show only course cards with resource count. Users click "View Details" to see resources on CoursePage.

## Quick Summary
- ✅ CoursePage.jsx already exists - it will handle showing resources
- ❌ Remove individual resource cards from dashboard
- ❌ Remove "Upload Resource" button from dashboard header  
- ✅ Keep simple filter dropdowns
- ✅ Show course cards in grid with "View Details" button

## Changes Needed

### File: `client/src/pages/DashboardPage.jsx`

The file is backed up at: `client/src/pages/DashboardPage.jsx.backup`

### Change 1: Update Search Placeholder
**Line ~48** (in header section)
```javascript
// Change from:
placeholder="Search resources by title or description..."

// To:
placeholder="Search courses by name or code..."
```

### Change 2: Remove Upload Button
**Around line ~57** (in header)
Remove this entire button:
```javascript
<button
  onClick={() => navigate('/my-uploads')}
  className="bg-white text-mut-primary px-4 py-2 rounded-lg hover:bg-green-50 flex items-center gap-2 font-medium"
>
  <Upload className="w-4 h-4" />
  Upload Resources
</button>
```

### Change 3: Simplify Filter Section
**Around line ~90-120**
Replace the complex filter card with:
```javascript
{/* Filter Section - Clean Dropdown Design */}
<div className="bg-white rounded-lg shadow-md p-6 mb-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* Academic Year */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Academic Year
      </label>
      <select
        value={selectedAcademicYear}
        onChange={(e) => setSelectedAcademicYear(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary text-gray-900"
      >
        {getAcademicYearOptions().map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>

    {/* Year of Study */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Year of Study
      </label>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary text-gray-900"
      >
        <option value="1">Year 1</option>
        <option value="2">Year 2</option>
        <option value="3">Year 3</option>
        <option value="4">Year 4</option>
        <option value="5">Year 5</option>
      </select>
    </div>

    {/* Semester */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Semester
      </label>
      <select
        value={selectedSemester}
        onChange={(e) => setSelectedSemester(Number(e.target.value))}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary text-gray-900"
      >
        <option value="1">Semester 1</option>
        <option value="2">Semester 2</option>
      </select>
    </div>

    {/* Resource Type */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Resource Type
      </label>
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary text-gray-900"
      >
        <option value="all">All Types</option>
        <option value="notes">Lecture Notes</option>
        <option value="assignment">Assignments</option>
        <option value="pastpaper">Past Papers</option>
        <option value="video">Videos</option>
      </select>
    </div>
  </div>
</div>
```

### Change 4: Replace Course/Resource Display with Simple Course Cards
**Around line ~150-400** (the main courses.map section)
Replace entire courses display section with:
```javascript
{/* Courses Grid */}
<div>
  {courses.length === 0 ? (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No Courses Available
      </h3>
      <p className="text-gray-600">
        There are no courses for Year {selectedYear}, Semester {selectedSemester} yet.
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        const courseResources = getResourcesForCourse(course.id);
        const resourceCount = courseResources.length;
        
        return (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
            onClick={() => navigate(`/course/${course.id}`)}
          >
            {/* Course Header */}
            <div className="bg-gradient-to-r from-mut-primary to-mut-secondary p-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {course.unitCode}
              </h3>
              <p className="text-green-100 text-sm">
                {course.unitTitle}
              </p>
            </div>

            {/* Course Info */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.credits} Credits</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold">{resourceCount} Resources</span>
                </div>
              </div>

              {/* View Details Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/course/${course.id}`);
                }}
                className="w-full bg-mut-primary text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
```

## Alternative: Use Git to Apply Changes

Since the file is large, you can:

1. **Restore from backup if needed:**
```bash
cp client/src/pages/DashboardPage.jsx.backup client/src/pages/DashboardPage.jsx
```

2. **Or I can create a complete new file** - Let me know and I'll generate the full clean version.

## Testing

After changes:
1. Start dev server: `cd client && npm run dev`
2. Visit dashboard
3. Should see:
   - ✅ Course cards in grid
   - ✅ 4 dropdown filters
   - ✅ "View Details" button on each card
   - ❌ No "Upload Resource" button in header
   - ❌ No individual resource cards

4. Click "View Details" → Should navigate to `/course/:id` (CoursePage)
5. CoursePage should show all resources for that course

## Benefits

- **Faster loading**: Dashboard doesn't load all resources
- **Cleaner UI**: Course overview instead of resource details  
- **Better UX**: Clear hierarchy (Courses → Resources)
- **Mobile friendly**: Card grid responsive
- **Logical flow**: Browse → Select → View

Would you like me to create the complete cleaned file instead?
