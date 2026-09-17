import axios from 'axios';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Map MIME types to file extensions so proxied URLs/filenames carry a real extension.
// Microsoft Office Viewer detects file type from the URL/name, so an extensionless
// document (e.g. Cloudinary raw URLs that drop the extension) is treated as invalid.
const MIME_EXTENSIONS = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.oasis.opendocument.text': '.odt',
  'application/vnd.oasis.opendocument.spreadsheet': '.ods',
  'application/vnd.oasis.opendocument.presentation': '.odp',
  'text/plain': '.txt',
  'text/html': '.html',
  'text/csv': '.csv',
  'application/json': '.json',
};

// Build a safe filename, appending the MIME-appropriate extension when missing
const buildFileName = (mimeType, baseName) => {
  const extension = MIME_EXTENSIONS?.[mimeType?.toLowerCase()] || '';
  let filename = (baseName || 'file').replace(/["\\]/g, '_');
  if (extension && !/\.[a-z0-9]{1,5}$/i.test(filename)) {
    filename = `${filename}${extension}`;
  }
  return filename;
};

/**
 * Proxy file viewing - serves files inline for reading
 * This prevents forced downloads from Cloudinary
 */
export const viewFile = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user?.id; // Optional auth
    const requestedFilename = req.params.filename || null;

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

    // Prefer the MIME type stored in the database - Cloudinary raw uploads often
    // return application/octet-stream, which breaks viewers that sniff content type
    const contentType = resource.file_type || response.headers['content-type'] || 'application/octet-stream';

    // Use a filename with a real extension so external viewers can identify the file
    const filename = buildFileName(contentType, requestedFilename || resource.title);

    // Set headers for inline viewing (not download)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
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

    // Get content type - prefer DB type since Cloudinary raw files often report octet-stream
    const contentType = resource.file_type || response.headers['content-type'] || 'application/octet-stream';

    // Use a filename with a real extension
    const filename = buildFileName(contentType, resource.title);

    // Set headers for download (attachment)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
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
