import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useConfirm } from '../hooks/useAlert';
import CustomConfirm from '../components/CustomConfirm';
import { 
  Bell, Send, Plus, Trash2, Users, GraduationCap, User, Edit,
  Info, CheckCircle, AlertTriangle, XCircle, X, Upload, Image, Video
} from 'lucide-react';

const NotificationsPage = () => {
  const { confirmState, showConfirm } = useConfirm();
  const [notifications, setNotifications] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetProgramId: '',
    targetUserId: '',
    mediaFile: null,
    linkUrl: '',
    linkText: ''
  });
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchNotifications();
    fetchPrograms();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllNotifications();
      setNotifications(response.data.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await adminAPI.getProgramsDropdown();
      setPrograms(response.data.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setError('Please upload an image or video file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFormData(prev => ({ ...prev, mediaFile: file }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview({
        url: reader.result,
        type: isImage ? 'image' : 'video'
      });
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const removeMedia = () => {
    setFormData(prev => ({ ...prev, mediaFile: null }));
    setMediaPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    if (formData.targetType === 'program' && !formData.targetProgramId) {
      setError('Please select a program');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Upload media if present
      let mediaUrl = editingNotification?.media_url || null;
      let mediaType = editingNotification?.media_type || null;
      
      if (formData.mediaFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.mediaFile);
        
        const uploadResponse = await adminAPI.uploadFile(uploadFormData);
        mediaUrl = uploadResponse.data.data.url;
        mediaType = formData.mediaFile.type.startsWith('image/') ? 'image' : 'video';
        setUploading(false);
      }
      
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        mediaUrl,
        mediaType,
        linkUrl: formData.linkUrl || undefined,
        linkText: formData.linkText || undefined
      };

      if (editingNotification) {
        // Update existing notification
        await adminAPI.updateNotification(editingNotification.id, payload);
        setSuccess('Notification updated successfully');
        setShowEditModal(false);
      } else {
        // Create new notification
        payload.targetType = formData.targetType;
        payload.targetProgramId = formData.targetProgramId || undefined;
        payload.targetUserId = formData.targetUserId || undefined;
        
        await adminAPI.createNotification(payload);
        setSuccess('Notification sent successfully');
        setShowCreateModal(false);
      }
      
      resetForm();
      fetchNotifications();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error with notification:', error);
      setError(error.response?.data?.message || `Failed to ${editingNotification ? 'update' : 'send'} notification`);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      targetType: notification.target_type,
      targetProgramId: notification.target_program_id || '',
      targetUserId: notification.target_user_id || '',
      mediaFile: null,
      linkUrl: notification.link_url || '',
      linkText: notification.link_text || ''
    });
    
    // Set media preview if exists
    if (notification.media_url) {
      setMediaPreview({
        url: notification.media_url,
        type: notification.media_type
      });
    }
    
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Notification',
      message: 'Are you sure you want to delete this notification?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      await adminAPI.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      setSuccess('Notification deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetType: 'all',
      targetProgramId: '',
      targetUserId: '',
      mediaFile: null,
      linkUrl: '',
      linkText: ''
    });
    setMediaPreview(null);
    setError('');
    setEditingNotification(null);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTargetIcon = (targetType) => {
    switch (targetType) {
      case 'program': return <GraduationCap className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Send notifications to students</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          Create Notification
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications sent yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-admin-primary hover:underline"
            >
              Send your first notification
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          {getTargetIcon(notification.target_type)}
                          <span>
                            {notification.target_type === 'all' && 'All Students'}
                            {notification.target_type === 'program' && notification.program_name}
                            {notification.target_type === 'user' && notification.target_email}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{notification.read_count} read</span>
                        <span>•</span>
                        <span>
                          {new Date(notification.created_at).toLocaleDateString()} at{' '}
                          {new Date(notification.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {notification.creator_first_name && (
                        <p className="text-xs text-gray-400 mt-2">
                          Sent by {notification.creator_first_name} {notification.creator_last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(notification)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit notification"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete notification"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Notification Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => {
                if (!submitting) {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }
              }}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-8 pt-6 pb-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-admin-primary/10 rounded-lg">
                        <Bell className="w-6 h-6 text-admin-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {editingNotification ? 'Edit Notification' : 'Create Notification'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {editingNotification ? 'Update notification details' : 'Send important updates to students'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        resetForm();
                      }}
                      disabled={submitting}
                      className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notification Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Exam Schedule Update"
                        disabled={submitting}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent disabled:bg-gray-100"
                        required
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Write your message here... Be clear and concise."
                        rows="6"
                        disabled={submitting}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent disabled:bg-gray-100 resize-none"
                        required
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.message.length} characters
                      </p>
                    </div>

                    {/* Media Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Attach Media (Optional)
                      </label>
                      
                      {!mediaPreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-admin-primary transition-colors">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="media-upload"
                            disabled={submitting}
                          />
                          <label 
                            htmlFor="media-upload"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Image className="w-6 h-6 text-gray-400" />
                              <Video className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Click to upload image or video
                            </p>
                            <p className="text-xs text-gray-500">
                              Supports: JPG, PNG, GIF, MP4, WebM (Max 10MB)
                            </p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative border border-gray-300 rounded-lg p-4">
                          {mediaPreview.type === 'image' ? (
                            <img
                              src={mediaPreview.url}
                              alt="Preview"
                              className="w-full h-48 object-contain bg-gray-100 rounded"
                            />
                          ) : (
                            <video
                              src={mediaPreview.url}
                              controls
                              className="w-full h-48 object-contain bg-black rounded"
                            />
                          )}
                          <button
                            type="button"
                            onClick={removeMedia}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <p className="text-sm text-gray-600 mt-2 text-center">
                            {formData.mediaFile?.name} ({(formData.mediaFile?.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Link Fields */}
                    <div className="space-y-4 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🔗</span>
                        <h4 className="text-sm font-semibold text-gray-700">Call-to-Action Link (Optional)</h4>
                      </div>
                      <p className="text-xs text-purple-700 mb-3">
                        Add a button that redirects students to a specific page (e.g., course page, external resource)
                      </p>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Link URL
                        </label>
                        <input
                          type="url"
                          name="linkUrl"
                          value={formData.linkUrl}
                          onChange={handleInputChange}
                          placeholder="https://example.com/course or /course/123"
                          disabled={submitting}
                          className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent disabled:bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use full URL (https://...) or internal path (/course/123)
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Text
                        </label>
                        <input
                          type="text"
                          name="linkText"
                          value={formData.linkText}
                          onChange={handleInputChange}
                          placeholder="e.g., View Course, Learn More, Register Now"
                          disabled={submitting}
                          maxLength={100}
                          className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent disabled:bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.linkText ? `"${formData.linkText}"` : 'What should the button say?'} (Max 100 characters)
                        </p>
                      </div>
                      
                      {formData.linkUrl && !formData.linkText && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-800">
                            Please add button text for the link
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      {/* Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Notification Type
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          disabled={submitting}
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="info">ℹ️ Info</option>
                          <option value="success">✅ Success</option>
                          <option value="warning">⚠️ Warning</option>
                          <option value="error">❌ Error</option>
                        </select>
                      </div>

                      {/* Target Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Send To <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="targetType"
                          value={formData.targetType}
                          onChange={handleInputChange}
                          disabled={submitting || editingNotification}
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="all">👥 All Students</option>
                          <option value="program">🎓 Specific Program</option>
                        </select>
                        {editingNotification && (
                          <p className="text-xs text-gray-500 mt-1">
                            Target audience cannot be changed after creation
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Program Selection */}
                    {formData.targetType === 'program' && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Program <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="targetProgramId"
                          value={formData.targetProgramId}
                          onChange={handleInputChange}
                          disabled={submitting || editingNotification}
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent disabled:bg-gray-100 bg-white"
                          required
                        >
                          <option value="">Choose a program...</option>
                          {programs.map((program) => (
                            <option key={program.id} value={program.id}>
                              {program.code} - {program.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-blue-700 mt-2">
                          {editingNotification 
                            ? 'Target program cannot be changed after creation'
                            : 'Only students enrolled in this program will receive the notification'
                          }
                        </p>
                      </div>
                    )}

                    {/* Preview Box */}
                    {formData.title || formData.message || formData.linkUrl ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview</p>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          {formData.title && (
                            <h4 className="font-semibold text-gray-900 mb-1">{formData.title}</h4>
                          )}
                          {formData.message && (
                            <p className="text-sm text-gray-600 mb-3">{formData.message}</p>
                          )}
                          {formData.linkUrl && formData.linkText && (
                            <button className="mt-2 px-4 py-2 bg-admin-primary text-white text-sm rounded-lg hover:bg-green-700 font-medium">
                              {formData.linkText} →
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-5 flex gap-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 px-6 py-3 bg-admin-primary text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    {uploading ? (
                      <>
                        <Upload className="w-5 h-5 animate-bounce" />
                        Uploading media...
                      </>
                    ) : submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {editingNotification ? 'Updating...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {editingNotification ? 'Update Notification' : 'Send Notification'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      <CustomConfirm {...confirmState} />
    </div>
  );
};

export default NotificationsPage;
