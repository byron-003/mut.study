import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireClassRep } from '../middleware/authMiddleware.js';
import { 
  createCourseAsClassRep, 
  getMyCreatedCourses 
} from '../controllers/classRepController.js';

const router = express.Router();

// All routes require authentication and class rep status
router.use(authenticate);
router.use(requireClassRep);

/**
 * @route   POST /api/class-rep/courses
 * @desc    Create a new course in class rep's program
 * @access  Class Rep only
 */
router.post('/courses', createCourseAsClassRep);

/**
 * @route   GET /api/class-rep/courses
 * @desc    Get courses created by current class rep
 * @access  Class Rep only
 */
router.get('/courses', getMyCreatedCourses);

export default router;
