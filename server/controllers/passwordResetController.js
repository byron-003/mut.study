import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateOTP, hashOTP, verifyOTP, getOTPExpiration } from '../utils/otp.js';
import { sendPasswordResetOTP, sendPasswordResetSuccess } from '../config/email.js';
import bcrypt from 'bcrypt';

/**
 * Request password reset - Send OTP to email
 */
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      throw new AppError('Email is required', 400);
    }

    // Find user by email
    const result = await query(
      'SELECT id, email, first_name, last_name FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      // Don't send OTP if email doesn't exist - security best practice
      // Still return success message to avoid revealing if email exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.',
      });
    }

    const user = result.rows[0];

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = getOTPExpiration();

    // Store hashed OTP in database
    await query(
      'UPDATE users SET reset_otp_hash = $1, reset_otp_expires = $2 WHERE id = $3',
      [otpHash, expiresAt, user.id]
    );

    // Send OTP email
    try {
      await sendPasswordResetOTP(user.email, otp, `${user.first_name} ${user.last_name}`);
      console.log(`✅ Password reset OTP sent to ${user.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      throw new AppError('Failed to send password reset email. Please try again later.', 500);
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset code.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 */
export const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }

    // Find user
    const result = await query(
      'SELECT id, reset_otp_hash, reset_otp_expires FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid OTP', 400);
    }

    const user = result.rows[0];

    // Check if OTP exists
    if (!user.reset_otp_hash || !user.reset_otp_expires) {
      throw new AppError('No password reset request found. Please request a new code.', 400);
    }

    // Check if OTP has expired
    if (new Date() > new Date(user.reset_otp_expires)) {
      throw new AppError('OTP has expired. Please request a new code.', 400);
    }

    // Verify OTP
    const isValid = verifyOTP(otp.trim(), user.reset_otp_hash);

    if (!isValid) {
      throw new AppError('Invalid OTP', 400);
    }

    res.json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with OTP
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate inputs
    if (!email || !otp || !newPassword) {
      throw new AppError('Email, OTP, and new password are required', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Find user
    const result = await query(
      'SELECT id, email, first_name, last_name, reset_otp_hash, reset_otp_expires FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid OTP', 400);
    }

    const user = result.rows[0];

    // Check if OTP exists
    if (!user.reset_otp_hash || !user.reset_otp_expires) {
      throw new AppError('No password reset request found', 400);
    }

    // Check if OTP has expired
    if (new Date() > new Date(user.reset_otp_expires)) {
      throw new AppError('OTP has expired. Please request a new code.', 400);
    }

    // Verify OTP
    const isValid = verifyOTP(otp.trim(), user.reset_otp_hash);

    if (!isValid) {
      throw new AppError('Invalid OTP', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP fields
    await query(
      'UPDATE users SET password_hash = $1, reset_otp_hash = NULL, reset_otp_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    // Send success notification email
    try {
      await sendPasswordResetSuccess(user.email, `${user.first_name} ${user.last_name}`);
    } catch (emailError) {
      console.error('Failed to send success email:', emailError);
      // Don't fail the request if notification fails
    }

    console.log(`✅ Password reset successful for ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
