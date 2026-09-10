import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { Bell, X, CheckCircle, AlertCircle, Info, Upload } from 'lucide-react';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { on, isConnected } = useSocket();

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Auto-dismiss toast notifications after 5 seconds
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }

    return newNotification.id;
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id && !n.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        return { ...n, read: true };
      }
      return n;
    }));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Listen to socket events for notifications
  useEffect(() => {
    if (!isConnected) return;

    // Generic notification event
    const cleanupNotification = on('notification:new', (data) => {
      addNotification({
        type: data.type || 'info',
        title: data.title || 'Notification',
        message: data.message,
        data: data
      });
    });

    // Resource approved
    const cleanupResourceApproved = on('resource:approved', (data) => {
      addNotification({
        type: 'success',
        title: 'Resource Approved',
        message: data.message || `Your resource "${data.title}" has been approved!`,
        icon: <CheckCircle className="w-5 h-5" />,
        data: data
      });
    });

    // Resource rejected
    const cleanupResourceRejected = on('resource:rejected', (data) => {
      addNotification({
        type: 'error',
        title: 'Resource Rejected',
        message: data.message || `Your resource "${data.title}" was rejected.`,
        icon: <AlertCircle className="w-5 h-5" />,
        data: data
      });
    });

    // Resource pending (for admins/class reps)
    const cleanupResourcePending = on('resource:pending', (data) => {
      addNotification({
        type: 'info',
        title: 'New Resource Pending',
        message: `${data.uploader?.name} uploaded "${data.title}" for review`,
        icon: <Upload className="w-5 h-5" />,
        data: data
      });
    });

    return () => {
      cleanupNotification?.();
      cleanupResourceApproved?.();
      cleanupResourceRejected?.();
      cleanupResourcePending?.();
    };
  }, [isConnected, on, addNotification]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToastContainer />
    </NotificationContext.Provider>
  );
};

// Toast notification component
const NotificationToastContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  // Only show toast notifications (last 3 unread)
  const toastNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 3);

  if (toastNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {toastNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// Individual toast notification
const NotificationToast = ({ notification, onClose }) => {
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getDefaultIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div
      className={`${getTypeStyles()} border rounded-lg shadow-lg p-4 animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {notification.icon || getDefaultIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className="font-semibold text-sm mb-1">
              {notification.title}
            </p>
          )}
          <p className="text-sm">
            {notification.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Notification bell component for navbar
export const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-mut-primary rounded-lg"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <NotificationDropdown onClose={() => setShowDropdown(false)} />
      )}
    </div>
  );
};

// Notification dropdown
const NotificationDropdown = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-notification-dropdown]')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      data-notification-dropdown
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex gap-2">
          <button
            onClick={markAllAsRead}
            className="text-xs text-mut-primary hover:underline"
          >
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:underline"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {notification.icon || <Info className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  {notification.title && (
                    <p className={`text-sm font-medium mb-1 ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
