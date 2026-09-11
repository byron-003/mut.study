import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Create a new notification (Admin only)
 */
export const createNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetType, targetProgramId, targetUserId, expiresAt } = req.body;
    const createdBy = req.user.id;

    // Validate required fields
    if (!title || !message || !targetType) {
      throw new AppError('Title, message, and target type are required', 400);
    }

    // Validate target type
    const validTargetTypes = ['all', 'program', 'user'];
    if (!validTargetTypes.includes(targetType)) {
      throw new AppError('Invalid target type. Must be: all, program, or user', 400);
    }

    // Validate type
    const validTypes = ['info', 'success', 'warning', 'error'];
    const notificationType = type || 'info';
    if (!validTypes.includes(notificationType)) {
      throw new AppError('Invalid notification type', 400);
    }

    // Validate target consistency
    if (targetType === 'program' && !targetProgramId) {
      throw new AppError('Program ID is required when target type is program', 400);
    }
    if (targetType === 'user' && !targetUserId) {
      throw new AppError('User ID is required when target type is user', 400);
    }

    // Create notification
    const result = await query(
      `INSERT INTO notifications (title, message, type, target_type, target_program_id, target_user_id, created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, message, type, target_type, target_program_id, target_user_id, created_at, expires_at`,
      [title, message, notificationType, targetType, targetProgramId || null, targetUserId || null, createdBy, expiresAt || null]
    );

    const notification = result.rows[0];

    // Get target count
    let targetCount = 0;
    if (targetType === 'all') {
      const countResult = await query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['student']);
      targetCount = parseInt(countResult.rows[0].count);
    } else if (targetType === 'program') {
      const countResult = await query('SELECT COUNT(*) as count FROM users WHERE program_id = $1 AND role = $2', [targetProgramId, 'student']);
      targetCount = parseInt(countResult.rows[0].count);
    } else {
      targetCount = 1;
    }

    res.status(201).json({
      status: 'success',
      message: `Notification sent to ${targetCount} user(s)`,
      data: {
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          targetType: notification.target_type,
          targetProgramId: notification.target_program_id,
          targetUserId: notification.target_user_id,
          createdAt: notification.created_at,
          expiresAt: notification.expires_at,
          targetCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's notifications
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userProgramId = req.user.program_id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    // Build query for notifications targeted to this user
    let whereClause = `
      WHERE (
        n.target_type = 'all' OR
        (n.target_type = 'program' AND n.target_program_id = $1) OR
        (n.target_type = 'user' AND n.target_user_id = $2)
      )
      AND (n.expires_at IS NULL OR n.expires_at > NOW())
    `;

    const params = [userProgramId, userId];
    let paramCount = 3;

    if (unreadOnly === 'true') {
      whereClause += ` AND nr.id IS NULL`;
    }

    // Get notifications with read status
    const result = await query(
      `SELECT 
        n.id, n.title, n.message, n.type, n.target_type, n.created_at,
        CASE WHEN nr.id IS NOT NULL THEN true ELSE false END as is_read,
        nr.read_at
       FROM notifications n
       LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = $2
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, parseInt(limit), offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM notifications n
       LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = $2
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      status: 'success',
      data: {
        notifications: result.rows.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          targetType: n.target_type,
          isRead: n.is_read,
          readAt: n.read_at,
          createdAt: n.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread count for user
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userProgramId = req.user.program_id;

    const result = await query(
      `SELECT COUNT(*) as count
       FROM notifications n
       LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = $1
       WHERE (
         n.target_type = 'all' OR
         (n.target_type = 'program' AND n.target_program_id = $2) OR
         (n.target_type = 'user' AND n.target_user_id = $1)
       )
       AND (n.expires_at IS NULL OR n.expires_at > NOW())
       AND nr.id IS NULL`,
      [userId, userProgramId]
    );

    res.json({
      status: 'success',
      data: {
        unreadCount: parseInt(result.rows[0].count)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if notification exists and user can access it
    const notificationCheck = await query(
      `SELECT * FROM notifications 
       WHERE id = $1 AND (
         target_type = 'all' OR
         (target_type = 'program' AND target_program_id = $2) OR
         (target_type = 'user' AND target_user_id = $3)
       )`,
      [id, req.user.program_id, userId]
    );

    if (notificationCheck.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    // Mark as read (ignore if already read)
    await query(
      `INSERT INTO notification_reads (notification_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (notification_id, user_id) DO NOTHING`,
      [id, userId]
    );

    res.json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userProgramId = req.user.program_id;

    // Get all unread notification IDs for this user
    const notificationsResult = await query(
      `SELECT n.id
       FROM notifications n
       LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = $1
       WHERE (
         n.target_type = 'all' OR
         (n.target_type = 'program' AND n.target_program_id = $2) OR
         (n.target_type = 'user' AND n.target_user_id = $1)
       )
       AND (n.expires_at IS NULL OR n.expires_at > NOW())
       AND nr.id IS NULL`,
      [userId, userProgramId]
    );

    const notificationIds = notificationsResult.rows.map(r => r.id);

    if (notificationIds.length > 0) {
      // Bulk insert reads
      const values = notificationIds.map(id => `(${id}, ${userId})`).join(',');
      await query(
        `INSERT INTO notification_reads (notification_id, user_id)
         VALUES ${values}
         ON CONFLICT (notification_id, user_id) DO NOTHING`
      );
    }

    res.json({
      status: 'success',
      message: `${notificationIds.length} notification(s) marked as read`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification (Admin only)
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    res.json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all notifications (Admin only)
 */
export const getAllNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, targetType } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    let paramCount = 1;

    if (targetType) {
      whereClause = `WHERE n.target_type = $${paramCount++}`;
      params.push(targetType);
    }

    const result = await query(
      `SELECT 
        n.id, n.title, n.message, n.type, n.target_type, 
        n.target_program_id, n.target_user_id, n.created_at, n.expires_at,
        p.name as program_name,
        u.first_name, u.last_name, u.email as target_email,
        creator.first_name as creator_first_name, creator.last_name as creator_last_name,
        COUNT(DISTINCT nr.user_id) as read_count
       FROM notifications n
       LEFT JOIN programs p ON n.target_program_id = p.id
       LEFT JOIN users u ON n.target_user_id = u.id
       LEFT JOIN users creator ON n.created_by = creator.id
       LEFT JOIN notification_reads nr ON n.id = nr.notification_id
       ${whereClause}
       GROUP BY n.id, p.name, u.first_name, u.last_name, u.email, 
                creator.first_name, creator.last_name
       ORDER BY n.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, parseInt(limit), offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM notifications n ${whereClause}`,
      params.slice(0, paramCount - 3)
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      status: 'success',
      data: {
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
