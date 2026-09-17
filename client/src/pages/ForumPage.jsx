import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../utils/authContext';
import { useSocketEvent, useSocket } from '../context/SocketContext';
import { MessageSquare, Plus, X, Upload, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Loader2 } from 'lucide-react';
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
  const [likedPosts, setLikedPosts] = useState(() => new Set());
  const [posting, setPosting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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

  // Close the image preview with Escape
  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

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
      setReplyingTo(null);
      setNewComment('');
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
    if (posting) return; // Prevent double submissions
    setPosting(true);
    
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
    } finally {
      setPosting(false);
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

  const toggleLike = async (postId) => {
    // Optimistic local toggle for the filled heart state
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

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

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString();
  };

  const renderComments = (comments, level = 0) => {
    if (!comments || comments.length === 0) return null;

    return (
      <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''} space-y-4`}>
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-3">
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
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">
                <span className="font-semibold mr-2">{comment.user_name}</span>
                {comment.content}
              </p>
              <div className="flex items-center gap-4 mt-0.5">
                <span className="text-xs text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                >
                  Reply
                </button>
              </div>

              {replyingTo === comment.id && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleAddComment(selectedPost.id, comment.id)}
                    className="text-sm font-semibold text-blue-500 hover:text-blue-600"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setNewComment('');
                    }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3">
                  {renderComments(comment.replies, level + 1)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getPostTypeLabel = (type) => {
    const labels = {
      'discussion': { text: 'Discussion', color: 'text-blue-500' },
      'quiz': { text: 'Quiz', color: 'text-purple-500' },
      'group_study': { text: 'Group Study', color: 'text-green-500' }
    };
    return labels[type] || labels['discussion'];
  };

  const filteredPosts = filterType === 'all' 
    ? posts 
    : posts.filter(post => post.post_type === filterType);

  const renderAvatar = (profilePictureUrl, name, sizeClass = 'w-8 h-8', textClass = 'text-sm') => {
    if (profilePictureUrl) {
      return (
        <img
          src={profilePictureUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
        />
      );
    }
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold ${textClass} flex-shrink-0`}>
        {name?.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header - Instagram style top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-[470px] mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">MUT Forum</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            title="Create post"
            className="p-2 text-gray-900 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Filter pills */}
      <div className="max-w-[470px] mx-auto px-4 pt-4 pb-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-1.5 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
            filterType === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('discussion')}
          className={`px-4 py-1.5 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
            filterType === 'discussion'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Discussions
        </button>
        <button
          onClick={() => setFilterType('quiz')}
          className={`px-4 py-1.5 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
            filterType === 'quiz'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Quizzes
        </button>
        <button
          onClick={() => setFilterType('group_study')}
          className={`px-4 py-1.5 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
            filterType === 'group_study'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Group Study
        </button>
      </div>

      {/* Feed */}
      <main className="max-w-[470px] mx-auto px-0 sm:px-0 pb-20 pt-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-blue-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No posts yet</h3>
            <p className="text-gray-500 mb-6">Be the first to share with your classmates!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div>
            {filteredPosts.map((post) => {
              const typeLabel = getPostTypeLabel(post.post_type);
              const isLiked = likedPosts.has(post.id);
              return (
                <article key={post.id} className="bg-white border border-gray-200 mb-5 sm:rounded-lg">
                  {/* Card header */}
                  <div className="flex items-center px-3 sm:px-4 py-3">
                    <div className="mr-3">
                      {renderAvatar(post.profile_picture_url, post.user_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-900 leading-tight">{post.user_name}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span className={typeLabel.color}>{typeLabel.text}</span>
                        <span>·</span>
                        <span>{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchPostWithComments(post.id)}
                      className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Open post"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Media or text body */}
                  {post.image_url ? (
                    <div
                      className="bg-black cursor-pointer"
                      onDoubleClick={() => toggleLike(post.id)}
                      onClick={() => setPreviewImage({ url: post.image_url, userName: post.user_name, title: post.title })}
                    >
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="w-full aspect-square object-cover select-none"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div
                      className="bg-white px-4 py-4 border-y border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                      onDoubleClick={() => toggleLike(post.id)}
                      onClick={() => fetchPostWithComments(post.id)}
                    >
                      <h2 className="font-semibold text-gray-900 mb-1">{post.title}</h2>
                      <p className="text-gray-700 text-sm line-clamp-4">{post.content}</p>
                    </div>
                  )}

                  {/* Action row */}
                  <div className="px-3 sm:px-4 pt-3 flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className="transition-transform active:scale-90"
                      title="Like"
                    >
                      <Heart className={`w-7 h-7 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-900 hover:text-gray-500'}`} />
                    </button>
                    <button
                      onClick={() => fetchPostWithComments(post.id)}
                      className="transition-transform active:scale-90"
                      title="Comment"
                    >
                      <MessageCircle className="w-7 h-7 text-gray-900 hover:text-gray-500" />
                    </button>
                    <button className="transition-transform active:scale-90" title="Share">
                      <Send className="w-7 h-7 text-gray-900 hover:text-gray-500" />
                    </button>
                    <button className="ml-auto" title="Save">
                      <Bookmark className="w-7 h-7 text-gray-900" />
                    </button>
                  </div>

                  {/* Likes */}
                  <div className="px-3 sm:px-4 pt-2">
                    <span className="text-sm font-semibold text-gray-900">{post.likes_count || 0} likes</span>
                  </div>

                  {/* Caption */}
                  <div className="px-3 sm:px-4 py-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold mr-2">{post.user_name}</span>
                      {post.content}
                    </p>
                  </div>

                  {/* View comments */}
                  <div className="px-3 sm:px-4">
                    <button
                      onClick={() => fetchPostWithComments(post.id)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      View all {post.comments_count || 0} comments
                    </button>
                  </div>

                  {/* Comment input */}
                  <div className="px-3 sm:px-4 py-3 border-t border-gray-100 flex items-center gap-2 mt-2">
                    <button
                      onClick={() => fetchPostWithComments(post.id)}
                      className="flex-1 text-left text-sm text-gray-400 hover:text-gray-600"
                    >
                      Add a comment...
                    </button>
                    <button
                      onClick={() => fetchPostWithComments(post.id)}
                      className="text-sm font-semibold text-blue-500 hover:text-blue-600"
                    >
                      Post
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create New Post</h2>
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
                    disabled={posting || (uploadProgress > 0 && uploadProgress < 100)}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {posting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post'
                    )}
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {selectedPost.profile_picture_url ? (
                      <img
                        src={selectedPost.profile_picture_url}
                        alt={selectedPost.user_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedPost.user_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{selectedPost.user_name}</div>
                    <div className="text-xs text-gray-500">
                      {timeAgo(selectedPost.created_at)} · {getPostTypeLabel(selectedPost.post_type).text}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 flex-1">
              {selectedPost.image_url && (
                <img
                  src={selectedPost.image_url}
                  alt="Post"
                  onClick={() => setPreviewImage({ url: selectedPost.image_url, userName: selectedPost.user_name, title: selectedPost.title })}
                  className="w-full rounded-xl max-h-80 object-cover mb-4 cursor-pointer hover:opacity-95 transition-opacity"
                />
              )}

              <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedPost.title}</h3>
              <p className="text-gray-700 mb-4">{selectedPost.content}</p>

              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => toggleLike(selectedPost.id)} className="flex items-center gap-2">
                  <Heart className={`w-6 h-6 ${likedPosts.has(selectedPost.id) ? 'text-red-500 fill-red-500' : 'text-gray-900 hover:text-gray-500'}`} />
                </button>
                <MessageCircle className="w-6 h-6 text-gray-900" />
                <span className="ml-auto text-sm font-semibold text-gray-900">
                  {selectedPost.likes_count || 0} likes
                </span>
              </div>

              {/* Comments */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-sm text-gray-500 mb-4">
                  {selectedPost.comments?.length || 0} comments
                </h4>

                {selectedPost.comments && selectedPost.comments.length > 0 ? (
                  renderComments(selectedPost.comments)
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comment input */}
            <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment(selectedPost.id);
                }}
                placeholder="Add a comment..."
                className="flex-1 py-2 text-sm focus:outline-none text-gray-900"
              />
              <button
                onClick={() => handleAddComment(selectedPost.id)}
                disabled={!newComment.trim()}
                className="text-sm font-semibold text-blue-500 hover:text-blue-600 disabled:text-blue-300 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* In-page image preview card */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black flex items-center justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.title || 'Post image'}
                className="w-full max-h-[75vh] object-contain select-none"
              />
            </div>
            {(previewImage.userName || previewImage.title) && (
              <div className="px-4 py-3 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{previewImage.userName}</span>
                {previewImage.title && <span className="text-sm text-gray-500 truncate">{previewImage.title}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      <CustomAlert {...alertState} onClose={closeAlert} />
    </div>
  );
};

export default ForumPage;