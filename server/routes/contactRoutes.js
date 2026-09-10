import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import {
  submitContactMessage,
  getAllMessages,
  getMessageById,
  replyToMessage,
  updateMessageStatus,
  deleteMessage,
  getMessageStats
} from '../controllers/contactController.js';

const router = express.Router();

// Public route - anyone can submit a contact message
router.post('/messages', submitContactMessage);

// Admin-only routes
router.get('/messages', authenticate, requireAdmin, getAllMessages);
router.get('/messages/stats', authenticate, requireAdmin, getMessageStats);
router.get('/messages/:id', authenticate, requireAdmin, getMessageById);
router.post('/messages/:id/reply', authenticate, requireAdmin, replyToMessage);
router.patch('/messages/:id/status', authenticate, requireAdmin, updateMessageStatus);
router.delete('/messages/:id', authenticate, requireAdmin, deleteMessage);

export default router;
