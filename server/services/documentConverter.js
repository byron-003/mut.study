import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Document Converter Service
 * Converts Word documents (.doc, .docx) to PDF before upload
 * 
 * Current Implementation:
 * - Uses Mammoth + PDF-lib for text extraction and PDF generation
 * - Works without external dependencies
 * - Preserves text content (formatting may be simplified)
 * 
 * Note: The docx-pdf package was initially planned for LibreOffice conversion
 * but is deprecated and requires PhantomJS (no longer maintained).
 * For production use with better formatting preservation, consider:
 * - Installing LibreOffice directly and using CLI conversion
 * - Using cloud-based conversion APIs (CloudConvert, etc.)
 * - Using modern packages like @fileforge/pandoc or officegen
 */

/**
 * Check if a file is a Word document
 * @param {string} mimetype - File mimetype
 * @param {string} originalname - Original filename
 * @returns {boolean}
 */
export const isWordDocument = (mimetype, originalname) => {
  const wordMimetypes = [
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];
  
  const wordExtensions = ['.doc', '.docx'];
  const extension = path.extname(originalname).toLowerCase();
  
  return wordMimetypes.includes(mimetype) || wordExtensions.includes(extension);
};

/**
 * Convert Word document to PDF using LibreOffice (Method 1 - Best Quality)
 * Note: This method requires LibreOffice to be installed on the system.
 * The docx-pdf package is deprecated and requires PhantomJS. This will likely fail.
 * @param {Buffer} fileBuffer - Word document buffer
 * @param {string} originalname - Original filename
 * @returns {Promise<{buffer: Buffer, success: boolean, method: string}>}
 */
const convertWithLibreOffice = async (fileBuffer, originalname) => {
  // docx-pdf package is deprecated and requires PhantomJS which is no longer maintained
  // Skip this method and throw immediately to fall back to Mammoth
  throw new Error('docx-pdf package requires PhantomJS which is deprecated and not installed. Using fallback method.');
};

/**
 * Convert Word document to PDF using Mammoth + PDF-lib (Method 2 - Fallback)
 * Works without external dependencies but may have formatting limitations
 * @param {Buffer} fileBuffer - Word document buffer
 * @returns {Promise<{buffer: Buffer, success: boolean, method: string}>}
 */
const convertWithMammoth = async (fileBuffer) => {
  try {
    // Extract HTML from Word document (preserves more structure than raw text)
    const result = await mammoth.convertToHtml({ buffer: fileBuffer });
    const html = result.value;
    
    if (!html || html.trim().length === 0) {
      throw new Error('No content extracted from document');
    }
    
    // Parse HTML to extract structured text with paragraphs
    const paragraphs = extractParagraphsFromHtml(html);
    
    if (paragraphs.length === 0) {
      throw new Error('No text content found in document');
    }
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const fontSize = 11;
    const lineHeight = fontSize * 1.4;
    const paragraphSpacing = fontSize * 0.8;
    const margin = 50;
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const maxWidth = pageWidth - (margin * 2);
    
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;
    
    // Process each paragraph
    for (const para of paragraphs) {
      // Check if we need a new page
      if (yPosition < margin + lineHeight * 3) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }
      
      // Wrap text for this paragraph
      const lines = wrapText(para.text, font, fontSize, maxWidth);
      
      // Check if paragraph fits on current page
      const paragraphHeight = (lines.length * lineHeight) + paragraphSpacing;
      if (yPosition - paragraphHeight < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }
      
      // Draw each line
      for (const line of lines) {
        const textFont = para.isBold ? boldFont : font;
        const textSize = para.isHeading ? fontSize + 2 : fontSize;
        
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: textSize,
          font: textFont,
          color: rgb(0, 0, 0),
          lineHeight: lineHeight
        });
        
        yPosition -= lineHeight;
      }
      
      // Add spacing after paragraph
      yPosition -= paragraphSpacing;
    }
    
    // Add footer watermark on first page
    const firstPage = pdfDoc.getPage(0);
    firstPage.drawText('Converted from Word document | MUT Study Hub', {
      x: margin,
      y: 25,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    
    console.log(`✅ Document converted: ${paragraphs.length} paragraphs, ${pdfDoc.getPageCount()} pages`);
    return {
      buffer: pdfBuffer,
      success: true,
      method: 'mammoth'
    };
  } catch (error) {
    console.error('⚠️ Mammoth conversion failed:', error.message);
    throw error;
  }
};

/**
 * Extract paragraphs from HTML with basic formatting detection
 * @param {string} html - HTML content from Mammoth
 * @returns {Array<{text: string, isBold: boolean, isHeading: boolean}>}
 */
