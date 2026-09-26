import express from 'express';
import {
  getStats,
  getAdminBadges,
  getAnalytics,
  getUsers,
  updateUserStatus,
  updateUserRole,
  updateClassRepStatus,
  updateUserProgram,
  getResources,
  approveResource,
  rejectResource,
  deleteResource,
  bulkApproveResources,
  bulkRejectResources,
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getDepartments,
  getProgramsDropdown,
  getSettings,
  updateSetting,
  updateSettings,
  getPublicSettings,
  getDownloadsEnabled,
  getMaxFileSize,
  getBanner,
  setBanner,
  clearBanner,
  uploadFile,
} from '../controllers/adminController.js';
import {
  getFeedbackList,
  updateFeedbackStatus,
  deleteFeedback,
} from '../controllers/feedbackController.js';
import {
  getEmailStatus,
  runEmailCheck,
  sendTestEmailAdmin,
  clearEmailLogs,
} from '../controllers/emailAdminController.js';
import {
  getForumPosts,
  getForumComments,
  deleteForumPost,
  deleteForumComment,
} from '../controllers/forumAdminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/public/downloads-enabled', getDownloadsEnabled);
router.get('/public/max-file-size', getMaxFileSize);
router.get('/public/banner', getBanner);
router.get('/public/settings', getPublicSettings);

// All other admin routes require authentication and admin/class_rep role
router.use(authenticate);
router.use(authorize('admin', 'class_rep'));

// Announcement banner (admin only)
router.put('/banner', authorize('admin'), setBanner);
router.delete('/banner', authorize('admin'), clearBanner);

// Statistics and analytics
router.get('/stats', getStats);
router.get('/badges', getAdminBadges);
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', authorize('admin'), updateUserRole); // Only admins can change roles
router.put('/users/:id/class-rep', authorize('admin'), updateClassRepStatus); // Only admins can set class reps
router.put('/users/:id/program', authorize('admin'), updateUserProgram); // Only admins can change program

// Resource management
router.get('/resources', getResources);
router.put('/resources/:id/approve', approveResource);
router.put('/resources/:id/reject', rejectResource);
router.delete('/resources/:id', authorize('admin'), deleteResource); // Only admins can delete
router.post('/resources/bulk-approve', bulkApproveResources);
router.post('/resources/bulk-reject', bulkRejectResources);

// Program management (Admin only)
router.get('/programs', authorize('admin'), getPrograms);
router.post('/programs', authorize('admin'), createProgram);
router.put('/programs/:id', authorize('admin'), updateProgram);
router.delete('/programs/:id', authorize('admin'), deleteProgram);

// Course management (Admin only)
router.get('/courses', authorize('admin'), getCourses);
router.post('/courses', authorize('admin'), createCourse);
router.put('/courses/:id', authorize('admin'), updateCourse);
router.delete('/courses/:id', authorize('admin'), deleteCourse);

// Dropdown data
router.get('/departments/list', getDepartments);
router.get('/programs/list', getProgramsDropdown);

// System settings (Admin only)
router.get('/settings', authorize('admin'), getSettings);
router.put('/settings', authorize('admin'), updateSetting);
router.put('/settings/bulk', authorize('admin'), updateSettings);

// File upload (for notifications, etc.)
router.post('/upload', upload.single('file'), uploadFile);

// Platform feedback (Admin only - users' feedback and ratings)
router.get('/feedback', authorize('admin'), getFeedbackList);
router.patch('/feedback/:id/status', authorize('admin'), updateFeedbackStatus);
router.delete('/feedback/:id', authorize('admin'), deleteFeedback);

// Email service (Admin only - config status, verification, test sends, logs)
router.get('/email/status', authorize('admin'), getEmailStatus);
router.post('/email/check', authorize('admin'), runEmailCheck);
router.post('/email/test', authorize('admin'), sendTestEmailAdmin);
router.delete('/email/logs', authorize('admin'), clearEmailLogs);

// Forum management (Admin only - site-wide posts and comments)
router.get('/forum/posts', authorize('admin'), getForumPosts);
router.get('/forum/comments', authorize('admin'), getForumComments);
router.delete('/forum/posts/:id', authorize('admin'), deleteForumPost);
router.delete('/forum/comments/:commentId', authorize('admin'), deleteForumComment);

export default router;
