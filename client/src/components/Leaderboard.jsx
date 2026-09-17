import React from 'react';
import { Trophy, TrendingUp, Star } from 'lucide-react';
import QualityBadge from './QualityBadge';

/**
 * Leaderboard Component - Display top contributors
 * @param {array} contributors - Array of top contributor objects
 * @param {boolean} loading - Loading state
 * @param {number} limit - Number of contributors to show
 */
const Leaderboard = ({ contributors = [], loading = false, limit = 10 }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100  rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300  rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300  rounded w-1/3" />
                <div className="h-3 bg-gray-300  rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contributors.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300  mx-auto mb-3" />
        <p className="text-gray-500  font-medium">No contributors yet</p>
      </div>
    );
  }

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-400 text-yellow-900';
      case 2: return 'bg-gray-300 text-gray-700';
      case 3: return 'bg-orange-400 text-orange-900';
      default: return 'bg-gray-200  text-gray-600 ';
    }
  };

  const displayedContributors = contributors.slice(0, limit);

  return (
    <div className="bg-white  rounded-lg shadow-sm border border-gray-200  overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-mut-primary to-mut-secondary p-4">
        <div className="flex items-center gap-2 text-white">
          <Trophy className="w-5 h-5" />
          <h3 className="font-bold text-lg">Top Contributors</h3>
        </div>
        <p className="text-green-100 text-sm mt-1">
          Recognizing our most valuable contributors
        </p>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-200 ">
        {displayedContributors.map((contributor, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;

          return (
            <div
              key={contributor.id}
              className={`
                p-4 flex items-center gap-4 transition-colors
                ${isTopThree ? 'bg-gradient-to-r from-yellow-50/50 to-transparent ' : ''}
                hover:bg-gray-50 
              `}
            >
              {/* Rank Badge */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${getMedalColor(rank)}
                  ${isTopThree ? 'ring-2 ring-offset-2 ring-yellow-400 ' : ''}
                `}
              >
                {rank}
              </div>

              {/* Profile Picture or Initials */}
              {contributor.profile_picture ? (
                <img
                  src={contributor.profile_picture}
                  alt={contributor.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 "
                />
              ) : (
                <div className="w-12 h-12 bg-mut-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {contributor.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              )}

              {/* Contributor Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900  truncate">
                    {contributor.name}
                  </h4>
                  <QualityBadge badge={contributor.quality_badge} size="sm" showLabel={false} />
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600 ">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-medium">{contributor.reputation_score}</span>
                    <span>points</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{parseFloat(contributor.average_rating || 0).toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="font-medium">{contributor.total_approved_uploads}</span>
                    <span> uploads</span>
                  </div>
                </div>
              </div>

              {/* Top 3 Medal Icon */}
              {isTopThree && (
                <Trophy
                  className={`
                    w-6 h-6
                    ${rank === 1 ? 'text-yellow-500' : ''}
                    ${rank === 2 ? 'text-gray-400' : ''}
                    ${rank === 3 ? 'text-orange-500' : ''}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {contributors.length > limit && (
        <div className="bg-gray-50  px-4 py-3 text-center">
          <p className="text-sm text-gray-600 ">
            Showing top {limit} of {contributors.length} contributors
          </p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
