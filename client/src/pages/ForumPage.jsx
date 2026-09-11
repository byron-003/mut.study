import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/authContext';
import { useSocketEvent, useSocket } from '../context/SocketContext';
import { MessageSquare, Plus, Image, ThumbsUp, MessageCircle, X, Upload, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ForumPage = () => {
  const { user } = useAuth();
  const { joinRoom, leaveRoom, isConnected } = useSocket();
  const { alertState, showAlert, closeAlert } = useAlert();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', content: '', image: null, postType: 'discussion' });
  const [imagePreview, setImagePreview] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  // Join forum room for real-time updates
  useEffect(() => {
    if (isConnected) {
      joinRoom('forum');
      console.log('📡 Joined forum room for real-time updates');
      
      return () => {
        leaveRoom('forum');
        console.log('📡 Left forum room');
      };
    }
  }, [isConnected, joinRoom, leaveRoom]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/forum/posts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPosts(response.data.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostWithComments = async (postId) => {
    try {
      const response = await axios.get(`${API_URL}/forum/posts/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedPost(response.data.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  // Real-time: Handle new post created
  useSocketEvent('forum:post:created', useCallback((newPostData) => {
    console.log('📥 Real-time: New post created', newPostData);
    setPosts(prev => [newPostData, ...prev]);
  }, []), []);

  // Real-time: Handle new comment added
  useSocketEvent('forum:comment:added', useCallback((data) => {
    console.log('💬 Real-time: New comment added', data);
    
    // Update post comment count in list
    setPosts(prev => prev.map(post => 
      post.id === data.postId
        ? { ...post, comments_count: (post.comments_count || 0) + 1 }
        : post
    ));
    
    // If viewing this post, refresh it
    if (selectedPost && selectedPost.id === data.postId) {
      fetchPostWithComments(data.postId);
    }
  }, [selectedPost]), [selectedPost]);

  // Real-time: Handle post liked
  useSocketEvent('forum:post:liked', useCallback((data) => {
    console.log('❤️ Real-time: Post liked', data);
    
    // Update like count in posts list
    setPosts(prev => prev.map(post =>
      post.id === data.postId
        ? { ...post, likes_count: data.likesCount }
        : post
    ));
    
    // Update in selected post if viewing
    if (selectedPost && selectedPost.id === data.postId) {
      setSelectedPost(prev => ({
        ...prev,
        likes_count: data.likesCount
      }));
    }
  }, [selectedPost]), [selectedPost]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Warning', 'Image size should be less than 5MB', 'warning');
        return;
      }
      setNewPost({ ...newPost, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', newPost.title);
    formData.append('content', newPost.content);
    formData.append('postType', newPost.postType);
    if (newPost.image) {
      formData.append('image', newPost.image);
    }

    try {
      setUploadProgress(0);
      await axios.post(`${API_URL}/forum/posts`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setShowCreateModal(false);
      setNewPost({ title: '', content: '', image: null, postType: 'discussion' });
      setImagePreview(null);
      setUploadProgress(0);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      showAlert('Error', 'Failed to create post. Please try again.', 'error');
    }
  };

  const handleAddComment = async (postId, parentCommentId = null) => {
    if (!newComment.trim()) return;

    try {
      await axios.post(
        `${API_URL}/forum/posts/${postId}/comments`,
        {
          content: newComment,
          parent_comment_id: parentCommentId
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setNewComment('');
      setReplyingTo(null);
      if (selectedPost) {
        fetchPostWithComments(postId);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showAlert('Error', 'Failed to add comment. Please try again.', 'error');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await axios.post(
        `${API_URL}/forum/posts/${postId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const renderComments = (comments, level = 0) => {
    if (!comments || comments.length === 0) return null;

    return (
      <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} space-y-4`}>
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {comment.profile_picture_url ? (
                <img
                  src={comment.profile_picture_url}
                  alt={comment.user_name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {comment.user_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">{comment.user_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-2">{comment.content}</p>
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Reply
                </button>

                {replyingTo === comment.id && (
                  <div className="mt-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="2"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAddComment(selectedPost.id, comment.id)}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setNewComment('');
                        }}
                        className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3">
                    {renderComments(comment.replies, level + 1)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getPostTypeLabel = (type) => {
    const labels = {
      'discussion': { text: 'Discussion', color: 'bg-blue-100 text-blue-800' },
      'quiz': { text: 'Quiz', color: 'bg-purple-100 text-purple-800' },
      'group_study': { text: 'Group Study', color: 'bg-green-100 text-green-800' }
    };
    return labels[type] || labels['discussion'];
  };

  const filteredPosts = filterType === 'all' 
    ? posts 
    : posts.filter(post => post.post_type === filterType);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Discussion Forum</h1>
                <p className="text-sm text-gray-600">Connect with classmates in your program</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              New Post
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setFilterType('discussion')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filterType === 'discussion'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 Discussions
            </button>
            <button
              onClick={() => setFilterType('quiz')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filterType === 'quiz'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Quizzes
            </button>
            <button
              onClick={() => setFilterType('group_study')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filterType === 'group_study'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 Group Study
            </button>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">Be the first to start a discussion!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const typeLabel = getPostTypeLabel(post.post_type);
              return (
                <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {post.profile_picture_url ? (
                        <img
                          src={post.profile_picture_url}
                          alt={post.user_name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {post.user_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{post.user_name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeLabel.color}`}>
                            {typeLabel.text}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                        <p className="text-gray-700 mb-4">{post.content}</p>

                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="Post"
                            className="rounded-lg max-h-96 object-cover mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(post.image_url, '_blank')}
                          />
                        )}

                        <div className="flex items-center gap-6 text-sm">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{post.likes_count || 0} Likes</span>
                          </button>
                          <button
                            onClick={() => fetchPostWithComments(post.id)}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments_count || 0} Comments</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPost({ title: '', content: '', image: null, postType: 'discussion' });
                    setImagePreview(null);
                    setUploadProgress(0);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Type *
                  </label>
                  <select
                    value={newPost.postType}
                    onChange={(e) => setNewPost({ ...newPost, postType: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="discussion">📝 Discussion - General topic discussion</option>
                    <option value="quiz">📋 Quiz - Share practice questions</option>
                    <option value="group_study">👥 Group Study - Form study groups</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    required
                    maxLength={200}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What's your topic?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    required
                    rows="6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Share your thoughts..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full rounded-lg max-h-64 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewPost({ ...newPost, image: null });
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 mb-1">Click to upload image</span>
                        <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploadProgress > 0 && uploadProgress < 100}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadProgress > 0 && uploadProgress < 100 ? 'Posting...' : 'Post'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewPost({ title: '', content: '', image: null, postType: 'discussion' });
                      setImagePreview(null);
                      setUploadProgress(0);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Detail Modal with Comments */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Post Details</h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Post Content */}
              <div className="mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedPost.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{selectedPost.user_name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(selectedPost.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{selectedPost.title}</h3>
                <p className="text-gray-700 mb-4">{selectedPost.content}</p>
                {selectedPost.image_url && (
                  <img
                    src={selectedPost.image_url}
                    alt="Post"
                    className="rounded-lg max-h-96 object-cover mb-4"
                  />
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-bold text-lg text-gray-900 mb-4">
                  Comments ({selectedPost.comments?.length || 0})
                </h4>

                {/* Add Comment */}
                <div className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="3"
                  />
                  <button
                    onClick={() => handleAddComment(selectedPost.id)}
                    disabled={!newComment.trim()}
                    className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Comment
                  </button>
                </div>

                {/* Comments List */}
                {selectedPost.comments && selectedPost.comments.length > 0 ? (
                  renderComments(selectedPost.comments)
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CustomAlert {...alertState} onClose={closeAlert} />
    </div>
  );
};

export default ForumPage;
