import crypto from 'crypto';

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP for secure storage
 */
export const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Verify OTP against hash
 */
export const verifyOTP = (otp, hash) => {
  const otpHash = hashOTP(otp);
  return otpHash === hash;
};

/**
 * Get OTP expiration time (10 minutes from now)
 */
export const getOTPExpiration = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};
