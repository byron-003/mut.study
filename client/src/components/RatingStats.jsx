import React from 'react';
import { Star } from 'lucide-react';

/**
 * RatingStats Component - Display rating distribution with bars
 * @param {object} stats - Rating statistics object
 * @param {number} stats.average_rating - Average rating (0-5)
 * @param {number} stats.total_ratings - Total number of ratings
 * @param {number} stats.five_star - Count of 5-star ratings
 * @param {number} stats.four_star - Count of 4-star ratings
 * @param {number} stats.three_star - Count of 3-star ratings
 * @param {number} stats.two_star - Count of 2-star ratings
 * @param {number} stats.one_star - Count of 1-star ratings
 */
const RatingStats = ({ stats }) => {
  if (!stats || stats.total_ratings === 0) {
    return (
      <div className="text-center py-8 text-gray-500 ">
        <Star className="w-12 h-12 mx-auto mb-2 text-gray-300 " />
        <p className="text-sm">No ratings yet</p>
        <p className="text-xs mt-1">Be the first to rate this resource</p>
      </div>
    );
  }

  const {
    average_rating = 0,
    total_ratings = 0,
    five_star = 0,
    four_star = 0,
    three_star = 0,
    two_star = 0,
    one_star = 0
  } = stats;

  const ratingData = [
    { stars: 5, count: five_star },
    { stars: 4, count: four_star },
    { stars: 3, count: three_star },
    { stars: 2, count: two_star },
    { stars: 1, count: one_star }
  ];

  const getPercentage = (count) => {
    return total_ratings > 0 ? (count / total_ratings) * 100 : 0;
  };

  return (
    <div className="bg-white  rounded-lg p-6 shadow-sm border border-gray-200 ">
      {/* Overall Rating */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 ">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900  mb-1">
            {parseFloat(average_rating).toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(average_rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-300  '
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 ">
            {total_ratings} {total_ratings === 1 ? 'rating' : 'ratings'}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {ratingData.map(({ stars, count }) => {
            const percentage = getPercentage(count);
            
            return (
              <div key={stars} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-xs font-medium text-gray-700 ">
                    {stars}
                  </span>
                  <Star className="w-3 h-3 fill-gray-400 text-gray-400  " />
                </div>
                
                <div className="flex-1 h-2 bg-gray-100  rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <span className="text-xs text-gray-600  w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rating Breakdown Summary */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600 ">
            {((five_star + four_star) / total_ratings * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600 ">Positive</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-mut-primary">
            {five_star}
          </div>
          <div className="text-xs text-gray-600 ">5-Star Ratings</div>
        </div>
      </div>
    </div>
  );
};

export default RatingStats;
