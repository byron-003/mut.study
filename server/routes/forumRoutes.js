import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getAllPosts,
  getPostById,
  createPost,
  addComment,
  toggleLikePost,
  deletePost,
  deleteComment
} from '../controllers/forumController.js';

const router = express.Router();

// Configure Cloudinary storage for forum images
const forumImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mut_study_hub_forum', // Separate folder for forum images
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' }, // Limit size
      { quality: 'auto' } // Auto quality optimization
    ]
  }
});

const upload = multer({
  storage: forumImageStorage,
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

// All routes require authentication
router.use(authenticate);

// Post routes
router.get('/posts', getAllPosts);
router.get('/posts/:id', getPostById);
router.post('/posts', upload.single('image'), createPost);
router.delete('/posts/:id', deletePost);

// Comment routes
router.post('/posts/:id/comments', addComment);
router.delete('/comments/:commentId', deleteComment);

// Like routes
router.post('/posts/:id/like', toggleLikePost);

export default router;
