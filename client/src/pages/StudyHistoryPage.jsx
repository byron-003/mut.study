import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressAPI } from '../services/progressAPI';
import { 
  History, Clock, CheckCircle, BookOpen, TrendingUp, 
  Calendar, Filter, Search, Eye, Award, Flame, Target,
  BarChart3, Book, FileText, Video
} from 'lucide-react';

const StudyHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCompleted, setFilterCompleted] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistoryAndStats();
  }, [filterCompleted]);

  const fetchHistoryAndStats = async () => {
    try {
      setLoading(true);
      
      // Fetch history
      const historyParams = filterCompleted !== 'all' 
        ? { completed: filterCompleted } 
        : {};
      const historyResponse = await progressAPI.getStudyHistory(historyParams);
      setHistory(historyResponse.data.data);

      // Fetch stats
      const statsResponse = await progressAPI.getStudyStats();
      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getFileIcon = (category) => {
    switch (category) {
      case 'notes':
        return <BookOpen className="w-5 h-5" />;
      case 'cat':
      case 'assignment':
        return <FileText className="w-5 h-5" />;
      case 'past_paper':
      case 'pastpaper':
        return <Book className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getFileTypeColor = (category) => {
    switch (category) {
      case 'notes':
        return 'bg-blue-100 text-blue-700';
      case 'cat':
      case 'assignment':
        return 'bg-orange-100 text-orange-700';
      case 'past_paper':
      case 'pastpaper':
        return 'bg-purple-100 text-purple-700';
      case 'video':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredHistory = history.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return item.resource.title.toLowerCase().includes(query) ||
           item.resource.description?.toLowerCase().includes(query) ||
           item.resource.course?.title?.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mut-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your study history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <History className="w-8 h-8 text-mut-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Study History</h1>
          </div>
          <p className="text-gray-600">Track your learning progress and achievements</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Resources */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {stats.overview.totalResources}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Resources Studied</h3>
            </div>

            {/* Completion Rate */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {stats.overview.completionRate}%
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.overview.completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Total Time */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {formatTime(stats.overview.totalTimeSpent)}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Time Spent Studying</h3>
            </div>

            {/* Current Streak */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {stats.streak.current}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Day Streak 🔥</h3>
              <p className="text-xs text-gray-500 mt-1">
                Longest: {stats.streak.longest} days
              </p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or course..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
              />
            </div>

            {/* Filter by Completion */}
            <select
              value={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mut-primary"
            >
              <option value="all">All Resources</option>
              <option value="true">Completed Only</option>
              <option value="false">In Progress</option>
            </select>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No results found' : 'No study history yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try adjusting your search or filters' 
                : 'Start exploring resources from your dashboard to build your study history'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg ${getFileTypeColor(item.resource.category)}`}>
                      {getFileIcon(item.resource.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.resource.title}
                          </h3>
                          {item.resource.course && (
                            <p className="text-sm text-gray-500">
                              {item.resource.course.code} - {item.resource.course.title}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        {item.completed ? (
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex-shrink-0">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex-shrink-0">
                            <TrendingUp className="w-4 h-4" />
                            In Progress
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">{item.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              item.completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(item.timeSpent)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Last: {new Date(item.lastAccessed).toLocaleDateString()}</span>
                        </div>
                        {item.startedAt && (
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>Started: {new Date(item.startedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {item.completedAt && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Award className="w-4 h-4" />
                            <span>Completed: {new Date(item.completedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="mt-4">
                        <button
                          onClick={() => navigate('/dashboard')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-mut-primary text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          {item.completed ? 'View Again' : 'Continue Reading'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Resources Section */}
        {stats && stats.topResources && stats.topResources.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-mut-primary" />
              Most Studied Resources
            </h2>
            <div className="space-y-3">
              {stats.topResources.map((resource, index) => (
                <div
                  key={resource.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-mut-primary text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{resource.title}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{formatTime(resource.timeSpent)}</span>
                      <span>•</span>
                      <span>{resource.progress}%</span>
                      {resource.completed && (
                        <>
                          <span>•</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyHistoryPage;
