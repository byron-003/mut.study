# MUT Study Hub - Installation Guide

This guide will walk you through setting up the MUT Study Hub platform on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download here](https://www.postgresql.org/download/)
- **Cloudinary Account** - [Sign up here](https://cloudinary.com/users/register/free)
- **Git** (optional) - For version control

## Step 1: PostgreSQL Setup

### Windows Installation

1. Download and install PostgreSQL from the official website
2. During installation, remember the password you set for the `postgres` user
3. Ensure PostgreSQL service is running

### Create Database User (Optional)

Open PowerShell and run:

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create a new user (optional, or use postgres user)
CREATE USER mut_admin WITH PASSWORD 'your_password';
ALTER USER mut_admin WITH SUPERUSER;
```

## Step 2: Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com) and create a free account
2. From your dashboard, note down:
   - Cloud Name
   - API Key
   - API Secret
3. These will be used in the environment configuration

## Step 3: Backend Setup

### Navigate to Server Directory

```powershell
cd server
```

### Install Dependencies

```powershell
npm install
```

### Configure Environment Variables

1. Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

2. Open `.env` and update with your credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mut_study_hub
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=mut_study_hub_docs

# File Upload Configuration
MAX_FILE_SIZE=10485760

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

### Setup Database

Run the database setup script:

```powershell
npm run db:setup
```

This will:
- Create the `mut_study_hub` database
- Create all required tables
- Set up indexes and triggers

### Seed Database with MUT Data

Populate the database with all MUT schools, departments, and programs:

```powershell
npm run db:seed
```

This will insert:
- 8 Schools
- 18 Departments
- 62 Programs (PhD, Masters, Degree, Diploma, TVET)
- Sample courses for demonstration

### Start Backend Server

```powershell
npm run dev
```

The backend API should now be running on `http://localhost:5000`

You should see:
```
🚀 Server is running on port 5000
📚 MUT Study Hub API - Environment: development
📊 Connected to PostgreSQL database
```

## Step 4: Frontend Setup

### Open New Terminal

Keep the backend server running and open a new PowerShell terminal.

### Navigate to Client Directory

```powershell
cd client
```

### Install Dependencies

```powershell
npm install
```

### Configure Environment Variables (Optional)

1. Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

2. If your backend is running on a different URL, update `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Start Frontend Development Server

```powershell
npm run dev
```

The frontend should now be running on `http://localhost:5173`

## Step 5: Access the Application

1. Open your browser and navigate to: `http://localhost:5173`
2. You should see the MUT Study Hub homepage

## Step 6: Create Your First Account

1. Click "Register" in the navigation bar
2. Fill in the registration form with:
   - **Email**: Any valid email address (e.g., `john.doe@gmail.com` or `student@student.mut.ac.ke`)
   - **Password**: At least 8 characters
   - **First Name** and **Last Name**
   - **Program**: Optional, select your program
3. Click "Create account"

## Testing the System

### Test as a Student

1. Register a student account
2. Search for a course (e.g., "SCS 2101" or "Computer Science")
3. Navigate to a course page
4. Upload a study material
5. View your uploads in "My Uploads"

### Test as Class Rep/Admin

To test approval functionality, you need to manually update a user's role in the database:

```sql
-- Connect to database
psql -U postgres -d mut_study_hub

-- Update user role to class_rep
UPDATE users SET role = 'class_rep' WHERE email = 'your.email@example.com';

-- Or update to admin
UPDATE users SET role = 'admin' WHERE email = 'your.email@example.com';
```

After updating:
1. Logout and login again
2. You'll see "Pending Approvals" in the navigation
3. Approve or reject uploaded resources

## Common Issues and Solutions

### Issue: Database Connection Failed

**Solution**: 
- Verify PostgreSQL is running: `Get-Service postgresql*`
- Check database credentials in `.env`
- Ensure the database exists: `psql -U postgres -l`

### Issue: Port Already in Use

**Backend (5000)**:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Frontend (5173)**:
```powershell
# Find process using port 5173
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <PID> /F
```

### Issue: Cloudinary Upload Fails

**Solution**:
- Verify Cloudinary credentials in `.env`
- Check file size (must be under 10MB)
- Ensure file type is allowed (PDF, DOC, DOCX, PPT, PPTX, ZIP)

### Issue: Email Validation Error

**Solution**:
- Any valid email format is accepted
- Examples: `john.doe@gmail.com`, `student@student.mut.ac.ke`, `user@yahoo.com`

## Project Structure

```
mut-study-hub/
├── server/                    # Backend API
│   ├── config/               # Configuration files
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── routes/               # API routes
│   ├── scripts/              # Database scripts
│   ├── .env                  # Environment variables
│   └── server.js             # Entry point
│
├── client/                   # Frontend React app
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   └── index.html
│
└── README.md
```

## Available Scripts

### Backend (`server` directory)

- `npm run dev` - Start development server with auto-restart
- `npm start` - Start production server
- `npm run db:setup` - Setup database tables
- `npm run db:seed` - Seed database with MUT data

### Frontend (`client` directory)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Next Steps

1. **Customize**: Update colors, branding in `tailwind.config.js`
2. **Add More Courses**: Insert more courses in the database
3. **Deploy**: Deploy to production (see deployment guide)
4. **Security**: Change JWT_SECRET before deploying

## Support

For issues or questions:
- Check the README.md file
- Review error logs in the console
- Ensure all dependencies are installed correctly

## License

ISC


---

## Production Deployment

For production deployment where the client is served from the same server (localhost:5000), follow these additional steps:

### Quick Production Setup

1. **Build the client**:
   ```powershell
   cd client
   npm run build
   ```

2. **Configure production environment**:
   
   Update `server/.env`:
   ```env
   NODE_ENV=production
   ```

3. **Start the production server**:
   ```powershell
   cd server
   npm start
   ```

4. **Access the application**:
   ```
   http://localhost:5000
   ```

### Automated Production Start

Use the provided PowerShell script:

```powershell
# Test your production setup
.\test-production-setup.ps1

# Build and start in production mode
.\start-production.ps1
```

### Production Architecture

- **Server**: Express.js serves both API and client static files on port 5000
- **Client**: Built React app served from `/client/dist`
- **API**: Available at `/api/*`
- **Admin**: Deploy separately (not included in main server)

### Key Differences from Development

| Feature | Development | Production |
|---------|------------|------------|
| Client Port | 5173 (Vite) | 5000 (same as server) |
| Server Port | 5000 | 5000 |
| API URL | http://localhost:5000/api | /api (relative) |
| Hot Reload | Yes | No (static files) |
| Build Required | No | Yes (npm run build) |

For detailed deployment instructions including cloud hosting options (Heroku, VPS, Docker), see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---
