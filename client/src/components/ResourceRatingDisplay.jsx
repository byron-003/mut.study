import React from 'react';
import { Star, MessageSquare } from 'lucide-react';

/**
 * ResourceRatingDisplay Component - Compact rating display for resource cards
 * @param {number} averageRating - Average rating (0-5)
 * @param {number} ratingCount - Total number of ratings
 * @param {number} reviewCount - Total number of reviews
 * @param {function} onClick - Click handler to open full rating/review modal
 * @param {string} size - Size variant: 'sm', 'md'
 */
const ResourceRatingDisplay = ({ 
  averageRating = 0, 
  ratingCount = 0, 
  reviewCount = 0,
  onClick,
  size = 'sm'
}) => {
  const hasRatings = ratingCount > 0;
  const rating = parseFloat(averageRating) || 0;

  const sizeClasses = {
    sm: {
      star: 'w-3.5 h-3.5',
      text: 'text-xs',
      gap: 'gap-1'
    },
    md: {
      star: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-1.5'
    }
  };

  const classes = sizeClasses[size] || sizeClasses.sm;

  if (!hasRatings) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 text-gray-400  hover:text-mut-primary 
                  transition-colors group"
      >
        <Star className={`${classes.star} group-hover:fill-mut-primary `} />
        <span className={`${classes.text} font-medium`}>No ratings yet</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center ${classes.gap} hover:opacity-80 transition-opacity`}
    >
      {/* Star Rating */}
      <div className="flex items-center gap-0.5">
        <Star className={`${classes.star} fill-yellow-400 text-yellow-400`} />
        <span className={`${classes.text} font-bold text-gray-900 `}>
          {rating.toFixed(1)}
        </span>
      </div>

      {/* Rating Count */}
      <span className={`${classes.text} text-gray-600 `}>
        ({ratingCount})
      </span>

      {/* Review Count */}
      {reviewCount > 0 && (
        <div className="flex items-center gap-1 ml-1">
          <MessageSquare className={`${classes.star} text-gray-400 `} />
          <span className={`${classes.text} text-gray-600 `}>
            {reviewCount}
          </span>
        </div>
      )}
    </button>
  );
};

export default ResourceRatingDisplay;
