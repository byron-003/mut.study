import express from 'express';
import { viewFile, downloadFile } from '../controllers/fileProxyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public viewing endpoint (no auth required for viewing)
// This allows embedded viewers to access files.
// The optional :filename segment is ignored by the controller but lets the URL
// carry a file extension (e.g. /view/18/document.docx) - Microsoft Office Viewer
// rejects extensionless URLs.
router.get('/view/:resourceId/:filename?', viewFile);

// Download endpoint (requires authentication)
router.get('/download/:resourceId', authenticate, downloadFile);

export default router;
