import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating Component - Interactive 5-star rating selector
 * @param {number} value - Current rating value (0-5)
 * @param {function} onChange - Callback when rating changes
 * @param {boolean} readonly - If true, stars are not clickable
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {boolean} showValue - Show numeric value next to stars
 */
const StarRating = ({ 
  value = 0, 
  onChange, 
  readonly = false, 
  size = 'md',
  showValue = false 
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  const handleClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`
              transition-all duration-150
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              ${!readonly && 'focus:outline-none focus:ring-2 focus:ring-mut-primary focus:ring-offset-1 rounded'}
            `}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className={`
                ${starSize}
                transition-colors duration-150
                ${star <= displayValue 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-gray-200 text-gray-300  '
                }
              `}
            />
          </button>
        ))}
      </div>
      
      {showValue && (
        <span className="text-sm font-medium text-gray-700  ml-1">
          {displayValue > 0 ? displayValue.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