function extractParagraphsFromHtml(html) {
  const paragraphs = [];
  
  // Remove HTML tags but preserve structure
  // Split by paragraph tags
  const blocks = html.split(/<\/p>|<br\s*\/?>|<\/h[1-6]>|<\/li>/i);
  
  for (let block of blocks) {
    // Check for headings
    const isHeading = /<h[1-6][^>]*>/i.test(block);
    
    // Check for bold
    const isBold = /<strong>|<b>/i.test(block) || isHeading;
    
    // Remove all HTML tags
    let text = block.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');
    
    // Trim and clean up whitespace
    text = text.trim().replace(/\s+/g, ' ');
    
    // Only add non-empty paragraphs
    if (text.length > 0) {
      paragraphs.push({
        text,
        isBold,
        isHeading
      });
    }
  }
  
  return paragraphs;
}

/**
 * Wrap text to fit within a specified width
 * @param {string} text - Text to wrap
 * @param {object} font - PDF font object
 * @param {number} fontSize - Font size
 * @param {number} maxWidth - Maximum width in points
 * @returns {Array<string>} Array of wrapped lines
 */
function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [''];
}

/**
 * Main conversion function - tries multiple methods
 * Currently only uses Mammoth + PDF-lib due to docx-pdf deprecation
 * @param {Buffer} fileBuffer - Word document buffer
 * @param {string} originalname - Original filename
 * @returns {Promise<{buffer: Buffer, success: boolean, method: string, convertedFilename: string, mimetype: string}>}
 */
export const convertWordToPdf = async (fileBuffer, originalname) => {
  console.log(`🔄 Starting conversion for: ${originalname}`);
  
  // Note: LibreOffice method (docx-pdf package) is deprecated and requires PhantomJS
  // We skip directly to Mammoth conversion which works without external dependencies
  
  try {
    const result = await convertWithMammoth(fileBuffer);
    
    const nameWithoutExt = path.parse(originalname).name;
    const convertedFilename = `${nameWithoutExt}.pdf`;
    
    return {
      ...result,
      convertedFilename,
      mimetype: 'application/pdf'
    };
  } catch (mammothError) {
    console.error('Mammoth conversion failed:', mammothError.message);
    
    // Return original file with failure flag
    return {
      buffer: fileBuffer,
      success: false,
      method: 'none',
      convertedFilename: originalname,
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      error: 'Conversion failed: ' + mammothError.message
    };
  }
};

/**
 * Check if LibreOffice is available on the system
 * Note: Currently not used as we're using Mammoth conversion only
 * @returns {Promise<boolean>}
 */
export const checkLibreOfficeAvailability = async () => {
  // LibreOffice conversion via docx-pdf is disabled due to PhantomJS deprecation
  // Always return false to indicate fallback method will be used
  console.log('ℹ️ LibreOffice/docx-pdf conversion is disabled (PhantomJS deprecated)');
  console.log('ℹ️ Using Mammoth + PDF-lib for Word document conversion');
  return false;
};

/**
 * Middleware to handle document conversion in memory
 * Use this with multer's memoryStorage
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const convertDocumentMiddleware = async (req, res, next) => {
  try {
    // Check if file exists and is a Word document
    if (!req.file || !isWordDocument(req.file.mimetype, req.file.originalname)) {
      return next(); // Not a Word document, skip conversion
    }
    
    console.log(`📄 Word document detected: ${req.file.originalname}`);
    
    // Convert the document
    const conversionResult = await convertWordToPdf(req.file.buffer, req.file.originalname);
    
    if (conversionResult.success) {
      // Update req.file with converted PDF
      req.file.buffer = conversionResult.buffer;
      req.file.originalname = conversionResult.convertedFilename;
      req.file.mimetype = conversionResult.mimetype;
      req.file.size = conversionResult.buffer.length;
      
      // Store conversion metadata
      req.fileConversion = {
        converted: true,
        method: conversionResult.method,
        originalFormat: 'docx'
      };
      
      console.log(`✅ Conversion successful using ${conversionResult.method} method`);
    } else {
      // Conversion failed, but we'll allow upload of original file
      req.fileConversion = {
        converted: false,
        error: conversionResult.error,
        originalFormat: 'docx'
      };
      
      console.warn(`⚠️ Conversion failed, uploading original file: ${conversionResult.error}`);
    }
    
    next();
  } catch (error) {
    console.error('Document conversion middleware error:', error);
    // Don't block upload on conversion error
    req.fileConversion = {
      converted: false,
      error: error.message
    };
    next();
  }
};

export default {
  convertWordToPdf,
  isWordDocument,
  checkLibreOfficeAvailability,
  convertDocumentMiddleware
};
