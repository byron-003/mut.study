import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitToUser } from '../config/socket.js';

/**
 * Update or create progress for a resource
 */
export const updateProgress = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const { progressPercentage, lastPosition, timeSpent, currentPage, totalPages } = req.body;
    const userId = req.user.id;

    // Validate progress percentage if provided
    if (progressPercentage !== undefined && (progressPercentage < 0 || progressPercentage > 100)) {
      throw new AppError('Progress percentage must be between 0 and 100', 400);
    }

    // Check if progress record exists
    const existingProgress = await query(
      'SELECT * FROM study_progress WHERE user_id = $1 AND resource_id = $2',
      [userId, resourceId]
    );

    let result;

    if (existingProgress.rows.length > 0) {
      // Update existing progress
      // If pages are provided, use them; otherwise use progressPercentage
      if (currentPage !== undefined && totalPages !== undefined) {
        result = await query(
          `UPDATE study_progress 
           SET current_page = $1,
               total_pages = $2,
               last_position = $3, 
               time_spent = COALESCE(time_spent, 0) + $4,
               last_accessed = CURRENT_TIMESTAMP
           WHERE user_id = $5 AND resource_id = $6
           RETURNING *`,
          [currentPage, totalPages, lastPosition, timeSpent || 0, userId, resourceId]
        );
      } else {
        result = await query(
          `UPDATE study_progress 
           SET progress_percentage = $1, 
               last_position = $2, 
               time_spent = COALESCE(time_spent, 0) + $3,
               last_accessed = CURRENT_TIMESTAMP
           WHERE user_id = $4 AND resource_id = $5
           RETURNING *`,
          [progressPercentage, lastPosition, timeSpent || 0, userId, resourceId]
        );
      }
    } else {
      // Create new progress record
      if (currentPage !== undefined && totalPages !== undefined) {
        result = await query(
          `INSERT INTO study_progress 
           (user_id, resource_id, current_page, total_pages, last_position, time_spent)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [userId, resourceId, currentPage, totalPages, lastPosition, timeSpent || 0]
        );
      } else {
        result = await query(
          `INSERT INTO study_progress 
           (user_id, resource_id, progress_percentage, last_position, time_spent)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [userId, resourceId, progressPercentage, lastPosition, timeSpent || 0]
        );
      }
    }

    // Update study streak
    await query('SELECT update_study_streak($1)', [userId]);

    // Emit real-time progress update
    try {
      emitToUser(userId, 'progress:updated', {
        resourceId: parseInt(resourceId),
        progress: result.rows[0].progress_percentage,
        currentPage: result.rows[0].current_page,
        totalPages: result.rows[0].total_pages,
        completed: result.rows[0].completed
      });
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        id: result.rows[0].id,
        resourceId: result.rows[0].resource_id,
        progress: result.rows[0].progress_percentage,
        currentPage: result.rows[0].current_page,
        totalPages: result.rows[0].total_pages,
        lastPosition: result.rows[0].last_position,
        timeSpent: result.rows[0].time_spent,
        completed: result.rows[0].completed,
        lastAccessed: result.rows[0].last_accessed
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get progress for a specific resource
 */
export const getProgress = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT sp.*, 
              sm.title as resource_title,
              sm.file_type as resource_type
       FROM study_progress sp
       JOIN study_materials sm ON sp.resource_id = sm.id
       WHERE sp.user_id = $1 AND sp.resource_id = $2`,
      [userId, resourceId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No progress found for this resource'
      });
    }

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        resourceId: result.rows[0].resource_id,
        resourceTitle: result.rows[0].resource_title,
        resourceType: result.rows[0].resource_type,
        progress: result.rows[0].progress_percentage,
        currentPage: result.rows[0].current_page,
        totalPages: result.rows[0].total_pages,
        lastPosition: result.rows[0].last_position,
        timeSpent: result.rows[0].time_spent,
        completed: result.rows[0].completed,
        lastAccessed: result.rows[0].last_accessed,
        startedAt: result.rows[0].started_at,
        completedAt: result.rows[0].completed_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all progress (study history) for a user
 */
export const getStudyHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, completed } = req.query;

    let queryText = `
      SELECT sp.*,
             sm.title,
             sm.description,
             sm.category,
             sm.file_url,
             sm.file_type,
             c.unit_code,
             c.unit_title
      FROM study_progress sp
      JOIN study_materials sm ON sp.resource_id = sm.id
      LEFT JOIN courses c ON sm.course_id = c.id
      WHERE sp.user_id = $1
    `;

    const params = [userId];

    // Filter by completion status if specified
    if (completed !== undefined) {
      queryText += ` AND sp.completed = $${params.length + 1}`;
      params.push(completed === 'true');
    }

    queryText += ` ORDER BY sp.last_accessed DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    // Get total count
    const countQuery = await query(
      `SELECT COUNT(*) as total FROM study_progress WHERE user_id = $1${completed !== undefined ? ' AND completed = $2' : ''}`,
      completed !== undefined ? [userId, completed === 'true'] : [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        resource: {
          id: row.resource_id,
          title: row.title,
          description: row.description,
          category: row.category,
          fileUrl: row.file_url,
          fileType: row.file_type,
          course: {
            code: row.unit_code,
            title: row.unit_title
          }
        },
        progress: row.progress_percentage,
        lastPosition: row.last_position,
        timeSpent: row.time_spent,
        completed: row.completed,
        lastAccessed: row.last_accessed,
        startedAt: row.started_at,
        completedAt: row.completed_at
      })),
      pagination: {
        total: parseInt(countQuery.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < parseInt(countQuery.rows[0].total)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get study statistics for a user
 */
export const getStudyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get overall stats
    const statsResult = await query(
      `SELECT 
         COUNT(*) as total_resources,
         COUNT(*) FILTER (WHERE completed = true) as completed_resources,
         SUM(time_spent) as total_time_spent,
         AVG(progress_percentage) as average_progress
       FROM study_progress
       WHERE user_id = $1`,
      [userId]
    );

    // Get streak data
    const streakResult = await query(
      'SELECT * FROM study_streaks WHERE user_id = $1',
      [userId]
    );

    // Get recent activity (last 7 days)
    const activityResult = await query(
      `SELECT 
         DATE(last_accessed) as date,
         COUNT(*) as resources_studied,
         SUM(time_spent) as time_spent
       FROM study_progress
       WHERE user_id = $1 
         AND last_accessed >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(last_accessed)
       ORDER BY date DESC`,
      [userId]
    );

    // Get most studied resources
    const topResourcesResult = await query(
      `SELECT 
         sm.id,
         sm.title,
         sm.category,
         sp.time_spent,
         sp.progress_percentage,
         sp.completed
       FROM study_progress sp
       JOIN study_materials sm ON sp.resource_id = sm.id
       WHERE sp.user_id = $1
       ORDER BY sp.time_spent DESC
       LIMIT 5`,
      [userId]
    );

    const stats = statsResult.rows[0];
    const streak = streakResult.rows[0] || { current_streak: 0, longest_streak: 0 };

    res.json({
      success: true,
      data: {
        overview: {
          totalResources: parseInt(stats.total_resources) || 0,
          completedResources: parseInt(stats.completed_resources) || 0,
          completionRate: stats.total_resources > 0 
            ? Math.round((stats.completed_resources / stats.total_resources) * 100) 
            : 0,
          totalTimeSpent: parseInt(stats.total_time_spent) || 0,
          averageProgress: Math.round(parseFloat(stats.average_progress) || 0)
        },
        streak: {
          current: streak.current_streak,
          longest: streak.longest_streak,
          lastStudyDate: streak.last_study_date
        },
        recentActivity: activityResult.rows.map(row => ({
          date: row.date,
          resourcesStudied: parseInt(row.resources_studied),
          timeSpent: parseInt(row.time_spent)
        })),
        topResources: topResourcesResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          category: row.category,
          timeSpent: row.time_spent,
          progress: row.progress_percentage,
          completed: row.completed
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark resource as completed
 */
export const markAsCompleted = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE study_progress 
       SET completed = true, 
           progress_percentage = 100,
           completed_at = CURRENT_TIMESTAMP,
           last_accessed = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND resource_id = $2
       RETURNING *`,
      [userId, resourceId]
    );

    if (result.rows.length === 0) {
      // Create new completed record if doesn't exist
      const newResult = await query(
        `INSERT INTO study_progress 
         (user_id, resource_id, progress_percentage, completed, completed_at)
         VALUES ($1, $2, 100, true, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, resourceId]
      );

      return res.json({
        success: true,
        message: 'Resource marked as completed',
        data: newResult.rows[0]
      });
    }

    // Emit completion event
    try {
      emitToUser(userId, 'progress:completed', {
        resourceId: parseInt(resourceId)
      });
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
    }

    res.json({
      success: true,
      message: 'Resource marked as completed',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start a new study session
 */
export const startSession = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user.id;

    // Get current progress
    const progressResult = await query(
      'SELECT progress_percentage FROM study_progress WHERE user_id = $1 AND resource_id = $2',
      [userId, resourceId]
    );

    const currentProgress = progressResult.rows[0]?.progress_percentage || 0;

    // Create session record
    const result = await query(
      `INSERT INTO study_sessions (user_id, resource_id, progress_at_start)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, resourceId, currentProgress]
    );

    res.json({
      success: true,
      message: 'Study session started',
      data: {
        sessionId: result.rows[0].id,
        startedAt: result.rows[0].session_start
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End a study session
 */
export const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { progressAtEnd } = req.body;
    const userId = req.user.id;

    const result = await query(
      `UPDATE study_sessions 
       SET session_end = CURRENT_TIMESTAMP,
           duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - session_start))::INTEGER,
           progress_at_end = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [progressAtEnd, sessionId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    res.json({
      success: true,
      message: 'Study session ended',
      data: {
        sessionId: result.rows[0].id,
        duration: result.rows[0].duration,
        progressGained: result.rows[0].progress_at_end - result.rows[0].progress_at_start
      }
    });
  } catch (error) {
    next(error);
  }
};
