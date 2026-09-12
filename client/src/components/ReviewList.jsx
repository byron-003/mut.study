import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Edit2, Trash2, Flag, MoreVertical } from 'lucide-react';
import { useAuth } from '../utils/authContext';

/**
 * ReviewList Component - Display list of reviews with actions
 * @param {array} reviews - Array of review objects
 * @param {function} onHelpful - Callback when helpful button clicked
 * @param {function} onEdit - Callback when edit button clicked
 * @param {function} onDelete - Callback when delete button clicked
 * @param {function} onReport - Callback when report button clicked
 * @param {boolean} loading - Loading state
 */
const ReviewList = ({ 
  reviews = [], 
  onHelpful, 
  onEdit, 
  onDelete, 
  onReport,
  loading = false 
}) => {
  const { user } = useAuth();
  const [openMenuId, setOpenMenuId] = useState(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded" />
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No reviews yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Be the first to share your thoughts
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const toggleMenu = (reviewId) => {
    setOpenMenuId(openMenuId === reviewId ? null : reviewId);
  };

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isOwnReview = user && user.id === review.user_id;
        const hasVoted = review.user_found_helpful > 0;

        return (
          <div
            key={review.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700
                     hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {review.profile_picture ? (
                  <img
                    src={review.profile_picture}
                    alt={review.user_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-10 h-10 bg-mut-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {review.user_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}

                {/* User Info */}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {review.user_name}
                    {isOwnReview && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(review.created_at)}
                  </div>
                </div>
              </div>

              {/* Actions Menu */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => toggleMenu(review.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>

                  {openMenuId === review.id && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg 
                                    border border-gray-200 dark:border-gray-700 py-1 z-20">
                        {isOwnReview && onEdit && (
                          <button
                            onClick={() => {
                              onEdit(review);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Review
                          </button>
                        )}

                        {isOwnReview && onDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this review?')) {
                                onDelete(review.id);
                              }
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400
                                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Review
                          </button>
                        )}

                        {!isOwnReview && onReport && (
                          <button
                            onClick={() => {
                              if (window.confirm('Report this review as inappropriate?')) {
                                onReport(review.id);
                              }
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 dark:text-orange-400
                                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Flag className="w-4 h-4" />
                            Report Review
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Review Text */}
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              {review.review_text}
            </p>

            {/* Footer - Helpful Button */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              {user && onHelpful && (
                <button
                  onClick={() => onHelpful(review.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                           transition-colors ${
                    hasVoted
                      ? 'bg-mut-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-white' : ''}`} />
                  Helpful
                  {review.helpful_count > 0 && (
                    <span className={`${hasVoted ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      ({review.helpful_count})
                    </span>
                  )}
                </button>
              )}

              {!user && review.helpful_count > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ThumbsUp className="w-4 h-4" />
                  {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;
