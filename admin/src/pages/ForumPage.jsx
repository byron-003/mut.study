import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAlert, useConfirm } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';
import CustomConfirm from '../components/CustomConfirm';
import {
  MessageSquare, MessagesSquare, Trash2, Search, ThumbsUp, MessageCircle,
  Image as ImageIcon, ChevronLeft, ChevronRight, Loader, ShieldAlert
} from 'lucide-react';

const POST_TYPE_LABELS = {
  discussion: { label: 'Discussion', styles: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  quiz: { label: 'Quiz', styles: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  group_study: { label: 'Group Study', styles: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
};

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString();
};

const LimitText = ({ text, lines = 2 }) => (
  <p
    className="text-sm text-gray-700 dark:text-gray-300 break-words"
    style={{ display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
  >
    {text}
  </p>
);

const ForumPage = () => {
  const { alertState, showAlert, closeAlert } = useAlert();
  const { confirmState, showConfirm } = useConfirm();

  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [postPagination, setPostPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [commentPagination, setCommentPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchPosts = async (p = page) => {
    try {
      setLoading(true);
      const params = { page: p, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.post_type = typeFilter;
      const response = await adminAPI.getForumPosts(params);
      setPosts(response.data.data.posts || []);
      setPostPagination(response.data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      showAlert('Error', 'Failed to load forum posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (p = page) => {
    try {
      setLoading(true);
      const params = { page: p, limit: 10 };
      if (search.trim()) params.search = search.trim();
      const response = await adminAPI.getForumComments(params);
      setComments(response.data.data.comments || []);
      setCommentPagination(response.data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Error fetching forum comments:', error);
      showAlert('Error', 'Failed to load forum comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    if (tab === 'posts') fetchPosts(1);
    else fetchComments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, typeFilter]);

  useEffect(() => {
    if (tab === 'posts') fetchPosts(page);
    else fetchComments(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    if (tab === 'posts') fetchPosts(1);
    else fetchComments(1);
  };

  const handleDeletePost = (post) => {
    showConfirm({
      title: 'Delete Post',
      message: `Delete the post "${post.title}" by ${post.first_name || ''} ${post.last_name || ''}? All its comments and likes will also be removed. This cannot be undone.`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteForumPost(post.id);
          showAlert('Success', 'Post deleted', 'success');
          fetchPosts();
        } catch (error) {
          console.error('Error deleting post:', error);
          showAlert('Error', error.response?.data?.message || 'Failed to delete post', 'error');
        }
      },
    });
  };

  const handleDeleteComment = (comment) => {
    showConfirm({
      title: 'Delete Comment',
      message: `Delete this comment by ${comment.first_name || ''} ${comment.last_name || ''}? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteForumComment(comment.id);
          showAlert('Success', 'Comment deleted', 'success');
          fetchComments();
        } catch (error) {
          console.error('Error deleting comment:', error);
          showAlert('Error', error.response?.data?.message || 'Failed to delete comment', 'error');
        }
      },
    });
  };

  const pagination = tab === 'posts' ? postPagination : commentPagination;

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forum Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Review posts and comments from students across all programs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            <MessagesSquare className="w-4 h-4" />
            {postPagination.total} posts
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            <MessageCircle className="w-4 h-4" />
            {commentPagination.total} comments
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'posts'
              ? 'border-admin-primary text-admin-primary'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setTab('comments')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'comments'
              ? 'border-admin-primary text-admin-primary'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Comments
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'posts' ? 'Search by title, content or author...' : 'Search by comment, post title or author...'}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-admin-primary focus:border-transparent"
            />
          </div>
        </form>
        {tab === 'posts' && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All types</option>
            <option value="discussion">Discussion</option>
            <option value="quiz">Quiz</option>
            <option value="group_study">Group Study</option>
          </select>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader className="w-10 h-10 animate-spin text-admin-primary" />
        </div>
      ) : tab === 'posts' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {posts.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No forum posts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Post</th>
                    <th className="px-4 py-3 font-medium">Author</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Stats</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {posts.map((post) => {
                    const type = POST_TYPE_LABELS[post.post_type] || { label: post.post_type, styles: 'bg-gray-100 text-gray-700' };
                    return (
                      <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 max-w-[320px]">
                          <div className="flex items-start gap-3">
                            {post.image_url ? (
                              <img
                                src={post.image_url}
                                alt={post.title}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">{post.title}</p>
                              <LimitText text={post.content} lines={2} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {post.first_name} {post.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{post.email}</p>
                          {post.program_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{post.program_name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.styles}`}>{type.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" />{post.likes_count}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{post.comments_count}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(post.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeletePost(post)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {comments.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No forum comments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Comment</th>
                    <th className="px-4 py-3 font-medium">Author</th>
                    <th className="px-4 py-3 font-medium">On post</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 max-w-[360px]">
                        <LimitText text={comment.content} lines={2} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.first_name} {comment.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{comment.email}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{comment.post_title}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(comment.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteComment(comment)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-md px-4 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 px-1 pb-1">
        <ShieldAlert className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Deleting a post permanently removes it and its comments/likes from the forum for all users.
        </p>
      </div>
    </div>
  );
};

export default ForumPage;