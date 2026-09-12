import express from 'express';
const router = express.Router();
import {
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
  getTopRatedResources,
  recalculateReputation,
  getBadgeInfo
} from '../controllers/ratingReviewController.js';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';

// =============================================
// RATING ROUTES
// =============================================

// Add or update rating (requires authentication)
router.post('/ratings', authenticate, addOrUpdateRating);

// Get ratings for a resource (public, but shows user's rating if authenticated)
router.get('/ratings/resource/:resourceId', optionalAuth, getResourceRatings);

// Delete user's rating (requires authentication)
router.delete('/ratings/:resourceId', authenticate, deleteRating);

// =============================================
// REVIEW ROUTES
// =============================================

// Add a review (requires authentication)
router.post('/reviews', authenticate, addReview);

// Get reviews for a resource (public with optional auth for helpful status)
router.get('/reviews/resource/:resourceId', optionalAuth, getResourceReviews);

// Update a review (requires authentication, owner only)
router.put('/reviews/:reviewId', authenticate, updateReview);

// Delete a review (requires authentication, owner or admin)
router.delete('/reviews/:reviewId', authenticate, deleteReview);

// Mark review as helpful (requires authentication)
router.post('/reviews/:reviewId/helpful', authenticate, markReviewHelpful);

// Report a review (requires authentication)
router.post('/reviews/:reviewId/report', authenticate, reportReview);

// =============================================
// REPUTATION & LEADERBOARD ROUTES
// =============================================

// Get user reputation (public)
router.get('/reputation/user/:userId', getUserReputation);

// Get leaderboard (public)
router.get('/reputation/leaderboard', getLeaderboard);

// Get top-rated resources (public)
router.get('/resources/top-rated', getTopRatedResources);

// Recalculate user reputation (requires authentication)
router.post('/reputation/recalculate/:userId', authenticate, recalculateReputation);

// Get badge requirements (public)
router.get('/reputation/badge-requirements', getBadgeInfo);

export default router;
