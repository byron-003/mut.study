import express from 'express';
import { viewFile, downloadFile } from '../controllers/fileProxyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public viewing endpoint (no auth required for viewing)
// This allows embedded viewers to access files
router.get('/view/:resourceId', viewFile);

// Download endpoint (requires authentication)
router.get('/download/:resourceId', authenticate, downloadFile);

export default router;
