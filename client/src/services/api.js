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
  changePassword: (data) => api.put('/auth/change-password', data),
  getSettings: () => api.get('/auth/settings'),
  updateSettings: (data) => api.put('/auth/settings', data),
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

// AI Summarization API
export const aiAPI = {
  summarizeResource: async (resourceId, fileUrl) => {
    console.log('📥 CLIENT: Starting file download from:', fileUrl);
    
    // Validate fileUrl
    if (!fileUrl) {
      throw new Error('File URL is required for summarization');
    }
    
    // Fix Cloudinary URL to get raw file instead of HTML preview
    let downloadUrl = fileUrl;
    if (fileUrl.includes('cloudinary.com')) {
      // Replace /upload/ with /upload/fl_attachment/ to force download
      downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
      console.log('📥 CLIENT: Converted Cloudinary URL to:', downloadUrl);
    }
    
    // Download file from URL with proper headers
    const fileResponse = await fetch(downloadUrl, {
      headers: {
        'Accept': 'application/pdf,application/octet-stream,*/*'
      }
    });
    console.log(`📥 CLIENT: Fetch response status: ${fileResponse.status}`);
    console.log(`📥 CLIENT: Content-Type: ${fileResponse.headers.get('Content-Type')}`);
    console.log(`📥 CLIENT: Content-Length: ${fileResponse.headers.get('Content-Length')} bytes`);
    
    const fileBlob = await fileResponse.blob();
    console.log(`📥 CLIENT: Blob created - size: ${fileBlob.size} bytes, type: ${fileBlob.type}`);
    
    // If we got HTML (error page), throw error
    if (fileBlob.type.includes('text/html') || fileBlob.size < 5000) {
      console.error('❌ CLIENT: Received HTML or very small file instead of document');
      throw new Error('Failed to download file - received invalid content. The file URL may be incorrect.');
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('resourceId', resourceId);
    formData.append('file', fileBlob, 'document.pdf');
    
    console.log(`📤 CLIENT: FormData created with resourceId: ${resourceId}`);
    console.log(`📤 CLIENT: File in FormData - name: document.pdf, size: ${fileBlob.size} bytes`);
    console.log('📤 CLIENT: Sending to server /api/ai/summarize...');
    
    // Send to server
    const response = await api.post('/ai/summarize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ CLIENT: Response received from server');
    return response;
  },
  getSummaryHistory: (params) => api.get('/ai/summaries', { params }),
  getSummaryStats: () => api.get('/ai/summaries/stats'),
  getSummaryById: (id) => api.get(`/ai/summaries/${id}`),
  deleteSummary: (id) => api.delete(`/ai/summaries/${id}`),
};

export default api;
