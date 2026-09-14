import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  summarizeResource,
  getSummaryHistory,
  getSummaryById,
  deleteSummary,
  getSummaryStats
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'temp-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // Accept all file types (we validate on server side)
    cb(null, true);
  }
});

// All AI routes require authentication
router.use(authenticate);

// Summarization routes
router.post('/summarize', upload.single('file'), summarizeResource);
router.get('/summaries', getSummaryHistory);
router.get('/summaries/stats', getSummaryStats);
router.get('/summaries/:id', getSummaryById);
router.delete('/summaries/:id', deleteSummary);

export default router;
