# MUT STUDY HUB

A comprehensive academic resource platform for Murang'a University of Technology (MUT) students. This portal serves as a central repository for study materials, past examination papers, continuous assessment tests (CATs), practical lab manuals, and quizzes.

## Features

- 🏫 **Complete MUT Academic Hierarchy**: All 8 schools, departments, and degree programs
- 📚 **Resource Management**: Upload and access notes, past papers, CATs, practicals, and quizzes
- 🔍 **Smart Search**: Autocomplete search across programs and courses
- 📤 **Document Upload**: Students can contribute study materials
- ✅ **Approval System**: Class reps and admins can review and approve submissions
- 🔐 **Secure Authentication**: JWT-based auth with university email validation
- ☁️ **Cloud Storage**: Direct PDF streaming via Cloudinary

## Tech Stack

### Frontend
- React 18 with Functional Components and Hooks
- Tailwind CSS for styling
- Vite for build tooling
- Axios for API communication

### Backend
- Node.js with Express framework
- PostgreSQL database
- JWT authentication
- Cloudinary for file storage and CDN

## Project Structure

```
mut-study-hub/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service layer
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   └── package.json
│
├── server/                # Express backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── scripts/          # Database setup/seed scripts
│   ├── utils/            # Utility functions
│   └── server.js         # Entry point
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   cd mut-study-hub
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**
   - Copy `server/.env.example` to `server/.env`
   - Update all configuration values with your credentials

5. **Setup database**
   ```bash
   cd ../server
   npm run db:setup
   npm run db:seed
   ```

6. **Start the development servers**

   Backend:
   ```bash
   cd server
   npm run dev
   ```

   Frontend (in a new terminal):
   ```bash
   cd client
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Database Schema

The system models the complete MUT academic hierarchy:

- **Schools**: 8 schools (SCIT, SET, SBE, SPAHS, SOEHSS, SHTM, SAES, SNS)
- **Departments**: Multiple departments per school
- **Programs**: PhD, Masters, Degree, Diploma, and TVET levels
- **Courses**: Individual course units linked to programs
- **Users**: Students, class reps, and admins
- **Study Materials**: Uploaded resources with approval workflow

## User Roles

- **Student**: Upload resources, access approved materials
- **Class Rep**: All student privileges + approve/reject uploads
- **Admin**: Full system access and management

## Email Validation

Student registration requires a valid MUT email address ending with `@student.mut.ac.ke`.

## File Upload Specifications

- Maximum file size: 10MB
- Supported formats: PDF, DOCX, ZIP
- Storage: Cloudinary with direct streaming
- Categories: Notes, Past Papers, CATs, Practical Manuals, Quizzes

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Resource Endpoints
- `GET /api/resources/course/:courseId` - Get resources by course
- `POST /api/resources/upload` - Upload new resource
- `PUT /api/resources/:id/approve` - Approve resource
- `PUT /api/resources/:id/reject` - Reject resource

### Search Endpoints
- `GET /api/search?q=query` - Search programs and courses

## Contributing

Contributions are welcome! Please ensure your code follows the project structure and includes appropriate error handling.

## License

ISC

## Support

For issues or questions, please contact the development team or create an issue in the repository.
