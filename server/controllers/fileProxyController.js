import axios from 'axios';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Proxy file viewing - serves files inline for reading
 * This prevents forced downloads from Cloudinary
 */
export const viewFile = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user?.id; // Optional auth

    // Get file details from database
    const result = await query(
      'SELECT file_url, file_type, cloudinary_public_id, title FROM study_materials WHERE id = $1',
      [resourceId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    const resource = result.rows[0];
    const fileUrl = resource.file_url;

    if (!fileUrl) {
      throw new AppError('File URL not found', 404);
    }

    // Fetch file from Cloudinary
    const response = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream',
      timeout: 30000 // 30 second timeout
    });

    // Get content type from Cloudinary response or database
    const contentType = response.headers['content-type'] || resource.file_type || 'application/octet-stream';

    // Set headers for inline viewing (not download)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${resource.title}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // CORS headers for cross-origin embedding
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // For PDFs, add additional headers
    if (contentType === 'application/pdf') {
      res.setHeader('Accept-Ranges', 'bytes');
    }

    // Stream the file to the client
    response.data.pipe(res);

    // Handle stream errors
    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });

  } catch (error) {
    if (error.response?.status === 404) {
      next(new AppError('File not found on storage', 404));
    } else {
      next(error);
    }
  }
};

/**
 * Proxy file download - serves files with attachment header
 */
export const downloadFile = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user?.id;

    // Check if downloads are enabled
    const settingsResult = await query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'downloads_enabled'`
    );

    const downloadsEnabled = settingsResult.rows.length > 0 
      ? settingsResult.rows[0].setting_value === 'true' 
      : true;

    if (!downloadsEnabled) {
      throw new AppError('Downloads are currently disabled', 403);
    }

    // Get file details from database
    const result = await query(
      'SELECT file_url, file_type, cloudinary_public_id, title FROM study_materials WHERE id = $1',
      [resourceId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }

    const resource = result.rows[0];
    const fileUrl = resource.file_url;

    if (!fileUrl) {
      throw new AppError('File URL not found', 404);
    }

    // Fetch file from Cloudinary
    const response = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream',
      timeout: 60000 // 60 second timeout for large files
    });

    // Get content type
    const contentType = response.headers['content-type'] || resource.file_type || 'application/octet-stream';

    // Set headers for download (attachment)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${resource.title}"`);
    
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    // Stream the file to the client
    response.data.pipe(res);

    // Increment download count after successful stream start
    try {
      await query(
        'UPDATE study_materials SET download_count = download_count + 1 WHERE id = $1',
        [resourceId]
      );
    } catch (countError) {
      console.error('Error updating download count:', countError);
    }

    // Handle stream errors
    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });

  } catch (error) {
    if (error.response?.status === 404) {
      next(new AppError('File not found on storage', 404));
    } else {
      next(error);
    }
  }
};
