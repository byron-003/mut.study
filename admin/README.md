# MUT Study Hub - Admin Dashboard

Comprehensive admin panel for managing the MUT Study Hub platform.

## Features

- 📊 Dashboard with key statistics
- 👥 User management (students, class reps)
- 📁 Resource management (approve/reject uploads)
- 🎓 Programs & Courses management
- 📈 Analytics and reports
- ⚙️ System settings

## Access Levels

### Admin
- Full access to all features
- User management
- Programs/Courses CRUD
- System settings

### Class Representative
- View statistics
- Manage resources (approve/reject)
- View users
- Generate reports

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
```bash
npm run dev
```

Admin panel runs on: `http://localhost:5174`

## Login

Use admin or class rep credentials:
- Email: Your admin email
- Password: Your password

**Note:** Only users with `admin` or `class_rep` role can access this panel.

## Build for Production

```bash
npm run build
```

## Technology Stack

- React 18
- Vite
- Tailwind CSS
- React Router
- Recharts (for analytics)
- Lucide Icons
- Axios

## Project Structure

```
admin/
├── src/
│   ├── components/      # Reusable components
│   │   └── Layout.jsx   # Main layout with sidebar
│   ├── contexts/        # React contexts
│   │   └── AuthContext.jsx
│   ├── pages/          # Page components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── UsersPage.jsx
│   │   ├── ResourcesPage.jsx
│   │   ├── ProgramsPage.jsx
│   │   ├── CoursesPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── ReportsPage.jsx
│   │   └── SettingsPage.jsx
│   ├── services/       # API services
│   │   └── api.js
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Available Routes

- `/` - Dashboard
- `/users` - User Management
- `/resources` - Resource Management
- `/programs` - Programs Management (Admin only)
- `/courses` - Courses Management (Admin only)
- `/analytics` - Analytics Dashboard
- `/reports` - Reports & Export
- `/settings` - System Settings (Admin only)

## Security

- JWT-based authentication
- Role-based access control
- Protected routes
- Token stored in localStorage
- Auto-logout on token expiration
