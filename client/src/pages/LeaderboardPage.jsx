import React, { useState, useEffect } from 'react';
import { Trophy, Award, TrendingUp, Info } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import { getLeaderboard } from '../services/ratingReviewAPI';

/**
 * LeaderboardPage - Display top contributors and reputation system info
 */
const LeaderboardPage = () => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLeaderboard({ limit: 50 });
      setContributors(response.data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Top Contributors
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Recognizing our most valuable community members who share quality educational resources
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Leaderboard - Left 2/3 */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <Leaderboard 
              contributors={contributors}
              loading={loading}
              limit={50}
            />
          </div>

          {/* Info Sidebar - Right 1/3 */}
          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-mut-primary" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  How Reputation Works
                </h3>
              </div>

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">
                    Earn Points By:
                  </p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>Uploading approved resources (50 pts)</li>
                    <li>Receiving high ratings (1-10 pts per rating)</li>
                    <li>Writing helpful reviews (5 pts)</li>
                    <li>Getting helpful votes on reviews (3 pts each)</li>
                    <li>Resources being downloaded (1 pt each)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quality Badges */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-mut-primary" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Quality Badges
                </h3>
              </div>

              <div className="space-y-4">
                {/* Bronze */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Bronze</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      100+ points, 5+ uploads, 3.0+ avg rating
                    </p>
                  </div>
                </div>

                {/* Silver */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Silver</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      500+ points, 15+ uploads, 3.5+ avg rating
                    </p>
                  </div>
                </div>

                {/* Gold */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Gold</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      1500+ points, 30+ uploads, 4.0+ avg rating
                    </p>
                  </div>
                </div>

                {/* Platinum */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Platinum</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      5000+ points, 50+ uploads, 4.5+ avg rating
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-mut-primary to-mut-secondary rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-bold">Community Impact</h3>
              </div>

              {!loading && contributors.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-green-100 text-sm">Total Contributors</p>
                    <p className="text-2xl font-bold">{contributors.length}</p>
                  </div>

                  <div>
                    <p className="text-green-100 text-sm">Total Resources Shared</p>
                    <p className="text-2xl font-bold">
                      {contributors.reduce((sum, c) => sum + c.total_approved_uploads, 0)}
                    </p>
                  </div>

                  <div>
                    <p className="text-green-100 text-sm">Average Community Rating</p>
                    <p className="text-2xl font-bold">
                      {(contributors.reduce((sum, c) => sum + parseFloat(c.average_rating || 0), 0) / contributors.length).toFixed(1)} ⭐
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Call to Action */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
              <Trophy className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Want to Join the Leaderboard?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Start sharing quality resources and helping your fellow students!
              </p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Upload Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
