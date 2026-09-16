import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get admin dashboard statistics
 */
export const getStats = async (req, res, next) => {
  try {
    // Get total users count
    const usersResult = await query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total);

    // Get users by role
    const roleResult = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    const usersByRole = roleResult.rows.reduce((acc, row) => {
      acc[row.role] = parseInt(row.count);
      return acc;
    }, {});

    // Get total programs
    const programsResult = await query('SELECT COUNT(*) as total FROM programs');
    const totalPrograms = parseInt(programsResult.rows[0].total);

    // Get total courses
    const coursesResult = await query('SELECT COUNT(*) as total FROM courses');
    const totalCourses = parseInt(coursesResult.rows[0].total);

    // Get total resources
    const resourcesResult = await query('SELECT COUNT(*) as total FROM study_materials');
    const totalResources = parseInt(resourcesResult.rows[0].total);

    // Get resources by status
    const statusResult = await query(`
      SELECT status, COUNT(*) as count 
      FROM study_materials 
      GROUP BY status
    `);
    const resourcesByStatus = statusResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    // Get total downloads
    const downloadsResult = await query(`
      SELECT COALESCE(SUM(download_count), 0) as total 
      FROM study_materials
    `);
    const totalDownloads = parseInt(downloadsResult.rows[0].total);

    // Get recent uploads (last 7 days)
    const recentUploadsResult = await query(`
      SELECT COUNT(*) as count 
      FROM study_materials 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const recentUploads = parseInt(recentUploadsResult.rows[0].count);

    // Get new users (last 30 days)
    const newUsersResult = await query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);
    const newUsers = parseInt(newUsersResult.rows[0].count);

    // Get top 5 most downloaded resources
    const topResourcesResult = await query(`
      SELECT sm.id, sm.title, sm.category as type, sm.download_count,
             c.unit_code, c.unit_title
      FROM study_materials sm
      JOIN courses c ON sm.course_id = c.id
      WHERE sm.status = 'approved'
      ORDER BY sm.download_count DESC
      LIMIT 5
    `);

    // Get recent activities (last 10)
    const recentActivitiesResult = await query(`
      SELECT 
        sm.id,
        sm.title,
        sm.status,
        sm.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM study_materials sm
      JOIN users u ON sm.uploader_id = u.id
      ORDER BY sm.created_at DESC
      LIMIT 10
    `);

    res.json({
      status: 'success',
      data: {
        overview: {
          totalUsers,
          totalPrograms,
          totalCourses,
          totalResources,
          totalDownloads,
          recentUploads,
          newUsers,
        },
        usersByRole: {
          students: usersByRole.student || 0,
          classReps: usersByRole.class_rep || 0,
          admins: usersByRole.admin || 0,
        },
        resourcesByStatus: {
          pending: resourcesByStatus.pending || 0,
          approved: resourcesByStatus.approved || 0,
          rejected: resourcesByStatus.rejected || 0,
        },
        topResources: topResourcesResult.rows,
        recentActivities: recentActivitiesResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          status: row.status,
          createdAt: row.created_at,
          uploader: {
            name: `${row.first_name} ${row.last_name}`,
            email: row.email,
          },
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics data
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { period = '7days' } = req.query;

    let interval = '7 days';
    let dateFormat = 'YYYY-MM-DD';
    
    switch (period) {
      case '30days':
        interval = '30 days';
        break;
      case '90days':
        interval = '90 days';
        break;
      case '1year':
        interval = '1 year';
        dateFormat = 'YYYY-MM';
        break;
      default:
        interval = '7 days';
    }

    // Get uploads over time
    const uploadsOverTimeResult = await query(`
      SELECT 
        TO_CHAR(created_at, $1) as date,
        COUNT(*) as count
      FROM study_materials
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY TO_CHAR(created_at, $1)
      ORDER BY date
    `, [dateFormat]);

    // Get downloads over time
    const downloadsOverTimeResult = await query(`
      SELECT 
        TO_CHAR(sm.updated_at, $1) as date,
        SUM(sm.download_count) as count
      FROM study_materials sm
      WHERE sm.updated_at >= NOW() - INTERVAL '${interval}'
      GROUP BY TO_CHAR(sm.updated_at, $1)
      ORDER BY date
    `, [dateFormat]);

    // Get resources by type
    const resourcesByTypeResult = await query(`
      SELECT category as type, COUNT(*) as count
      FROM study_materials
      WHERE status = 'approved'
      GROUP BY category
    `);

    // Get resources by program
    const resourcesByProgramResult = await query(`
      SELECT 
        p.name as program,
        p.code,
        COUNT(sm.id) as count
      FROM programs p
      LEFT JOIN courses c ON c.program_id = p.id
      LEFT JOIN study_materials sm ON sm.course_id = c.id AND sm.status = 'approved'
      GROUP BY p.id, p.name, p.code
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      status: 'success',
      data: {
        uploadsOverTime: uploadsOverTimeResult.rows,
        downloadsOverTime: downloadsOverTimeResult.rows,
        resourcesByType: resourcesByTypeResult.rows,
        resourcesByProgram: resourcesByProgramResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with pagination and filters
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (role) {
      whereConditions.push(`u.role = $${paramCount++}`);
      params.push(role);
    }

    if (status) {
      const isActive = status === 'active';
      whereConditions.push(`u.is_active = $${paramCount++}`);
      params.push(isActive);
    }

    if (search) {
      whereConditions.push(`(
        u.first_name ILIKE $${paramCount} OR 
        u.last_name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get users
    params.push(limit, offset);
    const usersResult = await query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, 
        u.current_year, u.current_semester, u.created_at, u.is_class_rep,
        p.name as program_name, p.code as program_code
       FROM users u
       LEFT JOIN programs p ON u.program_id = p.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      params
    );

    res.json({
      status: 'success',
      data: {
        users: usersResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status (activate/deactivate)
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== 'boolean') {
      throw new AppError('Status must be true or false', 400);
    }

    const result = await query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, is_active',
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      message: `User ${status ? 'activated' : 'deactivated'} successfully`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['student', 'admin'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      message: 'User role updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user class rep status
 */
export const updateClassRepStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isClassRep } = req.body;

    if (typeof isClassRep !== 'boolean') {
      throw new AppError('isClassRep must be a boolean value', 400);
    }

    const result = await query(
      'UPDATE users SET is_class_rep = $1 WHERE id = $2 RETURNING id, email, first_name, last_name, is_class_rep',
      [isClassRep, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      message: `User ${isClassRep ? 'granted' : 'revoked'} class representative privileges`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all resources with pagination and filters
 */
export const getResources = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, search, academic_year } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (status) {
      whereConditions.push(`sm.status = $${paramCount++}`);
      params.push(status);
    }

    if (type) {
      whereConditions.push(`sm.category = $${paramCount++}`);
      params.push(type);
    }

    if (academic_year) {
      whereConditions.push(`c.academic_year = $${paramCount++}`);
      params.push(academic_year);
    }

    if (search) {
      whereConditions.push(`(
        sm.title ILIKE $${paramCount} OR 
        sm.description ILIKE $${paramCount} OR
        c.unit_code ILIKE $${paramCount} OR
        c.unit_title ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM study_materials sm
       JOIN courses c ON sm.course_id = c.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get resources
    params.push(limit, offset);
    const resourcesResult = await query(
      `SELECT 
        sm.id, sm.title, sm.description, sm.category as type, sm.file_url as file_path, sm.file_size,
        sm.status, sm.download_count, sm.created_at,
        sm.rejection_reason, sm.approved_at as reviewed_at, sm.approved_by as reviewed_by,
        c.unit_code, c.unit_title, c.academic_year, c.semester,
        u.first_name as uploader_first_name, u.last_name as uploader_last_name,
        u.email as uploader_email,
        p.name as program_name, p.code as program_code, p.level,
        reviewer.first_name as reviewer_first_name, reviewer.last_name as reviewer_last_name
       FROM study_materials sm
       JOIN courses c ON sm.course_id = c.id
       JOIN users u ON sm.uploader_id = u.id
       JOIN programs p ON c.program_id = p.id
       LEFT JOIN users reviewer ON sm.approved_by = reviewer.id
       ${whereClause}
       ORDER BY sm.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      params
    );

    res.json({
      status: 'success',
      data: {
        resources: resourcesResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a resource
 */
export const approveResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE study_materials 
       SET status = 'approved', 
           approved_by = $1, 
           approved_at = NOW(),
           rejection_reason = NULL
       WHERE id = $2 
       RETURNING id, title, status`,
      [userId, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    res.json({
      status: 'success',
      message: 'Resource approved successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a resource
 */
export const rejectResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason || reason.trim().length === 0) {
      throw new AppError('Rejection reason is required', 400);
    }

    const result = await query(
      `UPDATE study_materials 
       SET status = 'rejected', 
           approved_by = $1, 
           approved_at = NOW(),
           rejection_reason = $2
       WHERE id = $3 
       RETURNING id, title, status, rejection_reason`,
      [userId, reason, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    res.json({
      status: 'success',
      message: 'Resource rejected successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a resource
 */
export const deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;

    // First, get the file URL to delete the file from storage if needed
    const fileResult = await query(
      'SELECT file_url, cloudinary_public_id FROM study_materials WHERE id = $1',
      [id]
    );

    if (fileResult.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    // Delete the record
    await query('DELETE FROM study_materials WHERE id = $1', [id]);

    res.json({
      status: 'success',
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk approve resources
 */
export const bulkApproveResources = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Resource IDs array is required', 400);
    }

    const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
    
    const result = await query(
      `UPDATE study_materials 
       SET status = 'approved', 
           approved_by = $1, 
           approved_at = NOW(),
           rejection_reason = NULL
       WHERE id IN (${placeholders})
       RETURNING id`,
      [userId, ...ids]
    );

    res.json({
      status: 'success',
      message: `${result.rows.length} resources approved successfully`,
      data: { count: result.rows.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk reject resources
 */
export const bulkRejectResources = async (req, res, next) => {
  try {
    const { ids, reason } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Resource IDs array is required', 400);
    }

    if (!reason || reason.trim().length === 0) {
      throw new AppError('Rejection reason is required', 400);
    }

    const placeholders = ids.map((_, i) => `$${i + 3}`).join(', ');
    
    const result = await query(
      `UPDATE study_materials 
       SET status = 'rejected', 
           approved_by = $1, 
           approved_at = NOW(),
           rejection_reason = $2
       WHERE id IN (${placeholders})
       RETURNING id`,
      [userId, reason, ...ids]
    );

    res.json({
      status: 'success',
      message: `${result.rows.length} resources rejected successfully`,
      data: { count: result.rows.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all programs with pagination and filters
 */
export const getPrograms = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, school_id } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`(
        p.name ILIKE $${paramCount} OR 
        p.code ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (school_id) {
      whereConditions.push(`d.school_id = $${paramCount++}`);
      params.push(school_id);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM programs p
       LEFT JOIN departments d ON p.department_id = d.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get programs
    params.push(limit, offset);
    const programsResult = await query(
      `SELECT 
        p.id, p.name, p.code, p.description, p.duration_years, p.created_at,
        d.name as department_name, d.id as department_id,
        s.name as school_name, s.id as school_id,
        COUNT(DISTINCT c.id) as course_count
       FROM programs p
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN schools s ON d.school_id = s.id
       LEFT JOIN courses c ON c.program_id = p.id
       ${whereClause}
       GROUP BY p.id, d.name, d.id, s.name, s.id
       ORDER BY p.name
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      params
    );

    res.json({
      status: 'success',
      data: {
        programs: programsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new program
 */
export const createProgram = async (req, res, next) => {
  try {
    const { name, code, description, duration_years, department_id } = req.body;

    if (!name || !code || !department_id) {
      throw new AppError('Name, code, and department are required', 400);
    }

    // Check if code already exists
    const existingProgram = await query(
      'SELECT id FROM programs WHERE code = $1',
      [code]
    );

    if (existingProgram.rows.length > 0) {
      throw new AppError('Program code already exists', 400);
    }

    const result = await query(
      `INSERT INTO programs (name, code, description, duration_years, department_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, code, description, duration_years, department_id`,
      [name, code, description, duration_years || 4, department_id]
    );

    res.status(201).json({
      status: 'success',
      message: 'Program created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a program
 */
export const updateProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, duration_years, department_id } = req.body;

    // Check if program exists
    const existingProgram = await query(
      'SELECT id FROM programs WHERE id = $1',
      [id]
    );

    if (existingProgram.rows.length === 0) {
      throw new AppError('Program not found', 404);
    }

    // Check if new code conflicts with another program
    if (code) {
      const codeConflict = await query(
        'SELECT id FROM programs WHERE code = $1 AND id != $2',
        [code, id]
      );

      if (codeConflict.rows.length > 0) {
        throw new AppError('Program code already exists', 400);
      }
    }

    const result = await query(
      `UPDATE programs 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           description = COALESCE($3, description),
           duration_years = COALESCE($4, duration_years),
           department_id = COALESCE($5, department_id)
       WHERE id = $6
       RETURNING id, name, code, description, duration_years, department_id`,
      [name, code, description, duration_years, department_id, id]
    );

    res.json({
      status: 'success',
      message: 'Program updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a program
 */
export const deleteProgram = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if program has courses
    const coursesResult = await query(
      'SELECT COUNT(*) as count FROM courses WHERE program_id = $1',
      [id]
    );

    if (parseInt(coursesResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete program with existing courses', 400);
    }

    const result = await query(
      'DELETE FROM programs WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Program not found', 404);
    }

    res.json({
      status: 'success',
      message: 'Program deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all courses with pagination and filters
 */
export const getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, program_id, level } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`(
        c.unit_code ILIKE $${paramCount} OR 
        c.unit_title ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (program_id) {
      whereConditions.push(`c.program_id = $${paramCount++}`);
      params.push(program_id);
    }

    if (level) {
      whereConditions.push(`p.level = $${paramCount++}`);
      params.push(level);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM courses c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get courses
    params.push(limit, offset);
    const coursesResult = await query(
      `SELECT 
        c.id, c.unit_code, c.unit_title, c.academic_year, c.semester, c.credits, c.created_at,
        p.name as program_name, p.code as program_code, p.id as program_id, p.level,
        COUNT(DISTINCT sm.id) as resource_count
       FROM courses c
       JOIN programs p ON c.program_id = p.id
       LEFT JOIN study_materials sm ON sm.course_id = c.id
       ${whereClause}
       GROUP BY c.id, p.name, p.code, p.id, p.level
       ORDER BY c.unit_code
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      params
    );

    res.json({
      status: 'success',
      data: {
        courses: coursesResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new course
 */
export const createCourse = async (req, res, next) => {
  try {
    const { unit_code, unit_title, level, semester, credits, program_id } = req.body;

    if (!unit_code || !unit_title || !program_id) {
      throw new AppError('Unit code, title, and program are required', 400);
    }

    // Check if unit code already exists
    const existingCourse = await query(
      'SELECT id FROM courses WHERE unit_code = $1',
      [unit_code]
    );

    if (existingCourse.rows.length > 0) {
      throw new AppError('Unit code already exists', 400);
    }

    const result = await query(
      `INSERT INTO courses (unit_code, unit_title, level, semester, credits, program_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, unit_code, unit_title, level, semester, credits, program_id`,
      [unit_code, unit_title, level, semester, credits || 3, program_id]
    );

    res.status(201).json({
      status: 'success',
      message: 'Course created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a course
 */
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { unit_code, unit_title, level, semester, credits, program_id } = req.body;

    // Check if course exists
    const existingCourse = await query(
      'SELECT id FROM courses WHERE id = $1',
      [id]
    );

    if (existingCourse.rows.length === 0) {
      throw new AppError('Course not found', 404);
    }

    // Check if new unit code conflicts with another course
    if (unit_code) {
      const codeConflict = await query(
        'SELECT id FROM courses WHERE unit_code = $1 AND id != $2',
        [unit_code, id]
      );

      if (codeConflict.rows.length > 0) {
        throw new AppError('Unit code already exists', 400);
      }
    }

    const result = await query(
      `UPDATE courses 
       SET unit_code = COALESCE($1, unit_code),
           unit_title = COALESCE($2, unit_title),
           level = COALESCE($3, level),
           semester = COALESCE($4, semester),
           credits = COALESCE($5, credits),
           program_id = COALESCE($6, program_id)
       WHERE id = $7
       RETURNING id, unit_code, unit_title, level, semester, credits, program_id`,
      [unit_code, unit_title, level, semester, credits, program_id, id]
    );

    res.json({
      status: 'success',
      message: 'Course updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a course
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if course has study materials
    const materialsResult = await query(
      'SELECT COUNT(*) as count FROM study_materials WHERE course_id = $1',
      [id]
    );

    if (parseInt(materialsResult.rows[0].count) > 0) {
      throw new AppError('Cannot delete course with existing study materials', 400);
    }

    const result = await query(
      'DELETE FROM courses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Course not found', 404);
    }

    res.json({
      status: 'success',
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all departments for dropdown
 */
export const getDepartments = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT d.id, d.name, d.code, s.name as school_name, s.id as school_id
      FROM departments d
      JOIN schools s ON d.school_id = s.id
      ORDER BY s.name, d.name
    `);

    res.json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get programs for dropdown (simplified)
 */
export const getProgramsDropdown = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT p.id, p.name, p.code
      FROM programs p
      ORDER BY p.name
    `);

    res.json({
      status: 'success',
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Get system settings
 */
export const getSettings = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM system_settings');
    
    // Convert to object format
    const settings = result.rows.reduce((acc, row) => {
      acc[row.setting_key] = {
        value: row.setting_value === 'true' ? true : row.setting_value === 'false' ? false : row.setting_value,
        description: row.description,
        updated_at: row.updated_at
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update system setting
 */
export const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const userId = req.user.id;

    if (!key || value === undefined) {
      throw new AppError('Setting key and value are required', 400);
    }

    // Update or insert setting
    const result = await query(
      `INSERT INTO system_settings (setting_key, setting_value, updated_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, String(value), userId]
    );

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: {
        key: result.rows[0].setting_key,
        value: result.rows[0].setting_value === 'true' ? true : result.rows[0].setting_value === 'false' ? false : result.rows[0].setting_value
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get downloads enabled status (public endpoint)
 */
export const getDownloadsEnabled = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'downloads_enabled'`
    );

    const enabled = result.rows.length > 0 ? result.rows[0].setting_value === 'true' : true;

    res.json({
      success: true,
      data: {
        downloads_enabled: enabled
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get max file size setting (public endpoint)
 */
export const getMaxFileSize = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'max_file_size'`
    );

    // Default to 10MB if not set
    const maxFileSize = result.rows.length > 0 
      ? parseInt(result.rows[0].setting_value) 
      : parseInt(process.env.MAX_FILE_SIZE) || 10485760;

    res.json({
      success: true,
      data: {
        max_file_size: maxFileSize,
        max_file_size_mb: (maxFileSize / 1024 / 1024).toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload file (for notifications, etc.)
 */
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Return file URL
    res.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        resourceType: req.file.resource_type,
        format: req.file.format,
        size: req.file.bytes
      }
    });
  } catch (error) {
    next(error);
  }
};
