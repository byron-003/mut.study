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
import { convertDocumentMiddleware } from '../services/documentConverter.js';

const router = express.Router();

// Protected routes - require authentication (including viewing resources)
router.get('/course/:courseId', authenticate, getResourcesByCourse);

// Upload routes - check file size dynamically before upload
// Pipeline: authenticate -> checkFileSize -> multer upload -> convert Word to PDF -> upload to Cloudinary
router.post('/upload', 
  authenticate, 
  checkFileSize, 
  (req, res, next) => {
    // Use multer with memory storage to capture file buffer
    upload.single('file')(req, res, (err) => {
      if (err) {
        // Multer error
        console.error('Upload middleware error:', err);
        return res.status(400).json({
          status: 'error',
          message: err.message || 'File upload failed',
          details: err.storageErrors || []
        });
      }
      next();
    });
  },
  convertDocumentMiddleware, // Convert Word documents to PDF
  uploadResource
);
router.get('/my-uploads', authenticate, getMyUploads);
router.put('/:id', authenticate, updateResource);
router.post('/:id/download', incrementDownloadCount);
router.delete('/:id', authenticate, deleteResource);

// Class rep and admin routes
router.get('/pending', authenticate, requireModerator, getPendingResources);
router.put('/:id/approve', authenticate, requireModerator, approveResource);
router.put('/:id/reject', authenticate, requireModerator, rejectResource);

export default router;
