import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateSummary, generateSummaryWithUploadedFile } from '../services/geminiService.js';
import fs from 'fs';

/**
 * Summarize a resource using AI
 * Now accepts file upload from client
 */
export const summarizeResource = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { resourceId } = req.body;

    // Validate input
    if (!resourceId) {
      throw new AppError('Resource ID is required', 400);
    }

    // Check if user has advanced features enabled
    const userCheck = await query(
      'SELECT advanced_features_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    if (!userCheck.rows[0].advanced_features_enabled) {
      throw new AppError('Advanced features are not enabled. Please enable them in Settings.', 403);
    }

    // Get resource details
    const resourceResult = await query(
      `SELECT 
        sm.id, sm.title, sm.description, sm.file_type, sm.file_url, sm.cloudinary_public_id,
        c.unit_code, c.unit_title
       FROM study_materials sm
       LEFT JOIN courses c ON sm.course_id = c.id
       WHERE sm.id = $1`,
      [resourceId]
    );

    if (resourceResult.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    const resource = resourceResult.rows[0];

    // Check if user already has a recent summary for this resource (within last 24 hours)
    const existingSummary = await query(
      `SELECT id, summary_text, created_at 
       FROM ai_summaries 
       WHERE user_id = $1 AND resource_id = $2 
       AND created_at > NOW() - INTERVAL '24 hours'
       AND status = 'completed'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, resourceId]
    );

    if (existingSummary.rows.length > 0) {
      // Return existing summary
      return res.json({
        success: true,
        message: 'Using existing summary from last 24 hours',
        data: {
          summary: existingSummary.rows[0],
          isNew: false
        }
      });
    }

    // Check if file was uploaded by client
    if (!req.file) {
      throw new AppError('No file uploaded. Please try again.', 400);
    }

    console.log('📄 ===== FILE UPLOAD DEBUG =====');
    console.log(`📄 File received: ${req.file.originalname}`);
    console.log(`📊 File size: ${req.file.size} bytes (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`📎 MIME type: ${req.file.mimetype}`);
    console.log(`💾 Temp path: ${req.file.path}`);
    console.log(`🔍 File exists: ${fs.existsSync(req.file.path)}`);
    console.log('📄 ==============================');

    // Create initial summary record with 'processing' status
    const initialRecord = await query(
      `INSERT INTO ai_summaries (
        user_id, resource_id, summary_text, summary_length,
        original_filename, original_file_url, original_file_type,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        userId,
        resourceId,
        'Processing...', // Temporary placeholder
        0,
        resource.title,
        resource.file_url,
        resource.file_type,
        'processing'
      ]
    );

    const summaryId = initialRecord.rows[0].id;

    try {
      // Generate summary using Gemini API with uploaded file
      const startTime = Date.now();
      
      const summaryResult = await generateSummaryWithUploadedFile({
        filePath: req.file.path,
        fileType: resource.file_type,
        mimeType: req.file.mimetype,
        title: resource.title,
        description: resource.description,
        courseCode: resource.unit_code,
        courseTitle: resource.unit_title
      });

      const processingTime = Date.now() - startTime;

      // Update summary record with results
      const updateResult = await query(
        `UPDATE ai_summaries 
         SET summary_text = $1,
             summary_length = $2,
             tokens_used = $3,
             processing_time_ms = $4,
             ai_model = $5,
             status = 'completed',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [
          summaryResult.summary,
          summaryResult.summary.length,
          summaryResult.tokensUsed || null,
          processingTime,
          summaryResult.model || 'gemini-1.5-pro',
          summaryId
        ]
      );

      res.json({
        success: true,
        message: 'Summary generated successfully',
        data: {
          summary: updateResult.rows[0],
          isNew: true,
          hadFullText: summaryResult.hadFullText,
          extractionNote: summaryResult.extractionNote
        }
      });

      // Clean up uploaded file after successful response
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log(`🗑️ Cleaned up temp file: ${req.file.path}`);
      }

    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log(`🗑️ Cleaned up temp file after error: ${req.file.path}`);
      }
      
      // Update summary record with error
      await query(
        `UPDATE ai_summaries 
         SET status = 'failed',
             error_message = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [error.message, summaryId]
      );

      throw error;
    }

  } catch (error) {
    console.error('Error in summarizeResource:', error);
    next(error);
  }
};

/**
 * Get summary history for current user
 */
export const getSummaryHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let whereClause = 'WHERE s.user_id = $1';
    const params = [userId];

    if (status !== 'all') {
      whereClause += ' AND s.status = $2';
      params.push(status);
    }

    // Get summaries with resource details
    const result = await query(
      `SELECT 
        s.id, s.summary_text, s.summary_length, s.original_filename,
        s.original_file_type, s.ai_model, s.tokens_used, s.processing_time_ms,
        s.status, s.error_message, s.created_at,
        sm.id as resource_id, sm.title as resource_title, sm.file_url,
        c.unit_code, c.unit_title
       FROM ai_summaries s
       LEFT JOIN study_materials sm ON s.resource_id = sm.id
       LEFT JOIN courses c ON sm.course_id = c.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM ai_summaries s ${whereClause}`,
      params
    );

    const totalSummaries = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalSummaries / limit);

    res.json({
      success: true,
      data: {
        summaries: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalSummaries,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific summary by ID
 */
export const getSummaryById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      `SELECT 
        s.*, 
        sm.title as resource_title, sm.file_url, sm.file_type,
        c.unit_code, c.unit_title
       FROM ai_summaries s
       LEFT JOIN study_materials sm ON s.resource_id = sm.id
       LEFT JOIN courses c ON sm.course_id = c.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Summary not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a summary
 */
export const deleteSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if summary exists and belongs to user
    const checkResult = await query(
      'SELECT id FROM ai_summaries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('Summary not found', 404);
    }

    // Delete summary
    await query('DELETE FROM ai_summaries WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Summary deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get summary statistics for current user
 */
export const getSummaryStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT 
        COUNT(*) as total_summaries,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_summaries,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_summaries,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_summaries,
        COALESCE(SUM(tokens_used), 0) as total_tokens_used,
        COALESCE(AVG(processing_time_ms), 0)::INTEGER as avg_processing_time_ms,
        MAX(created_at) as last_summary_at
       FROM ai_summaries
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
