import axios from 'axios';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Extract text content from a file URL
 * @param {string} fileUrl - URL of the file
 * @param {string} fileType - Type of file (pdf, docx, txt, etc.)
 * @returns {Promise<string>} Extracted text content
 */
export const extractTextFromFile = async (fileUrl, fileType) => {
  try {
    console.log(`📄 Extracting text from ${fileType} file: ${fileUrl}`);

    // Download the file
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: 50 * 1024 * 1024 // 50MB max
    });

    const buffer = Buffer.from(response.data);
    const fileTypeLower = fileType.toLowerCase();

    // Extract text based on file type
    if (fileTypeLower === 'pdf') {
      return await extractTextFromPDF(buffer);
    } else if (fileTypeLower === 'docx' || fileTypeLower === 'doc') {
      return await extractTextFromDOCX(buffer);
    } else if (fileTypeLower === 'txt') {
      return buffer.toString('utf-8');
    } else if (fileTypeLower === 'pptx') {
      // For now, return a message - full PPTX parsing requires additional library
      return '[PowerPoint file - text extraction not fully implemented yet]';
    } else {
      throw new AppError(`Unsupported file type: ${fileType}`, 400);
    }

  } catch (error) {
    console.error('Error extracting text from file:', error);
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new AppError('File download timeout - file may be too large', 408);
    }
    
    if (error.response?.status === 404) {
      throw new AppError('File not found at the provided URL', 404);
    }
    
    if (error.response?.status === 403) {
      throw new AppError('Access denied to file URL', 403);
    }

    throw new AppError(error.message || 'Failed to extract text from file', 500);
  }
};

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdf(buffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new AppError('PDF appears to be empty or contains only images', 400);
    }

    console.log(`✅ Extracted ${data.text.length} characters from PDF (${data.numpages} pages)`);
    return data.text;

  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new AppError('Failed to extract text from PDF - file may be corrupted or image-based', 400);
  }
};

/**
 * Extract text from DOCX buffer
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>} Extracted text
 */
const extractTextFromDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new AppError('DOCX appears to be empty', 400);
    }

    console.log(`✅ Extracted ${result.value.length} characters from DOCX`);
    
    // Log any warnings
    if (result.messages && result.messages.length > 0) {
      console.log('DOCX extraction warnings:', result.messages);
    }

    return result.value;

  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new AppError('Failed to extract text from DOCX - file may be corrupted', 400);
  }
};

/**
 * Truncate text to a maximum length while preserving word boundaries
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length in characters
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 30000) => {
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '\n\n[Content truncated due to length...]';
  }

  return truncated + '\n\n[Content truncated due to length...]';
};

/**
 * Check if file type is supported for text extraction
 * @param {string} fileType - File type to check
 * @returns {boolean} True if supported
 */
export const isSupportedFileType = (fileType) => {
  const supported = ['pdf', 'docx', 'doc', 'txt'];
  return supported.includes(fileType.toLowerCase());
};

/**
 * Get text extraction capabilities for a file type
 * @param {string} fileType - File type
 * @returns {Object} Capabilities info
 */
export const getExtractionCapabilities = (fileType) => {
  const capabilities = {
    pdf: { supported: true, quality: 'high', notes: 'Full text extraction with page info' },
    docx: { supported: true, quality: 'high', notes: 'Full text extraction with formatting' },
    doc: { supported: true, quality: 'high', notes: 'Full text extraction' },
    txt: { supported: true, quality: 'perfect', notes: 'Direct text file' },
    pptx: { supported: false, quality: 'low', notes: 'Limited extraction - consider upgrading' },
    xlsx: { supported: false, quality: 'none', notes: 'Not supported' },
    png: { supported: false, quality: 'none', notes: 'Image files require OCR (not implemented)' },
    jpg: { supported: false, quality: 'none', notes: 'Image files require OCR (not implemented)' },
    jpeg: { supported: false, quality: 'none', notes: 'Image files require OCR (not implemented)' }
  };

  return capabilities[fileType.toLowerCase()] || { 
    supported: false, 
    quality: 'none', 
    notes: 'Unsupported file type' 
  };
};
