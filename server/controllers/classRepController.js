import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Create a new course (Class Rep only)
 * Class reps can only create courses in their own program
 */
export const createCourseAsClassRep = async (req, res, next) => {
  try {
    const { unit_code, unit_title, level, semester, credits } = req.body;
    const userId = req.user.id;
    const userProgramId = req.user.program_id;

    // Validate required fields
    if (!unit_code || !unit_title) {
      throw new AppError('Unit code and title are required', 400);
    }

    // Ensure user has a program
    if (!userProgramId) {
      throw new AppError('You must be enrolled in a program to create courses', 400);
    }

    // Check if unit code already exists in this program
    const existingCourse = await query(
      'SELECT id FROM courses WHERE unit_code = $1 AND program_id = $2',
      [unit_code, userProgramId]
    );

    if (existingCourse.rows.length > 0) {
      throw new AppError('A course with this unit code already exists in your program', 400);
    }

    // Create course in the class rep's program
    const result = await query(
      `INSERT INTO courses (unit_code, unit_title, level, semester, credits, program_id, created_by_class_rep)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, unit_code, unit_title, level, semester, credits, program_id, created_at`,
      [unit_code, unit_title, level || null, semester || null, credits || 3, userProgramId, userId]
    );

    const course = result.rows[0];

    // Log the action
    console.log(`Course created by class rep: ${req.user.email} - ${unit_code} in program ${userProgramId}`);

    res.status(201).json({
      status: 'success',
      message: 'Course created successfully',
      data: {
        course: {
          id: course.id,
          unitCode: course.unit_code,
          unitTitle: course.unit_title,
          level: course.level,
          semester: course.semester,
          credits: course.credits,
          programId: course.program_id,
          createdAt: course.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get courses created by current class rep
 */
export const getMyCreatedCourses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT 
        c.id, 
        c.unit_code, 
        c.unit_title, 
        c.level, 
        c.semester, 
        c.credits,
        c.program_id,
        c.created_at,
        p.program_name,
        COUNT(r.id) as resource_count
       FROM courses c
       LEFT JOIN programs p ON c.program_id = p.id
       LEFT JOIN resources r ON r.course_id = c.id
       WHERE c.created_by_class_rep = $1
       GROUP BY c.id, p.program_name
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json({
      status: 'success',
      data: {
        courses: result.rows.map(course => ({
          id: course.id,
          unitCode: course.unit_code,
          unitTitle: course.unit_title,
          level: course.level,
          semester: course.semester,
          credits: course.credits,
          programId: course.program_id,
          programName: course.program_name,
          resourceCount: parseInt(course.resource_count),
          createdAt: course.created_at
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
