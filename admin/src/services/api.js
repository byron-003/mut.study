import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mut-study.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
};

// Admin Statistics API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  updateClassRepStatus: (id, isClassRep) => api.put(`/admin/users/${id}/class-rep`, { isClassRep }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  getResources: (params) => api.get('/admin/resources', { params }),
  approveResource: (id) => api.put(`/admin/resources/${id}/approve`),
  rejectResource: (id, reason) => api.put(`/admin/resources/${id}/reject`, { reason }),
  deleteResource: (id) => api.delete(`/admin/resources/${id}`),
  bulkApproveResources: (ids) => api.post('/admin/resources/bulk-approve', { ids }),
  bulkRejectResources: (ids, reason) => api.post('/admin/resources/bulk-reject', { ids, reason }),
  
  getPrograms: (params) => api.get('/admin/programs', { params }),
  createProgram: (data) => api.post('/admin/programs', data),
  updateProgram: (id, data) => api.put(`/admin/programs/${id}`, data),
  deleteProgram: (id) => api.delete(`/admin/programs/${id}`),
  getProgramsDropdown: () => api.get('/admin/programs/list'),
  
  getCourses: (params) => api.get('/admin/courses', { params }),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  
  getDepartments: () => api.get('/admin/departments/list'),
  
  // System settings
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, value) => api.put('/admin/settings', { key, value }),
  updateSettings: (settings) => api.put('/admin/settings/bulk', { settings }),

  // Announcement banner (shown to users below the header)
  getBanner: () => api.get('/admin/public/banner'),
  setBanner: (message) => api.put('/admin/banner', { message }),
  clearBanner: () => api.delete('/admin/banner'),
  
  // Platform feedback (admin only)
  getFeedback: (params) => api.get('/admin/feedback', { params }),
  updateFeedbackStatus: (id, status) => api.patch(`/admin/feedback/${id}/status`, { status }),
  deleteFeedback: (id) => api.delete(`/admin/feedback/${id}`),

  // Email service (admin only)
  getEmailStatus: () => api.get('/admin/email/status'),
  runEmailCheck: () => api.post('/admin/email/check'),
  sendTestEmail: (to) => api.post('/admin/email/test', { to }),
  clearEmailLogs: () => api.delete('/admin/email/logs'),
  
  // Notifications
  createNotification: (data) => api.post('/notifications', data),
  getAllNotifications: (params) => api.get('/notifications/admin/all', { params }),
  updateNotification: (id, data) => api.put(`/notifications/${id}`, data),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  
  // File Upload
  uploadFile: (formData) => api.post('/admin/upload', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
};

export default api;
