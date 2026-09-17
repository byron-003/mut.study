import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

/**
 * ReviewForm Component - Form for writing or editing reviews
 * @param {function} onSubmit - Callback when form is submitted
 * @param {function} onCancel - Callback when form is cancelled
 * @param {string} initialValue - Initial review text (for editing)
 * @param {boolean} isSubmitting - Loading state
 */
const ReviewForm = ({ 
  onSubmit, 
  onCancel, 
  initialValue = '', 
  isSubmitting = false 
}) => {
  const [reviewText, setReviewText] = useState(initialValue);
  const [error, setError] = useState('');

  const minLength = 10;
  const maxLength = 1000;
  const remainingChars = maxLength - reviewText.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (reviewText.trim().length < minLength) {
      setError(`Review must be at least ${minLength} characters long`);
      return;
    }

    if (reviewText.length > maxLength) {
      setError(`Review must not exceed ${maxLength} characters`);
      return;
    }

    onSubmit(reviewText.trim());
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setReviewText(value);
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label 
          htmlFor="review-text" 
          className="block text-sm font-medium text-gray-700  mb-2"
        >
          Write your review
        </label>
        <textarea
          id="review-text"
          value={reviewText}
          onChange={handleChange}
          placeholder="Share your thoughts about this resource... What did you find helpful? Any suggestions for improvement?"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300  rounded-lg 
                   focus:ring-2 focus:ring-mut-primary focus:border-transparent
                   bg-white  text-gray-900 
                   placeholder-gray-400 
                   resize-none transition-colors"
          disabled={isSubmitting}
        />
        
        {/* Character Count */}
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs text-gray-500 ">
            {reviewText.trim().length >= minLength ? (
              <span className="text-green-600 ">✓ Minimum length met</span>
            ) : (
              <span>At least {minLength} characters required</span>
            )}
          </div>
          <div className={`text-xs font-medium ${
            remainingChars < 50 
              ? 'text-orange-600 ' 
              : 'text-gray-500 '
          }`}>
            {remainingChars} characters remaining
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-red-600 ">
            {error}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || reviewText.trim().length < minLength}
          className="flex items-center gap-2 px-4 py-2 bg-mut-primary text-white rounded-lg
                   hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors font-medium text-sm"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Review
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 
                     text-gray-700  rounded-lg hover:bg-gray-50 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>

      {/* Guidelines */}
      <div className="mt-4 p-3 bg-blue-50  border border-blue-200  rounded-lg">
        <p className="text-xs text-blue-800  font-medium mb-1">
          Review Guidelines:
        </p>
        <ul className="text-xs text-blue-700  space-y-0.5 ml-4 list-disc">
          <li>Be respectful and constructive</li>
          <li>Focus on the resource quality and usefulness</li>
          <li>Avoid personal attacks or inappropriate language</li>
        </ul>
      </div>
    </form>
  );
};

export default ReviewForm;
