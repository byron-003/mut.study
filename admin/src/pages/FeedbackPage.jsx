import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAlert, useConfirm } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';
import CustomConfirm from '../components/CustomConfirm';
import {
  MessageSquare, Trash2, Search, Star, CheckCircle, Clock, Wand2, ChevronDown, ChevronUp
} from 'lucide-react';

const CATEGORY_LABELS = {
  general: 'General',
  bug: 'Bug Report',
  'feature-request': 'Feature Request',
  content: 'Content',
  other: 'Other',
};

const STATUS_STYLES = {
  new: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

const RatingStars = ({ rating, size = 16 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        style={{ width: size, height: size }}
        className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
      />
    ))}
  </div>
);

const FeedbackPage = () => {
  const { alertState, showAlert, closeAlert } = useAlert();
  const { confirmState, showConfirm } = useConfirm();
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, newCount: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      const response = await adminAPI.getFeedback(params);
      setFeedback(response.data.data.feedback);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      showAlert('Error', 'Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFeedback();
  };

  const handleStatusChange = async (id, status) => {
    try {
      await adminAPI.updateFeedbackStatus(id, status);
      showAlert('Success', 'Feedback status updated', 'success');
      fetchFeedback();
    } catch (error) {
      console.error('Error updating feedback status:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = (item) => {
    showConfirm({
      title: 'Delete Feedback',
      message: `Delete feedback from ${item.user.name}? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteFeedback(item.id);
          showAlert('Success', 'Feedback deleted', 'success');
          fetchFeedback();
        } catch (error) {
          console.error('Error deleting feedback:', error);
          showAlert('Error', 'Failed to delete feedback', 'error');
        }
      }
    });
  };

  const maxDistribution = Math.max(1, ...Object.values(stats.distribution || {}));

  return (
    <div className="space-y-6">
      <CustomAlert
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
      />
      <CustomConfirm
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Feedback</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Feedback and ratings submitted by users</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user or feedback..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-admin-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600 fill-yellow-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          </p>
          <RatingStars rating={Math.round(stats.avgRating)} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">New / Unreviewed</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.newCount}</p>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rating Distribution</h2>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.distribution?.[rating] || 0;
            const pct = Math.round((count / maxDistribution) * 100);
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'new', 'reviewed', 'resolved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-admin-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary"></div>
        </div>
      ) : feedback.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No feedback found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-admin-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {item.user.name ? item.user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <RatingStars rating={item.rating} size={20} />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] || STATUS_STYLES.new}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </span>
                  <span className="text-sm text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4">
                <p className={`text-gray-700 dark:text-gray-300 ${expandedId === item.id ? '' : 'line-clamp-2'}`}>
                  {item.feedback}
                </p>
                {item.feedback.length > 120 && (
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="mt-1 text-sm text-admin-primary hover:underline flex items-center gap-1"
                  >
                    {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {expandedId === item.id ? 'Show less' : 'Show full feedback'}
                  </button>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-gray-400" />
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <button
                  onClick={() => handleDelete(item)}
                  className="flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;