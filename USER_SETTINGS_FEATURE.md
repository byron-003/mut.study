# User Settings Feature - Academic Period Management

## 🎯 Overview

Academic period settings (current year and semester) have been moved from the dashboard sidebar to the user's profile settings page, with a reminder banner for users who haven't set their preferences.

## ✨ Key Changes

### Before:
- ❌ Sidebar on dashboard for year/semester selection
- ❌ Filters reset on page refresh
- ❌ Manual selection every session
- ❌ Takes up dashboard space

### After:
- ✅ Settings saved in user profile
- ✅ Persists across sessions
- ✅ Auto-loads on dashboard
- ✅ More dashboard space for content
- ✅ Reminder banner if not set
- ✅ Quick link to change period

## 📋 New Features

### 1. **Profile Settings Page** ⚙️

#### Academic Settings Section:
- **Current Year of Study** (Dropdown)
  - Year 1, Year 2, Year 3, Year 4, Year 5
  - Optional (can be "Not Set")
  
- **Current Semester** (Dropdown)
  - Semester 1, Semester 2
  - Optional (can be "Not Set")

#### Features:
- Edit mode with save/cancel
- Visual indicators (green checkmark if set, gray if not)
- Warning message if incomplete
- Quick update button

### 2. **Dashboard Banner** 🔔

Shows when user hasn't set year/semester:
```
⚠️ Complete Your Academic Settings
You haven't set your current year and semester yet. 
Update your settings to see personalized courses for 
your current academic period.

[Update Settings →]
```

**Banner features:**
- Yellow background (attention-grabbing but not alarming)
- Clear call-to-action button
- Dismisses automatically when settings are updated
- Only shows when needed

### 3. **Dashboard Period Display** 📅

Replaces sidebar with compact bar:
```
📅 Viewing: [Year 2 • Semester 1]  [Change Period →]  [Filter: All Resources ▼]
```

**Features:**
- Shows current viewing period
- Link to profile to change
- Resource type filter inline
- Takes minimal space

### 4. **Auto-Load Behavior** 🚀

When user logs in:
1. Check if `currentYear` and `currentSemester` are set
2. If set → Load courses for that period automatically
3. If not set → Default to Year 1, Semester 1 + show banner

## 🗄️ Database Changes

### Users Table Updates:
```sql
ALTER TABLE users 
ADD COLUMN current_year INTEGER CHECK (current_year >= 1 AND current_year <= 5);

ALTER TABLE users 
ADD COLUMN current_semester INTEGER CHECK (current_semester IN (1, 2));

CREATE INDEX idx_users_academic_period 
ON users(current_year, current_semester) 
WHERE current_year IS NOT NULL AND current_semester IS NOT NULL;
```

### Migration Script:
```powershell
cd server
npm run db:add-user-settings
```

## 🎨 Profile Page Design

### Layout:
```
┌─────────────────────────────────────────────┐
│  My Profile                                 │
│  Manage your account settings...            │
├─────────────────────────────────────────────┤
│                                             │
│  [Profile Photo]  John Doe                  │
│                   john@student.mut.ac.ke    │
│                   [Edit Profile]            │
│                                             │
│  Full Name:      John Doe                   │
│  Email:          john@student.mut.ac.ke     │
│  Role:           Student                    │
│  Program:        BSc Computer Science       │
│                                             │
├─────────────────────────────────────────────┤
│  📅 Academic Settings                       │
│  Set your current year and semester...      │
│                                             │
│  ⚠️ Your academic settings are not complete│
│                                             │
│  Current Year:    [Not Set / Year 2]        │
│  Current Semester: [Not Set / Semester 1]    │
│                                             │
│  [Update Academic Settings]                 │
└─────────────────────────────────────────────┘
```

### Edit Mode:
```
┌─────────────────────────────────────────────┐
│  💡 Note: Setting your current year and     │
│  semester helps personalize your dashboard  │
├─────────────────────────────────────────────┤
│  Current Year of Study:                     │
│  [Year 2         ▼]                         │
│                                             │
│  Current Semester:                          │
│  [Semester 1     ▼]                         │
│                                             │
│  [Save Settings]  [Cancel]                  │
└─────────────────────────────────────────────┘
```

## 🔄 User Workflows

### Initial Setup (New User):
```
1. Register account
   ↓
2. Login → Dashboard loads
   ↓
3. See banner: "Complete Your Academic Settings"
   ↓
4. Click "Update Settings" → Go to Profile
   ↓
5. Edit profile → Set Year 2, Semester 1
   ↓
6. Save → Banner disappears
   ↓
7. Dashboard now shows Year 2, Semester 1 courses
```

### Changing Period (Existing User):
```
1. On Dashboard
   ↓
2. See "Viewing: Year 2 • Semester 1"
   ↓
3. Click "Change Period →"
   ↓
4. Go to Profile → Edit settings
   ↓
5. Change to Year 3, Semester 1
   ↓
6. Save → Return to Dashboard
   ↓
7. Dashboard auto-loads Year 3, Semester 1 courses
```

### Persistent Settings:
```
User sets: Year 3, Semester 2
    ↓
Logs out
    ↓
Logs in next day
    ↓
Dashboard automatically loads: Year 3, Semester 2 ✅
(No need to select again!)
```

