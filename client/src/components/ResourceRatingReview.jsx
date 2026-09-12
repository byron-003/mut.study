import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../utils/authContext';
import StarRating from './StarRating';
import RatingStats from './RatingStats';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import {
  addOrUpdateRating,
  getResourceRatings,
  getResourceReviews,
  addReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview
} from '../services/ratingReviewAPI';

/**
 * ResourceRatingReview Component - Complete rating and review section for a resource
 * @param {number} resourceId - Resource ID
 * @param {boolean} isOpen - Modal open state
 * @param {function} onClose - Close modal callback
 */
const ResourceRatingReview = ({ resourceId, isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Rating state
  const [ratingStats, setRatingStats] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  // Review state
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  
  // Form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Load data when modal opens
  useEffect(() => {
    if (isOpen && resourceId) {
      loadRatings();
      loadReviews(0, sortBy);
    }
  }, [isOpen, resourceId, sortBy]);

  const loadRatings = async () => {
    try {
      const response = await getResourceRatings(resourceId);
      setRatingStats(response.data.stats);
      setUserRating(response.data.userRating || 0);
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const loadReviews = async (offset = 0, sort = 'recent') => {
    try {
      setReviewsLoading(true);
      const response = await getResourceReviews(resourceId, {
        sort,
        limit: 10,
        offset
      });
      
      if (offset === 0) {
        setReviews(response.data.reviews);
      } else {
        setReviews(prev => [...prev, ...response.data.reviews]);
      }
      
      setReviewsTotal(response.data.total);
      setHasMoreReviews(response.data.hasMore);
      setReviewsOffset(offset);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleRatingChange = async (rating) => {
    if (!isAuthenticated) {
      alert('Please login to rate resources');
      return;
    }

    try {
      setIsSubmittingRating(true);
      await addOrUpdateRating(resourceId, rating);
      setUserRating(rating);
      await loadRatings(); // Reload to get updated stats
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitReview = async (reviewText) => {
    try {
      setIsSubmittingReview(true);
      
      if (editingReview) {
        // Update existing review
        await updateReview(editingReview.id, reviewText);
      } else {
        // Add new review
        await addReview(resourceId, reviewText);
      }
      
      // Reload reviews
      await loadReviews(0, sortBy);
      setShowReviewForm(false);
      setEditingReview(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      await loadReviews(0, sortBy);
    } catch (error) {
      console.error('Error deleting review:', error);
      alert(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await markReviewHelpful(reviewId);
      // Update review in list
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const wasHelpful = review.user_found_helpful > 0;
            return {
              ...review,
              helpful_count: wasHelpful ? review.helpful_count - 1 : review.helpful_count + 1,
              user_found_helpful: wasHelpful ? 0 : 1
            };
          }
          return review;
        })
      );
    } catch (error) {
      console.error('Error marking review helpful:', error);
      alert(error.response?.data?.message || 'Failed to mark review as helpful');
    }
  };

  const handleReportReview = async (reviewId) => {
    try {
      await reportReview(reviewId);
      alert('Review reported successfully. Our team will review it.');
    } catch (error) {
      console.error('Error reporting review:', error);
      alert(error.response?.data?.message || 'Failed to report review');
    }
  };

  const handleLoadMoreReviews = () => {
    loadReviews(reviewsOffset + 10, sortBy);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    loadReviews(0, newSort);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-mut-primary to-mut-secondary p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Star className="w-6 h-6 fill-white" />
            <div>
              <h2 className="text-2xl font-bold">Ratings & Reviews</h2>
              <p className="text-green-100 text-sm mt-1">Share your experience with this resource</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Rating Stats */}
            <div className="lg:col-span-1">
              <RatingStats stats={ratingStats} />
              
              {/* User Rating Section */}
              {isAuthenticated && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Your Rating
                  </h3>
                  <div className="flex items-center gap-3">
                    <StarRating
                      value={userRating}
                      onChange={handleRatingChange}
                      size="lg"
                      showValue={true}
                    />
                  </div>
                  {userRating > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Click a star to update your rating
                    </p>
                  )}
                </div>
              )}

              {!isAuthenticated && (
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Please login to rate and review this resource
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Reviews */}
            <div className="lg:col-span-2 space-y-6">
              {/* Reviews Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Reviews ({reviewsTotal})
                  </h3>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                             focus:ring-2 focus:ring-mut-primary focus:border-transparent
                             text-sm cursor-pointer"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="helpful">Most Helpful</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Write Review Button */}
              {isAuthenticated && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600
                           rounded-lg hover:border-mut-primary dark:hover:border-mut-accent
                           hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors
                           text-gray-600 dark:text-gray-400 hover:text-mut-primary dark:hover:text-mut-accent
                           font-medium"
                >
                  + Write a Review
                </button>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {editingReview ? 'Edit Your Review' : 'Write Your Review'}
                  </h4>
                  <ReviewForm
                    onSubmit={handleSubmitReview}
                    onCancel={() => {
                      setShowReviewForm(false);
                      setEditingReview(null);
                    }}
                    initialValue={editingReview?.review_text || ''}
                    isSubmitting={isSubmittingReview}
                  />
                </div>
              )}

              {/* Reviews List */}
              <ReviewList
                reviews={reviews}
                onHelpful={handleMarkHelpful}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                onReport={handleReportReview}
                loading={reviewsLoading && reviewsOffset === 0}
              />

              {/* Load More Button */}
              {hasMoreReviews && (
                <button
                  onClick={handleLoadMoreReviews}
                  disabled={reviewsLoading}
                  className="w-full py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                           hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                           text-gray-700 dark:text-gray-300 font-medium text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {reviewsLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Load More Reviews
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceRatingReview;
