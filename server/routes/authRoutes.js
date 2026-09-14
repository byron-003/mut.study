import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  uploadProfilePicture, 
  deleteProfilePicture,
  changePassword,
  getSettings,
  updateSettings
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Configure Cloudinary storage for profile pictures
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mut_study_hub_profiles', // Separate folder for profile pictures
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' }, // Limit size
      { quality: 'auto' } // Auto quality optimization
    ]
  }
});

const upload = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Public routes with rate limiting
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/profile/picture', authenticate, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/profile/picture', authenticate, deleteProfilePicture);

// Password and settings routes
router.put('/change-password', authenticate, changePassword);
router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, updateSettings);

export default router;
