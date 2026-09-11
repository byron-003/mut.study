# Alert/Confirm Replacement Progress

## Files to Update

### Client Files
- [ ] client/src/pages/ContactPage.jsx (2 alerts)
- [ ] client/src/pages/CoursePage.jsx (2 alerts)
- [ ] client/src/components/AddCourseModal.jsx (1 alert)
- [ ] client/src/pages/DashboardPage.jsx (2 alerts)
- [ ] client/src/pages/ForumPage.jsx (3 alerts)
- [ ] client/src/pages/MyUploadsPage.jsx (5 alerts, 1 confirm)
- [ ] client/src/pages/PendingApprovalsPage.jsx (4 alerts, 1 confirm)
- [ ] client/src/pages/ProfilePage.jsx (1 confirm)
- [ ] client/src/components/ResourceCard.jsx (1 confirm)

### Admin Files
- [ ] admin/src/pages/CoursesPage.jsx (4 alerts, 2 confirms)
- [ ] admin/src/pages/MessagesPage.jsx (4 alerts, 1 confirm)
- [ ] admin/src/pages/ProgramsPage.jsx (4 alerts, 1 confirm)
- [ ] admin/src/pages/ReportsPage.jsx (10 alerts)
- [ ] admin/src/pages/ResourcesPage.jsx (10 alerts, 3 confirms)
- [ ] admin/src/pages/UsersPage.jsx (4 alerts, 2 confirms)
- [ ] admin/src/pages/NotificationsPage.jsx (1 confirm)

## Total Count
- Client: 17 alerts, 3 confirms
- Admin: 32 alerts, 9 confirms
- **Grand Total: 49 alerts, 12 confirms = 61 replacements**

## Replacement Strategy
1. Import hooks and components at top of each file
2. Add hooks in component: `const { alertState, showAlert, closeAlert } = useAlert();`
3. Replace `alert('message')` with `showAlert('Title', 'message', 'type')`
4. Replace `confirm('message')` with `await showConfirm({ title, message, type })`
5. Add components to JSX: `<CustomAlert {...alertState} onClose={closeAlert} />`
