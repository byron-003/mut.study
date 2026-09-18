import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/authContext';
import { NotificationBell } from '../context/NotificationContext';
import { useSettings } from '../context/SettingsContext';
import { Menu, Settings, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isClassRep, logout } = useAuth();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const desktopLinkClass = (to) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(to)
        ? 'text-mut-primary bg-green-50 font-semibold'
        : 'text-gray-700 hover:text-mut-primary hover:bg-gray-50'
    }`;

  const desktopGuestLinkClass = (to) =>
    `transition-colors font-medium ${
      isActive(to) ? 'text-mut-primary font-semibold' : 'text-gray-700 hover:text-mut-primary'
    }`;

  const mobileLinkClass = (to) =>
    `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
      isActive(to)
        ? 'bg-green-50 text-mut-primary font-semibold'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileDropdownOpen(false);
  };

  return (
    <nav className="bg-white  shadow-lg sticky top-0 z-50 transition-colors">
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
                <h1 className="text-xl font-bold text-gray-900 ">{settings.site_name}</h1>
                <p className="text-xs text-gray-500 ">Academic Resources Portal</p>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={desktopLinkClass('/')}
                >
                  Home
                </Link>
                <Link
                  to="/forum"
                  className={desktopLinkClass('/forum')}
                >
                  Forum
                </Link>
                <Link
                  to="/my-uploads"
                  className={desktopLinkClass('/my-uploads')}
                >
                  My Uploads
                </Link>
                <Link
                  to="/study-history"
                  className={desktopLinkClass('/study-history')}
                >
                  History
                </Link>
                <Link
                  to="/leaderboard"
                  className={desktopLinkClass('/leaderboard')}
                >
                  Leaderboard
                </Link>
                {isClassRep && (
                  <Link
                    to="/pending-approvals"
                    className={desktopLinkClass('/pending-approvals')}
                  >
                    Pending Approvals
                  </Link>
                )}
                {!isActive('/dashboard') && (
                  <Link
                    to="/dashboard"
                    className="px-6 py-2 rounded-lg transition-colors font-medium bg-mut-primary text-white hover:bg-mut-secondary"
                  >
                    Dashboard
                  </Link>
                )}
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* Profile Dropdown - Desktop */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700  hover:text-mut-primary px-3 py-2 rounded-md text-sm font-medium">
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
                    <span className="">{user?.firstName} {user?.lastName}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white  rounded-lg shadow-lg py-2 hidden group-hover:block z-50 border border-gray-200 ">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700  hover:bg-gray-100 "
                    >
                      <UserIcon className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700  hover:bg-gray-100 "
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600  hover:bg-gray-100 "
                    >
                      <LogOut className="w-4 h-4" />
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
                    to="/"
                    className={desktopGuestLinkClass('/')}
                  >
                    Home
                  </Link>
                  <Link
                    to="/programs"
                    className={desktopGuestLinkClass('/programs')}
                  >
                    Programs
                  </Link>
                  <Link
                    to="/about"
                    className={desktopGuestLinkClass('/about')}
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className={desktopGuestLinkClass('/contact')}
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
                {settings.registration_enabled && (
                  <Link
                    to="/register"
                    className="px-6 py-2 bg-mut-primary text-white rounded-lg hover:bg-mut-secondary transition-colors font-medium"
                  >
                    Register
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            {isAuthenticated && (
              <>
                {/* Hamburger Menu - Left side on mobile */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-700  hover:text-mut-primary p-2 order-first -ml-2"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                {/* Notification Bell - Mobile */}
                <NotificationBell />
                
                {/* Profile Picture - Mobile with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center"
                    aria-label="Profile menu"
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
                  
                  {/* Profile Dropdown - Mobile */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white  rounded-lg shadow-lg py-2 z-50 border border-gray-200 ">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700  hover:bg-gray-100 "
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700  hover:bg-gray-100 "
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600  hover:bg-gray-100 "
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
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
        <div className="md:hidden bg-white  border-t border-gray-200 ">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                {!isActive('/dashboard') && (
                  <Link
                    to="/dashboard"
                    className={mobileLinkClass('/dashboard')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/"
                  className={mobileLinkClass('/')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/forum"
                  className={mobileLinkClass('/forum')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Forum
                </Link>
                <Link
                  to="/my-uploads"
                  className={mobileLinkClass('/my-uploads')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Uploads
                </Link>
                <Link
                  to="/study-history"
                  className={mobileLinkClass('/study-history')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  History
                </Link>
                <Link
                  to="/leaderboard"
                  className={mobileLinkClass('/leaderboard')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Leaderboard
                </Link>
                {isClassRep && (
                  <Link
                    to="/pending-approvals"
                    className={mobileLinkClass('/pending-approvals')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pending Approvals
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={mobileLinkClass('/')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/programs"
                  className={mobileLinkClass('/programs')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Programs
                </Link>
                <Link
                  to="/about"
                  className={mobileLinkClass('/about')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className={mobileLinkClass('/contact')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="border-t border-gray-200  mt-2 pt-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700  hover:bg-gray-100 "
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  {settings.registration_enabled && (
                    <Link
                      to="/register"
                      className="block mx-3 my-2 px-3 py-2 rounded-md text-base font-medium bg-mut-primary text-white hover:bg-mut-secondary text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  )}
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