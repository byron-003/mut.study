import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/authContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CoursePage from './pages/CoursePage';
import ProgramPage from './pages/ProgramPage';
import MyUploadsPage from './pages/MyUploadsPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import ProfilePage from './pages/ProfilePage';
import ProgramsPage from './pages/ProgramsPage';
import AboutPage from './pages/AboutPage';
import ForumPage from './pages/ForumPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import StudyHistoryPage from './pages/StudyHistoryPage';

// Protected route wrapper
const ProtectedRoute = ({ children, requireClassRep = false }) => {
  const { isAuthenticated, isClassRep } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireClassRep && !isClassRep) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Guest route wrapper (redirect to dashboard if logged in)
const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        {/* Home redirects to dashboard if authenticated */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        
        {/* Public pages */}
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/forum" element={
          <ProtectedRoute>
            <ForumPage />
          </ProtectedRoute>
        } />
        
        <Route path="/login" element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        } />
        <Route path="/register" element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        } />
        <Route path="/forgot-password" element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        } />
        
        {/* Dashboard - main landing page for authenticated users */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/program/:id" element={<ProgramPage />} />
        <Route path="/course/:id" element={<CoursePage />} />
        <Route path="/my-uploads" element={
          <ProtectedRoute>
            <MyUploadsPage />
          </ProtectedRoute>
        } />
        <Route path="/pending-approvals" element={
          <ProtectedRoute requireClassRep={true}>
            <PendingApprovalsPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/study-history" element={
          <ProtectedRoute>
            <StudyHistoryPage />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