## 🎯 Benefits

### For Students:
1. **Saves time** - Set once, works forever
2. **Personalized** - Always see relevant content
3. **Convenient** - No repeated selections
4. **Clear** - Visual reminders if not set
5. **Flexible** - Easy to update anytime

### For UX:
1. **More space** - Dashboard sidebar removed
2. **Cleaner** - Less visual clutter
3. **Focused** - Content-first approach
4. **Obvious** - Banner can't be missed
5. **Intuitive** - Settings where they belong

### For System:
1. **Persistent** - Stored in database
2. **Scalable** - Works for all users
3. **Maintainable** - Centralized settings
4. **Performant** - Fewer queries
5. **Reliable** - Consistent behavior

## 📊 Technical Implementation

### Frontend Components:

**ProfilePage.jsx:**
- Academic Settings section
- Edit mode form
- Save/Cancel buttons
- Visual indicators
- Warning messages

**DashboardPage.jsx:**
- Banner component (conditional)
- Period display bar
- Auto-load from user settings
- Default fallback (Year 1, Sem 1)

### Backend Updates:

**authController.js:**
- `updateProfile` - Handle currentYear/currentSemester
- `login` - Return currentYear/currentSemester
- `getProfile` - Return currentYear/currentSemester

**Database:**
- Two new columns in users table
- Validation constraints (1-5 for year, 1-2 for semester)
- Index for performance

### API Flow:

```javascript
// Update settings
PUT /api/auth/profile
{
  "currentYear": 2,
  "currentSemester": 1
}

// Response
{
  "status": "success",
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "currentYear": 2,
    "currentSemester": 1,
    ...
  }
}

// Dashboard uses:
const year = user.currentYear || 1;  // Default to 1 if not set
const semester = user.currentSemester || 1;
```

## 🎨 UI States

### Banner States:

**Not Set (Show Banner):**
```javascript
!user.currentYear || !user.currentSemester
→ Show yellow banner with "Update Settings" button
```

**Set (No Banner):**
```javascript
user.currentYear && user.currentSemester
→ No banner, clean dashboard
```

### Profile States:

**Not Set:**
- Gray icon
- "Not Set" text
- Yellow warning box
- Prominent update button

**Set:**
- Green icon with checkmark
- "Year X" / "Semester X" text
- No warning
- Edit button available

## 📱 Responsive Design

### Desktop:
- Banner: Full width with icon, text, and button side-by-side
- Period bar: All elements in one row
- Profile: Two-column layout

### Tablet:
- Banner: Stacked layout (icon/text, then button below)
- Period bar: Wrapped if needed
- Profile: Two columns maintained

### Mobile:
- Banner: Vertical stack, full-width button
- Period bar: Stacked elements
- Profile: Single column

## 🔐 Validation

### Frontend:
- Year: 1-5
- Semester: 1-2
- Both optional (can be unset)

### Backend:
- Year: Integer, 1-5 or NULL
- Semester: Integer, 1 or 2 or NULL
- Database constraints enforce rules

## 🚀 Migration Steps

1. **Run database migration:**
   ```powershell
   cd server
   npm run db:add-user-settings
   ```

2. **Restart server:**
   ```powershell
   npm start
   ```

3. **Test profile page:**
   - Navigate to `/profile`
   - See Academic Settings section
   - Try editing and saving

4. **Test dashboard:**
   - Without settings → See banner
   - With settings → No banner, auto-loaded period
   - Click "Change Period" → Go to profile

## 📊 Analytics Opportunities

Track usage to improve UX:
- % of users who set their period
- Time from registration to first setting
- Most common periods (identify popular years)
- How often users change their period
- Banner click-through rate

## 🔮 Future Enhancements

### Possible Improvements:
- [ ] **Auto-detect period** - Based on registration date
- [ ] **Period history** - Track period changes over time
- [ ] **Notifications** - Remind to update at semester start
- [ ] **Bulk update** - Admin sets period for all students
- [ ] **Academic calendar** - Integration with MUT calendar
- [ ] **Smart defaults** - Suggest period based on program
- [ ] **Period lock** - Prevent changes during exams
- [ ] **Multi-period view** - See multiple periods at once

## 📞 Support

### Common Questions:

**Q: Where do I set my current year and semester?**
A: Go to Profile → Academic Settings section → Edit and save

**Q: Why should I set these?**
A: It personalizes your dashboard to show only your current courses automatically

**Q: What if I don't set them?**
A: Dashboard defaults to Year 1, Semester 1, and shows a reminder banner

**Q: Can I change them later?**
A: Yes! Update anytime from your profile page

**Q: Do my settings persist after logout?**
A: Yes! They're saved and load automatically when you log back in

**Q: What happens at the start of a new semester?**
A: Update your settings in your profile to see the new semester's courses

## 🎉 Summary

The new user settings approach provides:

✅ **Persistent Settings** - Set once, use forever
✅ **Better UX** - More dashboard space for content
✅ **Clear Reminders** - Impossible to miss the banner
✅ **Easy Updates** - Change anytime from profile
✅ **Smart Defaults** - Works even if not set
✅ **Professional** - Settings where users expect them

**Result:** A cleaner, more personalized, and more professional experience! 🚀
