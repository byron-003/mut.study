import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { submitFeedback, getMyFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

// User-facing endpoints (authentication required)
router.post('/', authenticate, submitFeedback);
router.get('/me', authenticate, getMyFeedback);

export default router;