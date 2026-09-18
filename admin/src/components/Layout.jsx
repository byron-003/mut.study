import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import {
  LayoutDashboard, Users, FileText, BookOpen, GraduationCap,
  BarChart3, FileSpreadsheet, Settings, LogOut, Menu, X, ChevronDown, Mail, Bell, Megaphone, MessageSquare
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      // Desktop: collapse to icon-only rail (never fully closed)
      setSidebarCollapsed((prev) => !prev);
    } else {
      // Mobile: open/close the drawer
      setSidebarOpen((prev) => !prev);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, allowClassRep: true },
    { name: 'Users', path: '/users', icon: Users, allowClassRep: true },
    { name: 'Resources', path: '/resources', icon: FileText, allowClassRep: true },
    { name: 'Messages', path: '/messages', icon: Mail, allowClassRep: false },
    { name: 'Feedback', path: '/feedback', icon: MessageSquare, allowClassRep: false },
    { name: 'Email', path: '/email', icon: Mail, allowClassRep: false },
    { name: 'Notifications', path: '/notifications', icon: Bell, allowClassRep: false },
    { name: 'Banner', path: '/banner', icon: Megaphone, allowClassRep: false },
    { name: 'Programs', path: '/programs', icon: GraduationCap, allowClassRep: false },
    { name: 'Courses', path: '/courses', icon: BookOpen, allowClassRep: false },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, allowClassRep: true },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet, allowClassRep: true },
    { name: 'Settings', path: '/settings', icon: Settings, allowClassRep: false },
  ];

  const filteredNavItems = isAdmin 
    ? navItems 
    : navItems.filter(item => item.allowClassRep);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="h-full w-64 lg:w-full bg-white dark:bg-gray-800 shadow-lg flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'lg:flex-col lg:justify-center' : ''}`}>
              <img 
                src="/mut-logo.png" 
                alt="MUT Logo" 
                className="w-10 h-10 object-contain flex-shrink-0"
              />
              <div className={`${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                <h1 className="font-bold text-gray-900 dark:text-white">MUT Study Hub</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''} ${
                        isActive
                          ? 'bg-admin-primary text-white shadow-md'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className={`font-medium ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title={sidebarCollapsed ? 'Account' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
              >
                <div className="w-10 h-10 bg-admin-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className={`flex-1 text-left ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${sidebarCollapsed ? 'lg:hidden' : ''} ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'max-lg:ml-64' : 'max-lg:ml-0'} ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-6 h-6 dark:text-gray-300" />
            </button>

            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
