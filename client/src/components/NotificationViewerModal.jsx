import React from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info, Calendar, User } from 'lucide-react';

const NotificationViewerModal = ({ notification, isOpen, onClose }) => {
  if (!isOpen || !notification) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'error': return <XCircle className="w-8 h-8 text-red-600" />;
      default: return <Info className="w-8 h-8 text-blue-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const { date, time } = formatDateTime(notification.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${getTypeColor(notification.type)} border-b px-6 py-4 flex items-start justify-between sticky top-0`}>
          <div className="flex items-start gap-4 flex-1">
            <div className="flex-shrink-0">
              {getTypeIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {notification.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{time}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Media Content */}
          {notification.media_url && (
            <div className="mb-6">
              {notification.media_type === 'image' ? (
                <img
                  src={notification.media_url}
                  alt={notification.title}
                  className="w-full rounded-lg shadow-md max-h-96 object-contain bg-gray-100"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : notification.media_type === 'video' ? (
                <video
                  controls
                  className="w-full rounded-lg shadow-md max-h-96 bg-black"
                  onError={(e) => {
                    e.target.parentElement.innerHTML = '<div class="bg-gray-100 rounded-lg p-8 text-center text-gray-600"><p>Video unavailable</p></div>';
                  }}
                >
                  <source src={notification.media_url} type="video/mp4" />
                  <source src={notification.media_url} type="video/webm" />
                  <source src={notification.media_url} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              ) : null}
            </div>
          )}

          {/* Message */}
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Call-to-Action Link */}
          {notification.link_url && notification.link_text && (
            <div className="mt-6">
              <a
                href={notification.link_url}
                target={notification.link_url.startsWith('http') ? '_blank' : '_self'}
                rel={notification.link_url.startsWith('http') ? 'noopener noreferrer' : ''}
                className="inline-flex items-center gap-2 px-6 py-3 bg-mut-primary text-white rounded-lg font-medium hover:bg-mut-secondary transition-colors shadow-md hover:shadow-lg"
                onClick={() => {
                  // If internal link, close modal
                  if (!notification.link_url.startsWith('http')) {
                    setTimeout(() => onClose(), 100);
                  }
                }}
              >
                {notification.link_text}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          )}

          {/* Metadata */}
          {notification.created_by_name && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Posted by: <span className="font-medium text-gray-900">{notification.created_by_name}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationViewerModal;
