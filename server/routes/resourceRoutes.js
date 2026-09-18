import express from 'express';
import {
  uploadResource,
  getResourcesByCourse,
  getPendingResources,
  approveResource,
  rejectResource,
  deleteResource,
  incrementDownloadCount,
  getMyUploads,
  updateResource
} from '../controllers/resourceController.js';
import { authenticate, requireModerator } from '../middleware/authMiddleware.js';
import { upload, checkFileSize } from '../config/cloudinary.js';

const router = express.Router();

// Protected routes - require authentication (including viewing resources)
router.get('/course/:courseId', authenticate, getResourcesByCourse);

// Upload routes - check file size dynamically before upload
router.post('/upload', authenticate, checkFileSize, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // Multer or Cloudinary error
      console.error('Upload middleware error:', err);
      return res.status(400).json({
        status: 'error',
        message: err.message || 'File upload failed',
        details: err.storageErrors || []
      });
    }
    next();
  });
}, uploadResource);
router.get('/my-uploads', authenticate, getMyUploads);
router.put('/:id', authenticate, updateResource);
router.post('/:id/download', incrementDownloadCount);
router.delete('/:id', authenticate, deleteResource);

// Class rep and admin routes
router.get('/pending', authenticate, requireModerator, getPendingResources);
router.put('/:id/approve', authenticate, requireModerator, approveResource);
router.put('/:id/reject', authenticate, requireModerator, rejectResource);

export default router;
