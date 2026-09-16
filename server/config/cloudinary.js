import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import { query } from './database.js';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get max file size from database or environment variable
const getMaxFileSize = async () => {
  try {
    const result = await query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'max_file_size'`
    );
    
    if (result.rows.length > 0) {
      const sizeFromDb = parseInt(result.rows[0].setting_value);
      console.log(`📏 Max file size from database: ${(sizeFromDb / 1024 / 1024).toFixed(2)}MB`);
      return sizeFromDb;
    }
  } catch (error) {
    console.warn('Could not fetch max_file_size from database, using environment variable');
  }
  
  // Fallback to environment variable
  const sizeFromEnv = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB default
  console.log(`📏 Max file size from .env: ${(sizeFromEnv / 1024 / 1024).toFixed(2)}MB`);
  return sizeFromEnv;
};

// Cache the max file size (updated every 5 minutes)
let cachedMaxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedMaxFileSize = async () => {
  const now = Date.now();
  if (now - lastFetchTime > CACHE_DURATION) {
    cachedMaxFileSize = await getMaxFileSize();
    lastFetchTime = now;
  }
  return cachedMaxFileSize;
};

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file mimetype
    let resourceType = 'raw'; // Default for documents and archives
    let format = undefined; // Let Cloudinary auto-detect
    
    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      resourceType = 'video'; // Cloudinary uses 'video' for audio files
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    
    return {
      folder: process.env.CLOUDINARY_FOLDER || 'mut_study_hub_docs',
      resource_type: resourceType,
      public_id: `${originalName}_${timestamp}`,
      format: format,
      // Allow any file type for raw resources
      allowedFormats: resourceType === 'raw' ? undefined : null,
    };
  }
});

// Configure Multer middleware with dynamic file size checking
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: cachedMaxFileSize // Initial value from cache
  },
  fileFilter: (req, file, cb) => {
    // Comprehensive list of allowed MIME types for study materials
    const allowedMimes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html', // For user-created text content
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
      // Presentations
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.presentation',
      // Spreadsheets
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.oasis.opendocument.spreadsheet',
      // Archives
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/svg+xml',
      'image/webp',
      // Videos
      'video/mp4',
      'video/x-msvideo',
      'video/quicktime',
      'video/x-ms-wmv',
      'video/x-flv',
      'video/x-matroska',
      'video/webm',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/aac'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Please upload documents, presentations, spreadsheets, images, videos, or archives.`), false);
    }
  }
});

// Middleware to dynamically check file size before upload
export const checkFileSize = async (req, res, next) => {
  try {
    // Update cached max file size
    const maxFileSize = await getCachedMaxFileSize();
    
    // Update multer's limits
    upload.limits.fileSize = maxFileSize;
    
    next();
  } catch (error) {
    console.error('Error checking file size limit:', error);
    next(); // Continue with cached value
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get file info from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'raw'
    });
    return result;
  } catch (error) {
    console.error('Error getting file info from Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;
