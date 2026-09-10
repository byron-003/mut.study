import express from 'express';
import {
  getAllSchools,
  getSchoolById,
  getDepartmentById,
  getProgramById,
  getCourseById,
  getAllPrograms
} from '../controllers/schoolController.js';

const router = express.Router();

router.get('/', getAllSchools);
router.get('/programs', getAllPrograms);
router.get('/:id', getSchoolById);
router.get('/departments/:id', getDepartmentById);
router.get('/programs/:id', getProgramById);
router.get('/courses/:id', getCourseById);

export default router;
