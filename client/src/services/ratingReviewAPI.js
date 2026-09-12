import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// =============================================
// RATING ENDPOINTS
// =============================================

/**
 * Add or update a rating for a resource
 * @param {number} resourceId - Resource ID
 * @param {number} rating - Rating value (1-5)
 */
export const addOrUpdateRating = async (resourceId, rating) => {
  const response = await axios.post(
    `${API_URL}/ratings`,
    { resourceId, rating },
    { headers: getAuthHeader() }
  );
  return response.data;
};

/**
 * Get ratings for a resource
 * @param {number} resourceId - Resource ID
 */
export const getResourceRatings = async (resourceId) => {
  const response = await axios.get(
    `${API_URL}/ratings/resource/${resourceId}`,
    { headers: getAuthHeader() }
  );
  return response.data;
};

/**
 * Delete user's rating for a resource
 * @param {number} resourceId - Resource ID
 */
export const deleteRating = async (resourceId) => {
  const response = await axios.delete(
    `${API_URL}/ratings/${resourceId}`,
    { headers: getAuthHeader() }
  );
  return response.data;
};

// =============================================
// REVIEW ENDPOINTS
// =============================================

/**
 * Add a review for a resource
 * @param {number} resourceId - Resource ID
 * @param {string} reviewText - Review text
 */
export const addReview = async (resourceId, reviewText) => {
  const response = await axios.post(
    `${API_URL}/reviews`,
    { resourceId, reviewText },
    { headers: getAuthHeader() }
  );
  return response.data;
};

/**
 * Get reviews for a resource
 * @param {number} resourceId - Resource ID
 * @param {object} options - Query options { sort, limit, offset }
 */
export const getResourceReviews = async (resourceId, options = {}) => {
  const { sort = 'recent', limit = 10, offset = 0 } = options;
  const response = await axios.get(
    `${API_URL}/reviews/resource/${resourceId}`,
    {
      params: { sort, limit, offset },
      headers: getAuthHeader()
    }
  );
  return response.data;
};

/**
 * Update a review
 * @param {number} reviewId - Review ID
 * @param {string} reviewText - Updated review text
 */
export const updateReview = async (reviewId, reviewText) => {
  const response = await axios.put(
    `${API_URL}/reviews/${reviewId}`,
    { reviewText },
    { headers: getAuthHeader() }
  );
  return response.data;
};

/**
 * Delete a review
 * @param {number} reviewId - Review ID
 */
export const deleteReview = async (reviewId) => {
  const response = await axios.delete(
    `${API_URL}/reviews/${reviewId}`,
    { headers: getAuthHeader() }
  );
  return response.data;
};

/**
 * Mark a review as helpful (toggle)
 * @param {number} reviewId - Review ID
 */
export const markReviewHelpful = async (reviewId) => {
  const response = await axios.post(
    `${API_URL}/reviews/${reviewId}/helpful`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

/**
 * Report a review
 * @param {number} reviewId - Review ID
 */
export const reportReview = async (reviewId) => {
  const response = await axios.post(
    `${API_URL}/reviews/${reviewId}/report`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

// =============================================
// REPUTATION & LEADERBOARD ENDPOINTS
// =============================================

/**
 * Get user reputation details
 * @param {number} userId - User ID
 */
export const getUserReputation = async (userId) => {
  const response = await axios.get(`${API_URL}/reputation/user/${userId}`);
  return response.data;
};

/**
 * Get leaderboard
 * @param {object} options - Query options { limit, offset }
 */
export const getLeaderboard = async (options = {}) => {
  const { limit = 20, offset = 0 } = options;
  const response = await axios.get(`${API_URL}/reputation/leaderboard`, {
    params: { limit, offset }
  });
  return response.data;
};

/**
 * Get top-rated resources
 * @param {object} options - Query options { limit, category }
 */
export const getTopRatedResources = async (options = {}) => {
  const { limit = 10, category } = options;
  const response = await axios.get(`${API_URL}/resources/top-rated`, {
    params: { limit, category }
  });
  return response.data;
};

export default {
  addOrUpdateRating,
  getResourceRatings,
  deleteRating,
  addReview,
  getResourceReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
  getUserReputation,
  getLeaderboard,
  getTopRatedResources
};
