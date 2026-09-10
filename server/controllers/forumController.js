import { query } from '../config/database.js';
import cloudinary from '../config/cloudinary.js';
import { emitToForum, emitToUser } from '../config/socket.js';

// Get all posts with user info (filtered by program)
export const getAllPosts = async (req, res) => {
  try {
    // Get user's program from their profile
    const userProgram = await query(
      'SELECT program_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userProgram.rows[0] || !userProgram.rows[0].program_id) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile with program information'
      });
    }

    const programId = userProgram.rows[0].program_id;

    const result = await query(
      `SELECT 
        fp.id,
        fp.title,
        fp.content,
        fp.image_url,
        fp.likes_count,
        fp.comments_count,
        fp.post_type,
        fp.created_at,
        fp.updated_at,
        u.first_name || ' ' || u.last_name AS user_name,
        u.id AS user_id,
        u.profile_picture_url
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE u.program_id = $1
      ORDER BY fp.created_at DESC`,
      [programId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
};

// Get single post with comments (nested)
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get post details
    const postResult = await query(
      `SELECT 
        fp.id,
        fp.title,
        fp.content,
        fp.image_url,
        fp.likes_count,
        fp.comments_count,
        fp.post_type,
        fp.created_at,
        fp.updated_at,
        u.first_name || ' ' || u.last_name AS user_name,
        u.id AS user_id,
        u.profile_picture_url
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.id = $1`,
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get all comments for this post
    const commentsResult = await query(
      `SELECT 
        fc.id,
        fc.post_id,
        fc.parent_comment_id,
        fc.content,
        fc.created_at,
        u.first_name || ' ' || u.last_name AS user_name,
        u.id AS user_id,
        u.profile_picture_url
      FROM forum_comments fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.post_id = $1
      ORDER BY fc.created_at ASC`,
      [id]
    );

    // Build nested comment structure
    const commentsMap = new Map();
    const rootComments = [];

    // First pass: create comment objects with replies array
    commentsResult.rows.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    commentsResult.rows.forEach(comment => {
      const commentObj = commentsMap.get(comment.id);
      if (comment.parent_comment_id) {
        const parent = commentsMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    const post = {
      ...postResult.rows[0],
      comments: rootComments
    };

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post'
    });
  }
};

// Create new post
export const createPost = async (req, res) => {
  try {
    const { title, content, postType } = req.body;
    const userId = req.user.id;
    let imageUrl = null;

    // Validate post type
    const validPostTypes = ['discussion', 'quiz', 'group_study'];
    if (!postType || !validPostTypes.includes(postType)) {
      throw new AppError('Invalid post type. Must be: discussion, quiz, or group_study', 400);
    }

    // Handle image upload
    if (req.file) {
      // When using CloudinaryStorage, the file is already uploaded
      // req.file.path contains the Cloudinary URL
      imageUrl = req.file.path; // Cloudinary URL
    }

    const result = await query(
      `INSERT INTO forum_posts (user_id, title, content, image_url, post_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, content, image_url, post_type, likes_count, comments_count, created_at`,
      [userId, title, content, imageUrl, postType]
    );

    // Fetch user info for socket event
    const userInfo = await query(
      'SELECT first_name, last_name, profile_picture_url FROM users WHERE id = $1',
      [userId]
    );

    const newPost = {
      ...result.rows[0],
      user_id: userId,
      user_name: `${userInfo.rows[0].first_name} ${userInfo.rows[0].last_name}`,
      profile_picture_url: userInfo.rows[0].profile_picture_url
    };

    // Emit socket event for real-time update
    try {
      emitToForum('forum:post:created', newPost);
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
};

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { content, parent_comment_id } = req.body;
    const userId = req.user.id;

    // Verify post exists
    const postCheck = await query('SELECT id FROM forum_posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // If replying to a comment, verify it exists and belongs to this post
    if (parent_comment_id) {
      const commentCheck = await query(
        'SELECT id FROM forum_comments WHERE id = $1 AND post_id = $2',
        [parent_comment_id, postId]
      );
      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    const result = await query(
      `INSERT INTO forum_comments (post_id, user_id, parent_comment_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, post_id, parent_comment_id, content, created_at`,
      [postId, userId, parent_comment_id || null, content]
    );

    // Fetch user info for socket event
    const userInfo = await query(
      'SELECT first_name, last_name, profile_picture_url FROM users WHERE id = $1',
      [userId]
    );

    const newComment = {
      ...result.rows[0],
      user_id: userId,
      user_name: `${userInfo.rows[0].first_name} ${userInfo.rows[0].last_name}`,
      profile_picture_url: userInfo.rows[0].profile_picture_url
    };

    // Emit socket event for real-time update
    try {
      emitToForum('forum:comment:added', {
        postId: parseInt(postId),
        comment: newComment
      });
      
      // Also notify the post author if comment is from someone else
      const postAuthor = await query('SELECT user_id FROM forum_posts WHERE id = $1', [postId]);
      if (postAuthor.rows[0] && postAuthor.rows[0].user_id !== userId) {
        emitToUser(postAuthor.rows[0].user_id, 'notification:new', {
          type: 'forum_comment',
          message: `${newComment.user_name} commented on your post`,
          postId: postId,
          commentId: newComment.id
        });
      }
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// Like/Unlike post
export const toggleLikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    // Verify post exists and get author info
    const postCheck = await query(
      'SELECT id, user_id, likes_count FROM forum_posts WHERE id = $1',
      [postId]
    );
    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const post = postCheck.rows[0];

    // Check if already liked
    const likeCheck = await query(
      'SELECT id FROM forum_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    let liked = false;
    let newLikesCount = post.likes_count;

    if (likeCheck.rows.length > 0) {
      // Unlike
      await query(
        'DELETE FROM forum_post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      newLikesCount = Math.max(0, newLikesCount - 1);
      liked = false;
    } else {
      // Like
      await query(
        'INSERT INTO forum_post_likes (post_id, user_id) VALUES ($1, $2)',
        [postId, userId]
      );
      newLikesCount = newLikesCount + 1;
      liked = true;

      // Notify post author if like is from someone else
      if (post.user_id !== userId) {
        const liker = await query(
          'SELECT first_name, last_name FROM users WHERE id = $1',
          [userId]
        );
        try {
          emitToUser(post.user_id, 'notification:new', {
            type: 'forum_like',
            message: `${liker.rows[0].first_name} ${liker.rows[0].last_name} liked your post`,
            postId: postId
          });
        } catch (socketError) {
          console.error('Socket emit error:', socketError);
        }
      }
    }

    // Emit socket event for real-time like count update
    try {
      emitToForum('forum:post:liked', {
        postId: parseInt(postId),
        userId: userId,
        liked: liked,
        likesCount: newLikesCount
      });
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
    }

    res.json({
      success: true,
      message: liked ? 'Post liked' : 'Post unliked',
      liked: liked,
      likesCount: newLikesCount
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
};

// Delete post (only by owner or admin)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get post details
    const postResult = await query(
      'SELECT user_id, image_url FROM forum_posts WHERE id = $1',
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const post = postResult.rows[0];

    // Check ownership
    if (post.user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete image from cloudinary if exists
    if (post.image_url) {
      try {
        const publicId = post.image_url.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting image from cloudinary:', error);
      }
    }

    // Delete post (cascade will handle comments and likes)
    await query('DELETE FROM forum_posts WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};

// Delete comment (only by owner or admin)
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get comment details
    const commentResult = await query(
      'SELECT user_id FROM forum_comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const comment = commentResult.rows[0];

    // Check ownership
    if (comment.user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Delete comment (cascade will handle replies)
    await query('DELETE FROM forum_comments WHERE id = $1', [commentId]);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
};
