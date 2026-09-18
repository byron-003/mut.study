import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireClassRep, requireCanAddCourse } from '../middleware/authMiddleware.js';
import { 
  createCourseAsClassRep, 
  getMyCreatedCourses 
} from '../controllers/classRepController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/class-rep/courses
 * @desc    Create a new course in user's program
 * @access  Class Rep (or any student when allow_students_add_course is enabled)
 */
router.post('/courses', requireCanAddCourse, createCourseAsClassRep);

/**
 * @route   GET /api/class-rep/courses
 * @desc    Get courses created by current class rep
 * @access  Class Rep only
 */
router.get('/courses', requireClassRep, getMyCreatedCourses);

export default router;
