import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const progressAPI = {
  // Update progress for a resource
  updateProgress: (resourceId, data) =>
    axios.post(`${API_URL}/progress/${resourceId}/update`, data, getAuthHeader()),

  // Get progress for a specific resource
  getProgress: (resourceId) =>
    axios.get(`${API_URL}/progress/${resourceId}`, getAuthHeader()),

  // Get study history
  getStudyHistory: (params = {}) =>
    axios.get(`${API_URL}/progress/history/all`, {
      ...getAuthHeader(),
      params
    }),

  // Get study statistics
  getStudyStats: () =>
    axios.get(`${API_URL}/progress/stats/overview`, getAuthHeader()),

  // Mark resource as completed
  markAsCompleted: (resourceId) =>
    axios.post(`${API_URL}/progress/${resourceId}/complete`, {}, getAuthHeader()),

  // Start study session
  startSession: (resourceId) =>
    axios.post(`${API_URL}/progress/session/${resourceId}/start`, {}, getAuthHeader()),

  // End study session
  endSession: (sessionId, progressAtEnd) =>
    axios.put(`${API_URL}/progress/session/${sessionId}/end`, { progressAtEnd }, getAuthHeader())
};
