import express from 'express';
import {
  requestPasswordReset,
  verifyResetOTP,
  resetPassword,
} from '../controllers/passwordResetController.js';
import { passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Request password reset - Send OTP (rate limited)
router.post('/request', passwordResetLimiter, requestPasswordReset);

// Verify OTP (rate limited)
router.post('/verify-otp', passwordResetLimiter, verifyResetOTP);

// Reset password with OTP (rate limited)
router.post('/reset', passwordResetLimiter, resetPassword);

export default router;
