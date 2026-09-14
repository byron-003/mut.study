import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register new user
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, programId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !programId) {
      throw new AppError('All fields are required including program selection', 400);
    }

    // Validate email format and domain
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Please provide a valid email address', 400);
    }

    // Validate password strength
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Email already registered', 409);
    }

    // Validate program (required)
    const programExists = await query(
      'SELECT id FROM programs WHERE id = $1',
      [programId]
    );

    if (programExists.rows.length === 0) {
      throw new AppError('Invalid program selected', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, program_id, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, first_name, last_name, role, program_id, created_at`,
      [email.toLowerCase(), passwordHash, firstName, lastName, programId, 'student']
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          programId: user.program_id
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Get user from database
    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role, u.program_id, u.is_active, u.current_year, u.current_semester, u.profile_picture_url, u.is_class_rep,
              p.name as program_name, p.code as program_code
       FROM users u
       LEFT JOIN programs p ON u.program_id = p.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      throw new AppError('Account is inactive. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          programId: user.program_id,
          programName: user.program_name,
          programCode: user.program_code,
          currentYear: user.current_year,
          currentSemester: user.current_semester,
          profilePicture: user.profile_picture_url,
          isClassRep: user.is_class_rep || false
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.program_id, u.current_year, u.current_semester, u.created_at, u.profile_picture_url, u.is_class_rep,
              p.name as program_name, p.code as program_code, p.level as program_level,
              d.name as department_name, s.name as school_name
       FROM users u
       LEFT JOIN programs p ON u.program_id = p.id
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN schools s ON d.school_id = s.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        currentYear: user.current_year,
        currentSemester: user.current_semester,
        profilePicture: user.profile_picture_url,
        program: user.program_id ? {
          id: user.program_id,
          name: user.program_name,
          code: user.program_code,
          level: user.program_level,
          department: user.department_name,
          school: user.school_name
        } : null,
        isClassRep: user.is_class_rep || false,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, programId, currentYear, currentSemester } = req.body;
    const userId = req.user.id;

    // Validate program if provided
    if (programId) {
      const programExists = await query(
        'SELECT id FROM programs WHERE id = $1',
        [programId]
      );

      if (programExists.rows.length === 0) {
        throw new AppError('Invalid program selected', 400);
      }
    }
    
    // Validate current year if provided
    if (currentYear !== undefined && currentYear !== null && currentYear !== '') {
      const yearNum = parseInt(currentYear);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 5) {
        throw new AppError('Current year must be between 1 and 5', 400);
      }
    }
    
    // Validate current semester if provided
    if (currentSemester !== undefined && currentSemester !== null && currentSemester !== '') {
      const semNum = parseInt(currentSemester);
      if (isNaN(semNum) || (semNum !== 1 && semNum !== 2)) {
        throw new AppError('Current semester must be 1 or 2', 400);
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }

    if (lastName) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }

    if (programId !== undefined) {
      updates.push(`program_id = $${paramCount++}`);
      values.push(programId);
    }
    
    if (currentYear !== undefined) {
      updates.push(`current_year = $${paramCount++}`);
      values.push(currentYear === '' || currentYear === null ? null : parseInt(currentYear));
    }
    
    if (currentSemester !== undefined) {
      updates.push(`current_semester = $${paramCount++}`);
      values.push(currentSemester === '' || currentSemester === null ? null : parseInt(currentSemester));
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING id, email, first_name, last_name, role, program_id, current_year, current_semester`,
      values
    );

    const user = result.rows[0];

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        programId: user.program_id,
        currentYear: user.current_year,
        currentSemester: user.current_semester
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Get current profile picture to delete old one
    const currentUser = await query(
      'SELECT profile_picture_url FROM users WHERE id = $1',
      [userId]
    );

    // When using CloudinaryStorage, the file is already uploaded
    // req.file.path contains the Cloudinary URL
    const imageUrl = req.file.path; // Cloudinary URL

    // Delete old profile picture from cloudinary if exists
    if (currentUser.rows[0].profile_picture_url) {
      try {
        // Extract public_id from the old URL
        const urlParts = currentUser.rows[0].profile_picture_url.split('/');
        const publicIdWithExt = urlParts.slice(-2).join('/'); // folder/filename.ext
        const publicId = publicIdWithExt.split('.')[0]; // Remove extension
        
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue anyway - don't fail the upload if old deletion fails
      }
    }

    // Update database
    const updateResult = await query(
      'UPDATE users SET profile_picture_url = $1 WHERE id = $2 RETURNING profile_picture_url',
      [imageUrl, userId]
    );

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: updateResult.rows[0].profile_picture_url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get current profile picture
    const currentUser = await query(
      'SELECT profile_picture_url FROM users WHERE id = $1',
      [userId]
    );

    if (!currentUser.rows[0].profile_picture_url) {
      throw new AppError('No profile picture to delete', 400);
    }

    // Delete from cloudinary
    try {
      const publicId = currentUser.rows[0].profile_picture_url
        .split('/')
        .slice(-2)
        .join('/')
        .split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting profile picture from cloudinary:', error);
    }

    // Update database
    await query(
      'UPDATE users SET profile_picture_url = NULL WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile picture deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', 400);
    }

    // Get current user with password
    const result = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      throw new AppError('New password must be different from current password', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user settings
 */
export const getSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT advanced_features_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        advancedFeaturesEnabled: result.rows[0].advanced_features_enabled || false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { advancedFeaturesEnabled } = req.body;

    // Validate input
    if (typeof advancedFeaturesEnabled !== 'boolean') {
      throw new AppError('advancedFeaturesEnabled must be a boolean value', 400);
    }

    // Update settings
    const result = await query(
      'UPDATE users SET advanced_features_enabled = $1 WHERE id = $2 RETURNING advanced_features_enabled',
      [advancedFeaturesEnabled, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        advancedFeaturesEnabled: result.rows[0].advanced_features_enabled
      }
    });
  } catch (error) {
    next(error);
  }
};
