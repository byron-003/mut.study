import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get all schools
 */
export const getAllSchools = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, code, description FROM schools ORDER BY name'
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get school by ID with departments
 */
export const getSchoolById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schoolResult = await query(
      'SELECT id, name, code, description FROM schools WHERE id = $1',
      [id]
    );

    if (schoolResult.rows.length === 0) {
      throw new AppError('School not found', 404);
    }

    const departmentsResult = await query(
      'SELECT id, name, code, description FROM departments WHERE school_id = $1 ORDER BY name',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...schoolResult.rows[0],
        departments: departmentsResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get department by ID with programs
 */
export const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deptResult = await query(
      `SELECT d.id, d.name, d.code, d.description,
              s.id as school_id, s.name as school_name, s.code as school_code
       FROM departments d
       JOIN schools s ON d.school_id = s.id
       WHERE d.id = $1`,
      [id]
    );

    if (deptResult.rows.length === 0) {
      throw new AppError('Department not found', 404);
    }

    const programsResult = await query(
      'SELECT id, name, code, level, duration_years FROM programs WHERE department_id = $1 ORDER BY level, name',
      [id]
    );

    const department = deptResult.rows[0];

    res.json({
      success: true,
      data: {
        id: department.id,
        name: department.name,
        code: department.code,
        description: department.description,
        school: {
          id: department.school_id,
          name: department.school_name,
          code: department.school_code
        },
        programs: programsResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get program by ID with courses
 */
export const getProgramById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const programResult = await query(
      `SELECT p.id, p.name, p.code, p.level, p.duration_years, p.description,
              d.id as department_id, d.name as department_name, d.code as department_code,
              s.id as school_id, s.name as school_name, s.code as school_code
       FROM programs p
       JOIN departments d ON p.department_id = d.id
       JOIN schools s ON d.school_id = s.id
       WHERE p.id = $1`,
      [id]
    );

    if (programResult.rows.length === 0) {
      throw new AppError('Program not found', 404);
    }

    const coursesResult = await query(
      `SELECT id, unit_code, unit_title, academic_year, semester, credits, description
       FROM courses 
       WHERE program_id = $1 
       ORDER BY academic_year, semester, unit_code`,
      [id]
    );

    const program = programResult.rows[0];

    // Group courses by year and semester
    const coursesByYear = {};
    coursesResult.rows.forEach(course => {
      const year = course.academic_year;
      const semester = course.semester || 1;
      if (!coursesByYear[year]) {
        coursesByYear[year] = {};
      }

      const semesterKey = `semester${semester}`;
      if (!coursesByYear[year][semesterKey]) {
        coursesByYear[year][semesterKey] = [];
      }

      coursesByYear[year][semesterKey].push({
        id: course.id,
        unitCode: course.unit_code,
        unitTitle: course.unit_title,
        credits: course.credits,
        description: course.description,
        academicYear: course.academic_year,
        semester: course.semester
      });
    });

    res.json({
      success: true,
      data: {
        id: program.id,
        name: program.name,
        code: program.code,
        level: program.level,
        durationYears: program.duration_years,
        description: program.description,
        department: {
          id: program.department_id,
          name: program.department_name,
          code: program.department_code
        },
        school: {
          id: program.school_id,
          name: program.school_name,
          code: program.school_code
        },
        courses: coursesByYear
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course by ID
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT c.id, c.unit_code, c.unit_title, c.academic_year, c.semester, c.credits, c.description,
              p.id as program_id, p.name as program_name, p.code as program_code, p.level,
              d.name as department_name,
              s.name as school_name
       FROM courses c
       JOIN programs p ON c.program_id = p.id
       JOIN departments d ON p.department_id = d.id
       JOIN schools s ON d.school_id = s.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Course not found', 404);
    }

    const course = result.rows[0];

    res.json({
      success: true,
      data: {
        id: course.id,
        unitCode: course.unit_code,
        unitTitle: course.unit_title,
        academicYear: course.academic_year,
        semester: course.semester,
        credits: course.credits,
        description: course.description,
        program: {
          id: course.program_id,
          name: course.program_name,
          code: course.program_code,
          level: course.level
        },
        department: course.department_name,
        school: course.school_name
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all programs
 */
export const getAllPrograms = async (req, res, next) => {
  try {
    const { level, schoolId, departmentId } = req.query;

    let queryText = `
      SELECT p.id, p.name, p.code, p.level, p.duration_years,
             d.name as department_name, d.code as department_code,
             s.name as school_name, s.code as school_code
      FROM programs p
      JOIN departments d ON p.department_id = d.id
      JOIN schools s ON d.school_id = s.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (level) {
      queryText += ` AND p.level = $${paramCount++}`;
      params.push(level);
    }

    if (schoolId) {
      queryText += ` AND s.id = $${paramCount++}`;
      params.push(schoolId);
    }

    if (departmentId) {
      queryText += ` AND d.id = $${paramCount++}`;
      params.push(departmentId);
    }

    queryText += ` ORDER BY s.name, d.name, p.level, p.name`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        code: row.code,
        level: row.level,
        durationYears: row.duration_years,
        department: {
          name: row.department_name,
          code: row.department_code
        },
        school: {
          name: row.school_name,
          code: row.school_code
        }
      }))
    });
  } catch (error) {
    next(error);
  }
};
