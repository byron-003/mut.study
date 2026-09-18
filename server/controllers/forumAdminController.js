import { query } from '../config/database.js';
import cloudinary from '../config/cloudinary.js';
import { AppError } from '../middleware/errorHandler.js';

const toPositiveInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

const parseId = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new AppError('Invalid ID', 400);
  }
  return n;
};

/**
 * GET /api/admin/forum/posts?search=&post_type=&page=&limit=
 * Admin: site-wide list of all forum posts (all programs) with author info and pagination.
 */
export const getForumPosts = async (req, res, next) => {
  try {
    const { search, post_type: postType } = req.query;
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 10), 50);

    const conditions = [];
    const params = [];
    if (postType && ['discussion', 'quiz', 'group_study'].includes(postType)) {
      params.push(postType);
      conditions.push(`fp.post_type = $${params.length}`);
    }
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(fp.title ILIKE $${params.length} OR fp.content ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    const offset = (page - 1) * limit;
    const listResult = await query(
      `SELECT
         fp.id, fp.title, fp.content, fp.image_url, fp.likes_count, fp.comments_count,
         fp.post_type, fp.created_at,
         u.id AS user_id, u.first_name, u.last_name, u.email, u.program_id,
         pr.name AS program_name
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       LEFT JOIN programs pr ON u.program_id = pr.id
       ${whereClause}
       ORDER BY fp.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      status: 'success',
      data: {
        posts: listResult.rows,
        pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/forum/comments?search=&post_id=&page=&limit=
 * Admin: site-wide list of all comments with the post title and author info.
 */
export const getForumComments = async (req, res, next) => {
  try {
    const { search, post_id: postId } = req.query;
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 10), 50);

    const conditions = [];
    const params = [];
    if (postId) {
      params.push(toPositiveInt(postId, 0));
      conditions.push(`fc.post_id = $${params.length}`);
    }
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(fc.content ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM forum_comments fc
       JOIN forum_posts fp ON fc.post_id = fp.id
       JOIN users u ON fc.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    const offset = (page - 1) * limit;
    const listResult = await query(
      `SELECT
         fc.id, fc.post_id, fc.parent_comment_id, fc.content, fc.created_at,
         fp.title AS post_title, fp.post_type AS post_type,
         u.id AS user_id, u.first_name, u.last_name, u.email
       FROM forum_comments fc
       JOIN forum_posts fp ON fc.post_id = fp.id
       JOIN users u ON fc.user_id = u.id
       ${whereClause}
       ORDER BY fc.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      status: 'success',
      data: {
        comments: listResult.rows,
        pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/forum/posts/:id
 * Admin: delete a post (cascades to comments and likes, cleans up the Cloudinary image).
 */
export const deleteForumPost = async (req, res, next) => {
  try {
    const postId = parseId(req.params.id);
    const postResult = await query(
      'SELECT user_id, image_url FROM forum_posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      throw new AppError('Post not found', 404);
    }

    const post = postResult.rows[0];

    if (post.image_url) {
      try {
        const publicId = post.image_url.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting image from cloudinary:', error);
      }
    }

    await query('DELETE FROM forum_posts WHERE id = $1', [postId]);

    res.json({
      status: 'success',
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/forum/comments/:commentId
 * Admin: delete a comment (cascades to its replies).
 */
export const deleteForumComment = async (req, res, next) => {
  try {
    const commentId = parseId(req.params.commentId);
    const commentResult = await query(
      'SELECT user_id FROM forum_comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      throw new AppError('Comment not found', 404);
    }

    await query('DELETE FROM forum_comments WHERE id = $1', [commentId]);

    res.json({
      status: 'success',
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};