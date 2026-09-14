import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../services/api';
import { useAlert } from '../hooks/useAlert';
import { useConfirm } from '../hooks/useConfirm.jsx';
import CustomAlert from '../components/CustomAlert';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { 
  Sparkles, ArrowLeft, Clock, FileText, Trash2, 
  Calendar, Zap, TrendingUp, Filter, Search,
  Eye, Download, AlertCircle, CheckCircle, Loader
} from 'lucide-react';

const SummaryHistoryPage = () => {
  const navigate = useNavigate();
  const { alertState, showAlert, closeAlert } = useAlert();
  const [ConfirmDialog, confirm] = useConfirm();

  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSummary, setExpandedSummary] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSummaries();
    fetchStats();
  }, [page, statusFilter]);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const response = await aiAPI.getSummaryHistory({
        page,
        limit: 10,
        status: statusFilter
      });

      setSummaries(response.data.data.summaries);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      showAlert('Error', 'Failed to load summary history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await aiAPI.getSummaryStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Summary',
      message: 'Are you sure you want to delete this summary? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!isConfirmed) {
      return;
    }

    try {
      setDeletingId(id);
      await aiAPI.deleteSummary(id);
      
      // Remove from local state
      setSummaries(summaries.filter(s => s.id !== id));
      showAlert('Success', 'Summary deleted successfully', 'success');
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error deleting summary:', error);
      showAlert('Error', 'Failed to delete summary', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedSummary(expandedSummary === id ? null : id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        icon: CheckCircle,
        label: 'Completed'
      },
      failed: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        icon: AlertCircle,
        label: 'Failed'
      },
      processing: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: Loader,
        label: 'Processing'
      }
    };

    const config = statusConfig[status] || statusConfig.completed;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const filteredSummaries = summaries.filter(summary => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      summary.original_filename?.toLowerCase().includes(query) ||
      summary.resource_title?.toLowerCase().includes(query) ||
      summary.unit_code?.toLowerCase().includes(query) ||
      summary.unit_title?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-purple-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">AI Summary History</h1>
              <p className="text-purple-100 mt-1">Review your AI-generated document summaries</p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm text-purple-100">Total Summaries</span>
                </div>
                <p className="text-2xl font-bold">{stats.total_summaries}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm text-purple-100">Completed</span>
                </div>
                <p className="text-2xl font-bold">{stats.completed_summaries}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm text-purple-100">Tokens Used</span>
                </div>
                <p className="text-2xl font-bold">{Math.floor(stats.total_tokens_used).toLocaleString()}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm text-purple-100">Avg Time</span>
                </div>
                <p className="text-2xl font-bold">{(stats.avg_processing_time_ms / 1000).toFixed(1)}s</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, course, or filename..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>

        {/* Summaries List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading summaries...</p>
            </div>
          </div>
        ) : filteredSummaries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No summaries found' : 'No summaries yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery 
                ? 'Try adjusting your search query or filters.'
                : 'Start generating summaries by clicking the "Summarize" button when viewing resources.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSummaries.map((summary) => (
              <div
                key={summary.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Summary Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {summary.resource_title || summary.original_filename}
                        </h3>
                        {getStatusBadge(summary.status)}
                      </div>
                      {summary.unit_code && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {summary.unit_code} - {summary.unit_title}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(summary.id)}
                      disabled={deletingId === summary.id}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete summary"
                    >
                      {deletingId === summary.id ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(summary.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {summary.original_file_type}
                    </span>
                    {summary.processing_time_ms && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {(summary.processing_time_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                    {summary.tokens_used && (
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {summary.tokens_used} tokens
                      </span>
                    )}
                  </div>

                  {/* Summary Preview */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700/50 rounded-lg p-6 shadow-inner">
                    {summary.status === 'completed' ? (
                      <>
                        <div className={`${expandedSummary === summary.id ? '' : 'line-clamp-6'}`}>
                          <MarkdownRenderer 
                            content={summary.summary_text}
                            className="text-sm"
                          />
                        </div>
                        <button
                          onClick={() => toggleExpanded(summary.id)}
                          className="mt-4 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          {expandedSummary === summary.id ? 'Show less' : 'Read full summary'}
                        </button>
                      </>
                    ) : summary.status === 'failed' ? (
                      <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Failed to generate summary</p>
                          {summary.error_message && (
                            <p className="text-sm mt-1 text-red-500 dark:text-red-300">
                              {summary.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <Loader className="w-5 h-5 animate-spin" />
                        <p>Processing summary...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      page === pageNum
                        ? 'bg-purple-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryHistoryPage;
