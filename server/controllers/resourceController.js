import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { emitToCourse, emitToUser, emitToRole } from '../config/socket.js';

/**
 * Upload new study material
 */
export const uploadResource = async (req, res, next) => {
  try {
    const { title, description, type, unitCode, unitName, yearOfStudy, semester, academicYear, courseId, category } = req.body;
    const uploaderId = req.user.id;

    // Validate file upload
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Validate title
    if (!title || !title.trim()) {
      throw new AppError('Title is required', 400);
    }

    // Determine the category to use
    let finalCategory = category;
    
    // If no category provided, map from type
    if (!finalCategory && type) {
      const typeToCategory = {
        'notes': 'notes',
        'assignment': 'cat',
        'pastpaper': 'past_paper',
        'video': 'notes',
        'other': 'notes'
      };
      finalCategory = typeToCategory[type] || 'notes';
    }
    
    // Default to 'notes' if still not set
    finalCategory = finalCategory || 'notes';

    let finalCourseId;

    // Method 1: Direct courseId (from UploadModal on Dashboard)
    if (courseId) {
      const courseCheck = await query(
        'SELECT id FROM courses WHERE id = $1',
        [parseInt(courseId)]
      );
      
      if (courseCheck.rows.length === 0) {
        throw new AppError('Course not found', 404);
      }
      
      finalCourseId = parseInt(courseId);
    } 
    // Method 2: Unit details (from old upload form)
    else if (unitCode && yearOfStudy && semester) {
      // Validate required fields for old method
      if (!unitName || !academicYear) {
        throw new AppError('unitName and academicYear are required when using unitCode method', 400);
      }

      // Validate academic year format
      if (!academicYear.match(/^\d{4}\/\d{4}$/)) {
        throw new AppError('Academic year must be in format YYYY/YYYY (e.g., 2026/2027)', 400);
      }

      // Validate year and semester
      if (!['1', '2', '3', '4', '5'].includes(yearOfStudy)) {
        throw new AppError('Year of study must be between 1 and 5', 400);
      }
      
      if (!['1', '2'].includes(semester)) {
        throw new AppError('Semester must be 1 or 2', 400);
      }

      // Find or create course
      const courseCheck = await query(
        'SELECT id FROM courses WHERE unit_code = $1 AND academic_year = $2 AND semester = $3',
        [unitCode.toUpperCase(), parseInt(yearOfStudy), parseInt(semester)]
      );

      if (courseCheck.rows.length > 0) {
        finalCourseId = courseCheck.rows[0].id;
      } else {
        const userProgram = await query(
          'SELECT program_id FROM users WHERE id = $1',
          [uploaderId]
        );
        
        const programId = userProgram.rows[0]?.program_id || null;
        
        const newCourse = await query(
          `INSERT INTO courses (unit_code, unit_title, program_id, academic_year, semester, credits)
           VALUES ($1, $2, $3, $4, $5, 3)
           RETURNING id`,
          [unitCode.toUpperCase(), unitName, programId, parseInt(yearOfStudy), parseInt(semester)]
        );
        
        finalCourseId = newCourse.rows[0].id;
      }
    } else {
      throw new AppError('Either courseId or (unitCode, unitName, yearOfStudy, semester, academicYear) must be provided', 400);
    }

    // Insert study material
    const result = await query(
      `INSERT INTO study_materials 
       (course_id, uploader_id, title, description, category, file_url, cloudinary_public_id, file_size, file_type, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        finalCourseId,
        uploaderId,
        title,
        description || null,
        category,
        req.file.path,
        req.file.filename,
        req.file.size,
        req.file.mimetype.substring(0, 50), // Truncate to 50 chars for now
        'pending'
      ]
    );

    const material = result.rows[0];

    // Map category back to type for response
    const categoryToType = {
      'notes': 'notes',
      'cat': 'assignment',
      'past_paper': 'pastpaper',
      'practical_manual': 'notes',
      'quiz': 'assignment'
    };

    const responseData = {
      id: material.id,
      title: material.title,
      description: material.description,
      type: categoryToType[material.category] || 'notes',
      category: material.category,
      fileUrl: material.file_url,
      fileSize: material.file_size,
      fileType: material.file_type,
      status: material.status,
      academicYear: material.academic_year,
      createdAt: material.created_at,
      uploadedBy: {
        id: uploaderId,
        name: `${req.user.first_name} ${req.user.last_name}`
      },
      course: {
        unitCode: unitCode?.toUpperCase(),
        unitTitle: unitName,
        year: yearOfStudy ? parseInt(yearOfStudy) : null,
        semester: semester ? parseInt(semester) : null
      }
    };

    // Emit socket event to course room (for real-time updates)
    try {
      emitToCourse(finalCourseId, 'resource:uploaded', responseData);
      
      // Also notify admins and class reps about pending approval
      emitToRole('admin', 'resource:pending', {
        resourceId: material.id,
        title: material.title,
        uploader: responseData.uploadedBy,
        courseId: finalCourseId
      });
      
      emitToRole('class_rep', 'resource:pending', {
        resourceId: material.id,
        title: material.title,
        uploader: responseData.uploadedBy,
        courseId: finalCourseId
      });
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
      // Don't fail the request if socket emit fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Resource uploaded successfully and is pending approval',
      data: responseData
    });
  } catch (error) {
    // If there was an error and file was uploaded, delete it from Cloudinary
    if (req.file && req.file.filename) {
      try {
        await deleteFromCloudinary(req.file.filename);
      } catch (deleteError) {
        console.error('Error deleting file from Cloudinary:', deleteError);
      }
    }
    next(error);
  }
};

/**
 * Get resources by course ID with optional category filter
 */
export const getResourcesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { category, status = 'approved' } = req.query;
    const userId = req.user?.id; // Get the current user ID

    // Build query - show approved resources OR resources uploaded by current user
    let queryText = `
      SELECT 
        sm.id, sm.title, sm.description, sm.category, sm.file_url, 
        sm.file_size, sm.file_type, sm.status, sm.download_count,
        sm.created_at, sm.updated_at, sm.uploader_id,
        u.first_name as uploader_first_name, 
        u.last_name as uploader_last_name,
        c.unit_code, c.unit_title
      FROM study_materials sm
      JOIN users u ON sm.uploader_id = u.id
      JOIN courses c ON sm.course_id = c.id
      WHERE sm.course_id = $1 
        AND (sm.status = $2 OR sm.uploader_id = $3)
    `;

    const params = [courseId, status, userId];

    if (category) {
      queryText += ` AND sm.category = $4`;
      params.push(category);
    }

    queryText += ` ORDER BY sm.created_at DESC`;

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.category, // Frontend expects 'type'
        category: row.category,
        fileUrl: row.file_url,
        fileSize: row.file_size,
        fileType: row.file_type,
        status: row.status,
        downloads: row.download_count, // Frontend expects 'downloads'
        downloadCount: row.download_count,
        uploadedBy: {
          name: `${row.uploader_first_name} ${row.uploader_last_name}`,
          firstName: row.uploader_first_name,
          lastName: row.uploader_last_name
        },
        uploader: {
          firstName: row.uploader_first_name,
          lastName: row.uploader_last_name
        },
        isOwnUpload: row.uploader_id === userId, // Flag to identify own uploads
        course: {
          unitCode: row.unit_code, // Frontend expects 'unitCode'
          code: row.unit_code,
          unitTitle: row.unit_title, // Frontend expects 'unitTitle'
          title: row.unit_title
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending resources (for class reps and admins)
 */
export const getPendingResources = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        sm.id, sm.title, sm.description, sm.category, sm.file_url, 
        sm.file_size, sm.file_type, sm.created_at,
        u.first_name as uploader_first_name, 
        u.last_name as uploader_last_name,
        u.email as uploader_email,
        c.unit_code, c.unit_title, c.academic_year, c.semester,
        p.name as program_name, p.code as program_code
      FROM study_materials sm
      JOIN users u ON sm.uploader_id = u.id
      JOIN courses c ON sm.course_id = c.id
      JOIN programs p ON c.program_id = p.id
      WHERE sm.status = 'pending'
      ORDER BY sm.created_at ASC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.category, // Frontend expects 'type'
        category: row.category,
        fileUrl: row.file_url,
        fileSize: row.file_size,
        fileType: row.file_type,
        uploader: {
          firstName: row.uploader_first_name,
          lastName: row.uploader_last_name,
          email: row.uploader_email
        },
        course: {
          unitCode: row.unit_code, // Frontend expects 'unitCode'
          code: row.unit_code,
          unitTitle: row.unit_title, // Frontend expects 'unitTitle'
          title: row.unit_title,
          year: row.academic_year,
          semester: row.semester
        },
        program: {
          name: row.program_name,
          code: row.program_code
        },
        createdAt: row.created_at
      }))
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
    const approverId = req.user.id;

    // Check if resource exists and is pending
    const resourceCheck = await query(
      `SELECT sm.id, sm.status, sm.title, sm.course_id, sm.uploader_id, sm.category, sm.file_url, sm.created_at,
              u.first_name, u.last_name
       FROM study_materials sm
       JOIN users u ON sm.uploader_id = u.id
       WHERE sm.id = $1`,
      [id]
    );

    if (resourceCheck.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    const resource = resourceCheck.rows[0];

    if (resource.status !== 'pending') {
      throw new AppError('Resource is not pending approval', 400);
    }

    // Approve the resource
    const result = await query(
      `UPDATE study_materials 
       SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [approverId, id]
    );

    const categoryToType = {
      'notes': 'notes',
      'cat': 'assignment',
      'past_paper': 'pastpaper',
      'practical_manual': 'notes',
      'quiz': 'assignment'
    };

    const approvedResource = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      type: categoryToType[result.rows[0].category] || 'notes',
      category: result.rows[0].category,
      fileUrl: result.rows[0].file_url,
      fileSize: result.rows[0].file_size,
      fileType: result.rows[0].file_type,
      status: result.rows[0].status,
      approvedAt: result.rows[0].approved_at,
      createdAt: result.rows[0].created_at,
      uploadedBy: {
        id: resource.uploader_id,
        name: `${resource.first_name} ${resource.last_name}`
      }
    };

    // Emit socket events for real-time updates
    try {
      // Notify the course room (all students viewing that course)
      emitToCourse(resource.course_id, 'resource:approved', approvedResource);
      
      // Notify the uploader specifically
      emitToUser(resource.uploader_id, 'resource:approved', {
        ...approvedResource,
        message: `Your resource "${resource.title}" has been approved!`
      });
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
    }

    res.json({
      success: true,
      message: 'Resource approved successfully',
      data: approvedResource
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
    const approverId = req.user.id;

    if (!reason) {
      throw new AppError('Rejection reason is required', 400);
    }

    // Check if resource exists and is pending
    const resourceCheck = await query(
      `SELECT sm.id, sm.status, sm.cloudinary_public_id, sm.title, sm.course_id, sm.uploader_id,
              u.first_name, u.last_name
       FROM study_materials sm
       JOIN users u ON sm.uploader_id = u.id
       WHERE sm.id = $1`,
      [id]
    );

    if (resourceCheck.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    const resource = resourceCheck.rows[0];

    if (resource.status !== 'pending') {
      throw new AppError('Resource is not pending approval', 400);
    }

    // Reject the resource
    const result = await query(
      `UPDATE study_materials 
       SET status = 'rejected', approved_by = $1, rejection_reason = $2, approved_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [approverId, reason, id]
    );

    const rejectedData = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      status: result.rows[0].status,
      rejectionReason: result.rows[0].rejection_reason,
      uploadedBy: {
        id: resource.uploader_id,
        name: `${resource.first_name} ${resource.last_name}`
      }
    };

    // Emit socket event to notify uploader
    try {
      emitToUser(resource.uploader_id, 'resource:rejected', {
        ...rejectedData,
        message: `Your resource "${resource.title}" was rejected. Reason: ${reason}`
      });
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
    }

    // Optionally delete from Cloudinary
    // Uncomment if you want to delete rejected files
    // try {
    //   await deleteFromCloudinary(resource.cloudinary_public_id);
    // } catch (deleteError) {
    //   console.error('Error deleting rejected file:', deleteError);
    // }

    res.json({
      success: true,
      message: 'Resource rejected',
      data: rejectedData
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
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get resource details
    const resourceCheck = await query(
      'SELECT id, uploader_id, cloudinary_public_id FROM study_materials WHERE id = $1',
      [id]
    );

    if (resourceCheck.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    const resource = resourceCheck.rows[0];

    // Check permissions: only uploader or admin can delete
    if (resource.uploader_id !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized to delete this resource', 403);
    }

    // Delete from database
    await query('DELETE FROM study_materials WHERE id = $1', [id]);

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(resource.cloudinary_public_id);
    } catch (deleteError) {
      console.error('Error deleting file from Cloudinary:', deleteError);
      // Continue even if Cloudinary deletion fails
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Increment download count
 */
export const incrementDownloadCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    await query(
      'UPDATE study_materials SET download_count = download_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Download count updated'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's uploaded resources
 */
export const getMyUploads = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT 
        sm.id, sm.title, sm.description, sm.category, sm.file_url, 
        sm.file_size, sm.status, sm.download_count, sm.rejection_reason,
        sm.created_at, sm.approved_at,
        c.unit_code, c.unit_title
      FROM study_materials sm
      JOIN courses c ON sm.course_id = c.id
      WHERE sm.uploader_id = $1
      ORDER BY sm.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        type: row.category, // Frontend expects 'type'
        category: row.category,
        fileUrl: row.file_url,
        fileSize: row.file_size,
        status: row.status,
        downloads: row.download_count, // Frontend expects 'downloads'
        downloadCount: row.download_count,
        rejectionReason: row.rejection_reason,
        course: {
          unitCode: row.unit_code, // Frontend expects 'unitCode'
          code: row.unit_code,
          unitTitle: row.unit_title, // Frontend expects 'unitTitle'
          title: row.unit_title
        },
        createdAt: row.created_at,
        approvedAt: row.approved_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update resource metadata (title, description, type)
 */
export const updateResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;
    const userId = req.user.id;

    // Validate at least one field to update
    if (!title && !description && !type) {
      throw new AppError('At least one field (title, description, or type) is required', 400);
    }

    // Check if resource exists and user owns it
    const resourceCheck = await query(
      'SELECT uploader_id FROM study_materials WHERE id = $1',
      [id]
    );

    if (resourceCheck.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    if (resourceCheck.rows[0].uploader_id !== userId) {
      throw new AppError('You can only edit your own uploads', 403);
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['notes', 'assignment', 'pastpaper', 'video', 'other'];
      if (!validTypes.includes(type)) {
        throw new AppError('Invalid resource type', 400);
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    // Update resource
    const result = await query(
      `UPDATE study_materials 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    res.status(200).json({
      status: 'success',
      message: 'Resource updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
