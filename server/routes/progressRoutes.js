import express from 'express';
import {
  updateProgress,
  getProgress,
  getStudyHistory,
  getStudyStats,
  markAsCompleted,
  startSession,
  endSession
} from '../controllers/progressController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Progress tracking
router.post('/:resourceId/update', updateProgress);
router.get('/:resourceId', getProgress);
router.post('/:resourceId/complete', markAsCompleted);

// Study history
router.get('/history/all', getStudyHistory);

// Statistics
router.get('/stats/overview', getStudyStats);

// Study sessions
router.post('/session/:resourceId/start', startSession);
router.put('/session/:sessionId/end', endSession);

export default router;
