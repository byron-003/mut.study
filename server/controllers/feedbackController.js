import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitToRole } from '../config/socket.js';

const FEEDBACK_CATEGORIES = ['general', 'bug', 'feature-request', 'content', 'other'];
const FEEDBACK_STATUSES = ['new', 'reviewed', 'resolved'];

/**
 * Submit (or update) the current user's platform feedback and rating.
 * One feedback row per user; re-submitting updates the existing entry.
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { rating, feedback, category } = req.body;

    const parsedRating = parseInt(rating, 10);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new AppError('Rating must be a number between 1 and 5', 400);
    }

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length < 10) {
      throw new AppError('Please provide feedback of at least 10 characters', 400);
    }
    if (feedback.trim().length > 2000) {
      throw new AppError('Feedback must be 2000 characters or fewer', 400);
    }

    const finalCategory = category && FEEDBACK_CATEGORIES.includes(category) ? category : 'general';

    const result = await query(
      `INSERT INTO platform_feedback (user_id, rating, feedback, category, status)
       VALUES ($1, $2, $3, $4, 'new')
       ON CONFLICT (user_id)
       DO UPDATE SET
         rating = EXCLUDED.rating,
         feedback = EXCLUDED.feedback,
         category = EXCLUDED.category,
         status = 'new',
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, rating, feedback, category, status, created_at, updated_at`,
      [req.user.id, parsedRating, feedback.trim(), finalCategory]
    );

    const row = result.rows[0];
    const isUpdate = row.created_at.getTime() !== row.updated_at.getTime();

    try {
      emitToRole('admin', 'admin:feedback', {
        id: row.id,
        rating: row.rating,
        status: row.status,
        isUpdate,
      });
      emitToRole('admin', 'admin:badges', { source: 'feedback' });
    } catch (socketError) {
      console.error('Socket emit error (feedback):', socketError);
    }

    res.status(201).json({
      status: 'success',
      message: isUpdate ? 'Feedback updated successfully' : 'Feedback submitted successfully. Thank you!',
      data: row,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the current user's existing feedback (if any) for pre-filling the form
 */
export const getMyFeedback = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, rating, feedback, category, status, created_at, updated_at
       FROM platform_feedback
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: result.rows[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: list all feedback with aggregate stats.
 * Supports ?status= filter and ?search= by user name/email or feedback text.
 */
export const getFeedbackList = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const conditions = [];
    const params = [];
    if (status && FEEDBACK_STATUSES.includes(status)) {
      params.push(status);
      conditions.push(`pf.status = $${params.length}`);
    }
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(pf.feedback ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listResult = await query(
      `SELECT
         pf.id, pf.rating, pf.feedback, pf.category, pf.status, pf.created_at, pf.updated_at,
         u.id as user_id, u.first_name, u.last_name, u.email
       FROM platform_feedback pf
       JOIN users u ON pf.user_id = u.id
       ${whereClause}
       ORDER BY pf.created_at DESC
       LIMIT 200`,
      params
    );

    const statsResult = await query(
      `SELECT
         COUNT(*) as total,
         COALESCE(AVG(rating), 0) as avg_rating,
         COUNT(*) FILTER (WHERE status = 'new') as new_count
       FROM platform_feedback`
    );
    const total = parseInt(statsResult.rows[0].total);
    const avgRating = total > 0 ? Math.round(parseFloat(statsResult.rows[0].avg_rating) * 100) / 100 : 0;
    const newCount = parseInt(statsResult.rows[0].new_count);

    const distributionResult = await query(
      'SELECT rating, COUNT(*) as count FROM platform_feedback GROUP BY rating'
    );
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distributionResult.rows.forEach((row) => {
      distribution[row.rating] = parseInt(row.count);
    });

    res.json({
      status: 'success',
      data: {
        feedback: listResult.rows.map((row) => ({
          id: row.id,
          rating: row.rating,
          feedback: row.feedback,
          category: row.category,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          user: {
            id: row.user_id,
            name: `${row.first_name} ${row.last_name}`.trim(),
            email: row.email,
          },
        })),
        stats: {
          total,
          avgRating,
          newCount,
          distribution,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: update feedback status (new / reviewed / resolved)
 */
export const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !FEEDBACK_STATUSES.includes(status)) {
      throw new AppError('Status must be one of: new, reviewed, resolved', 400);
    }

    const result = await query(
      `UPDATE platform_feedback
       SET status = $1
       WHERE id = $2
       RETURNING id, rating, status`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Feedback not found', 404);
    }

    try {
      emitToRole('admin', 'admin:badges', { source: 'feedback-status' });
    } catch (socketError) {
      console.error('Socket emit error (feedback status):', socketError);
    }

    res.json({
      status: 'success',
      message: 'Feedback status updated',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: delete feedback
 */
export const deleteFeedback = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM platform_feedback WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError('Feedback not found', 404);
    }

    try {
      emitToRole('admin', 'admin:badges', { source: 'feedback-delete' });
    } catch (socketError) {
      console.error('Socket emit error (feedback delete):', socketError);
    }

    res.json({
      status: 'success',
      message: 'Feedback deleted',
    });
  } catch (error) {
    next(error);
  }
};
