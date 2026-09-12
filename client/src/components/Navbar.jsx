import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authContext';
import { NotificationBell } from '../context/NotificationContext';
import DarkModeToggle from './DarkModeToggle';

const Navbar = () => {
  const { user, isAuthenticated, isClassRep, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/mut-logo.png" 
                alt="MUT Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">MUT Study Hub</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Academic Resources Portal</p>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/forum"
                  className="text-gray-700 dark:text-gray-300 hover:text-mut-primary dark:hover:text-mut-accent px-3 py-2 rounded-md text-sm font-medium"
                >
                  Forum
                </Link>
                <Link
                  to="/my-uploads"
                  className="text-gray-700 dark:text-gray-300 hover:text-mut-primary dark:hover:text-mut-accent px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Uploads
                </Link>
                <Link
                  to="/study-history"
                  className="text-gray-700 dark:text-gray-300 hover:text-mut-primary dark:hover:text-mut-accent px-3 py-2 rounded-md text-sm font-medium"
                >
                  History
                </Link>
                <Link
                  to="/leaderboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-mut-primary dark:hover:text-mut-accent px-3 py-2 rounded-md text-sm font-medium"
                >
                  Leaderboard
                </Link>
                {isClassRep && (
                  <Link
                    to="/pending-approvals"
                    className="text-gray-700 dark:text-gray-300 hover:text-mut-primary dark:hover:text-mut-accent px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Pending Approvals
                  </Link>
                )}
                {/* Dark Mode Toggle */}
                <DarkModeToggle />
                
                {/* Notification Bell */}
                <NotificationBell />
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-mut-primary px-3 py-2 rounded-md text-sm font-medium">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-mut-primary"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-mut-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <span>{user?.firstName} {user?.lastName}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Centered Navigation Links on Home Page */}
                <div className="flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
                  <Link
                    to="/programs"
                    className="text-gray-700 hover:text-mut-primary transition-colors font-medium"
                  >
                    Programs
                  </Link>
                  <Link
                    to="/about"
                    className="text-gray-700 hover:text-mut-primary transition-colors font-medium"
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className="text-gray-700 hover:text-mut-primary transition-colors font-medium"
                  >
                    Contact
                  </Link>
                </div>

                <Link
                  to="/login"
                  className="text-gray-700 hover:text-mut-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-mut-primary text-white rounded-lg hover:bg-mut-secondary transition-colors font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            {isAuthenticated && (
              <>
                {/* Notification Bell - Mobile */}
                <NotificationBell />
                
                {/* Profile Picture - Mobile */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-mut-primary"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-mut-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                </button>
              </>
            )}
            {!isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-mut-primary p-2"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </div>
                <Link
                  to="/forum"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Forum
                </Link>
                <Link
                  to="/my-uploads"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Uploads
                </Link>
                {isClassRep && (
                  <Link
                    to="/pending-approvals"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pending Approvals
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/programs"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Programs
                </Link>
                <Link
                  to="/about"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block mx-3 my-2 px-3 py-2 rounded-md text-base font-medium bg-mut-primary text-white hover:bg-mut-secondary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
