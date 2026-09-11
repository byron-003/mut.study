# Dashboard Redesign - Clean UI/UX

## Changes Made

### 1. **Removed**
- ❌ Upload Resource button from dashboard header
- ❌ Complex filter card with "Viewing", "Change Period" elements
- ❌ Expanded course cards showing all resources inline
- ❌ Individual resource cards on dashboard

### 2. **Added**
- ✅ Clean dropdown-based filter card with 4 selects (Academic Year, Year of Study, Semester, Resource Type)
- ✅ Course grid layout (cards show course + resource count only)
- ✅ "View Details" button on each course card
- ✅ Cleaner search placeholder (courses instead of resources)

### 3. **New UI Flow**
```
Dashboard → Course Cards → Click "View Details" → Course Detail Page → Select Resource → View
```

## New Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                   │
│ Program Name, User Info                                 │
│ [Search courses by name or code...]                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FILTERS                                                  │
│ [Academic Year ▼] [Year of Study ▼] [Semester ▼] [Type ▼]│
└─────────────────────────────────────────────────────────┘

┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  CSC 2101     │  │  MAT 2102     │  │  PHY 2103     │
│  Data Struct  │  │  Calculus II  │  │  Physics II   │
│               │  │               │  │               │
│  📚 3 Credits │  │  📚 4 Credits │  │  📚 3 Credits │
│  📄 15 Res.   │  │  📄 8 Res.    │  │  📄 12 Res.   │
│               │  │               │  │               │
│ [View Details]│  │ [View Details]│  │ [View Details]│
└───────────────┘  └───────────────┘  └───────────────┘
```

## Implementation

Due to the large file size, I've created a summary. You'll need to manually update DashboardPage.jsx with these changes:

### Step 1: Update State Variables
```javascript
// Remove:
const [selectedCourse, setSelectedCourse] = useState(null);

// Add:
const [selectedAcademicYear, setSelectedAcademicYear] = useState(getCurrentAcademicYear());
```

### Step 2: Update Header
```javascript
// Remove Upload Button
// Change search placeholder from "Search resources..." to "Search courses..."
```

### Step 3: Replace Filter Section
```javascript
<div className="bg-white rounded-lg shadow-md p-6 mb-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
    
    {/* Similar for Year of Study, Semester, Resource Type */}
  </div>
</div>
```

### Step 4: Update Course Display
```javascript
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
```

## Benefits

1. ✅ **Cleaner dashboard** - Shows overview, not details
2. ✅ **Better information hierarchy** - Courses → Resources
3. ✅ **Less cognitive load** - Users see course structure first
4. ✅ **Faster loading** - No need to load all resources upfront
5. ✅ **Mobile friendly** - Card grid works better on small screens
6. ✅ **Clear call-to-action** - "View Details" button is obvious

## User Flow

1. **Dashboard**: User sees all their courses for selected filters
2. **Click course card**: Navigate to `/course/:id`
3. **Course detail page**: Shows all resources for that course
4. **Click resource**: View/download resource

This separates browsing (dashboard) from detailed viewing (course page).
