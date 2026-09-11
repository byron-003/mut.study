import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Search API
export const searchAPI = {
  search: (query) => api.get('/search', { params: { q: query } }),
  autocomplete: (query, type = 'all') => api.get('/search/autocomplete', { params: { q: query, type } }),
};

// Schools API
export const schoolsAPI = {
  getAllSchools: () => api.get('/schools'),
  getSchoolById: (id) => api.get(`/schools/${id}`),
  getDepartmentById: (id) => api.get(`/schools/departments/${id}`),
  getProgramById: (id) => api.get(`/schools/programs/${id}`),
  getCourseById: (id) => api.get(`/schools/courses/${id}`),
  getAllPrograms: (filters) => api.get('/schools/programs', { params: filters }),
};

// Resources API
export const resourcesAPI = {
  getResourcesByCourse: (courseId, filters) => api.get(`/resources/course/${courseId}`, { params: filters }),
  uploadResource: (formData, onUploadProgress) => api.post('/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onUploadProgress,
    timeout: 120000 // 2 minutes timeout for large files
  }),
  updateResource: (id, data) => api.put(`/resources/${id}`, data),
  getMyUploads: () => api.get('/resources/my-uploads'),
  getPendingResources: () => api.get('/resources/pending'),
  approveResource: (id) => api.put(`/resources/${id}/approve`),
  rejectResource: (id, reason) => api.put(`/resources/${id}/reject`, { reason }),
  deleteResource: (id) => api.delete(`/resources/${id}`),
  incrementDownloadCount: (id) => api.post(`/resources/${id}/download`),
};

// Alias for backward compatibility
export const resourceAPI = resourcesAPI;

// Class Rep API
export const classRepAPI = {
  createCourse: (data) => api.post('/class-rep/courses', data),
  getMyCourses: () => api.get('/class-rep/courses'),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
