import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  updateNotification,
  deleteNotification,
  getAllNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Student routes
 */

// Get current user's notifications
router.get('/', getUserNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Mark all as read
router.put('/read-all', markAllAsRead);

/**
 * Admin routes
 */

// Create notification (admin only)
router.post('/', authorize('admin'), createNotification);

// Get all notifications (admin only)
router.get('/admin/all', authorize('admin'), getAllNotifications);

// Update notification (admin only)
router.put('/:id', authorize('admin'), updateNotification);

// Delete notification (admin only)
router.delete('/:id', authorize('admin'), deleteNotification);

export default router;
