import mammoth from 'mammoth';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Document Converter Service
 * Converts Word (.doc, .docx) and PowerPoint (.ppt, .pptx) to PDF before upload
 *
 * Current Implementation:
 * - Word: Mammoth + PDF-lib for text extraction and PDF generation
 * - PowerPoint: structured lecture-notes PDF (topics, subtopics, lists,
 *   formulas, code) via JSZip + PDF-lib — no LibreOffice
 * - Works without external system dependencies
 *
 * Note: The docx-pdf package was initially planned for LibreOffice conversion
 * but is deprecated and requires PhantomJS (no longer maintained).
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
 * Check if a file is a PowerPoint document
 * @param {string} mimetype - File mimetype
 * @param {string} originalname - Original filename
 * @returns {boolean}
 */
export const isPowerPointDocument = (mimetype, originalname) => {
  const pptMimetypes = [
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
  ];

  const pptExtensions = ['.ppt', '.pptx'];
  const extension = path.extname(originalname).toLowerCase();

  return pptMimetypes.includes(mimetype) || pptExtensions.includes(extension);
};

/**
 * Check if a file should be converted to PDF (Word or PowerPoint)
 * @param {string} mimetype - File mimetype
 * @param {string} originalname - Original filename
 * @returns {boolean}
 */
export const isConvertibleDocument = (mimetype, originalname) => {
  return isWordDocument(mimetype, originalname) || isPowerPointDocument(mimetype, originalname);
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
 * Now supports: paragraphs, headings, bold text, images, and tables
 * @param {Buffer} fileBuffer - Word document buffer
 * @returns {Promise<{buffer: Buffer, success: boolean, method: string}>}
 */
const convertWithMammoth = async (fileBuffer) => {
  try {
    // Extract HTML from Word document with images
    const result = await mammoth.convertToHtml({ 
      buffer: fileBuffer,
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      })
    });
    const html = result.value;
    const messages = result.messages;
    
    // Log any conversion warnings
    if (messages.length > 0) {
      console.log(`ℹ️ Conversion notes: ${messages.length} items`);
      messages.forEach(msg => {
        if (msg.type === 'warning') {
          console.warn(`  - ${msg.message}`);
        }
      });
    }
    
    if (!html || html.trim().length === 0) {
      throw new Error('No content extracted from document');
    }
    
    // Parse HTML to extract structured content (paragraphs, images, tables)
    const contentBlocks = await extractContentFromHtml(html);
    
    if (contentBlocks.length === 0) {
      throw new Error('No content found in document');
    }
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Use Times Roman which has better Unicode support than Helvetica
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    
    const fontSize = 11;
    const lineHeight = fontSize * 1.4;
    const paragraphSpacing = fontSize * 0.8;
    const margin = 50;
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const maxWidth = pageWidth - (margin * 2);
    
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;
    
    // Process each content block (text, image, or table)
    for (const block of contentBlocks) {
      // Check if we need a new page
      if (yPosition < margin + lineHeight * 3) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }
      
      if (block.type === 'paragraph') {
        // Handle text paragraph
        const sanitizedText = sanitizeTextForPdf(block.text);
        const lines = wrapText(sanitizedText, font, fontSize, maxWidth);
        
        const paragraphHeight = (lines.length * lineHeight) + paragraphSpacing;
        if (yPosition - paragraphHeight < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }
        
        for (const line of lines) {
          if (line.trim().length === 0) continue;
          
          try {
            const textFont = block.isBold ? boldFont : font;
            const textSize = block.isHeading ? fontSize + 2 : fontSize;
            
            page.drawText(line, {
              x: margin,
              y: yPosition,
              size: textSize,
              font: textFont,
              color: rgb(0, 0, 0),
              lineHeight: lineHeight
            });
          } catch (charError) {
            console.warn('Character encoding issue, using fallback');
            const fallback = line.replace(/[^\x00-\x7F]/g, '?');
            page.drawText(fallback, {
              x: margin,
              y: yPosition,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
              lineHeight: lineHeight
            });
          }
          
          yPosition -= lineHeight;
        }
        
        yPosition -= paragraphSpacing;
        
      } else if (block.type === 'image') {
        // Handle embedded image
        try {
          const imageHeight = await embedImageInPdf(pdfDoc, page, block.data, margin, yPosition, maxWidth);
          yPosition -= imageHeight + paragraphSpacing;
          
          // Add image caption if exists
          if (block.caption) {
            const captionText = `Figure: ${sanitizeTextForPdf(block.caption)}`;
            page.drawText(captionText, {
              x: margin,
              y: yPosition,
              size: fontSize - 1,
              font: italicFont,
              color: rgb(0.3, 0.3, 0.3)
            });
            yPosition -= lineHeight + paragraphSpacing;
          }
        } catch (imgError) {
          console.warn(`Failed to embed image: ${imgError.message}`);
          // Add placeholder text
          page.drawText('[Image could not be embedded]', {
            x: margin,
            y: yPosition,
            size: fontSize - 1,
            font: italicFont,
            color: rgb(0.5, 0.5, 0.5)
          });
          yPosition -= lineHeight + paragraphSpacing;
        }
        
      } else if (block.type === 'table') {
        // Handle table
        try {
          const tableHeight = drawTable(page, block.rows, margin, yPosition, maxWidth, font, fontSize);
          yPosition -= tableHeight + paragraphSpacing;
        } catch (tableError) {
          console.warn(`Failed to draw table: ${tableError.message}`);
          // Add placeholder
          page.drawText('[Table - content preserved in text format]', {
            x: margin,
            y: yPosition,
            size: fontSize - 1,
            font: italicFont,
            color: rgb(0.5, 0.5, 0.5)
          });
          yPosition -= lineHeight;
          
          // Try to render table content as text
          for (const row of block.rows) {
            const rowText = row.map(cell => sanitizeTextForPdf(cell)).join(' | ');
            const lines = wrapText(rowText, font, fontSize - 1, maxWidth);
            for (const line of lines) {
              if (yPosition < margin + lineHeight) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                yPosition = pageHeight - margin;
              }
              page.drawText(line, {
                x: margin,
                y: yPosition,
                size: fontSize - 1,
                font: font,
                color: rgb(0, 0, 0)
              });
              yPosition -= lineHeight;
            }
          }
          yPosition -= paragraphSpacing;
        }
      }
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
    
    const imageCount = contentBlocks.filter(b => b.type === 'image').length;
    const tableCount = contentBlocks.filter(b => b.type === 'table').length;
    console.log(`✅ Document converted: ${contentBlocks.length} blocks (${imageCount} images, ${tableCount} tables), ${pdfDoc.getPageCount()} pages`);
    
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
 * Sanitize text for PDF rendering - replace Unicode characters with ASCII approximations
 * This function aggressively replaces ALL non-ASCII characters to prevent encoding errors
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeTextForPdf(text) {
  // Comprehensive map of Unicode characters to ASCII approximations
  // Using Unicode code points to avoid syntax errors
  const replacements = [
    // Greek lowercase letters
    [/α/g, 'alpha'],
    [/β/g, 'beta'],
    [/γ/g, 'gamma'],
    [/δ/g, 'delta'],
    [/ε/g, 'epsilon'],
    [/ζ/g, 'zeta'],
    [/η/g, 'eta'],
    [/θ/g, 'theta'],
    [/ι/g, 'iota'],
    [/κ/g, 'kappa'],
    [/λ/g, 'lambda'],
    [/μ/g, 'mu'],
    [/ν/g, 'nu'],
    [/ξ/g, 'xi'],
    [/ο/g, 'omicron'],
    [/π/g, 'pi'],
    [/ρ/g, 'rho'],
    [/σ/g, 'sigma'],
    [/ς/g, 'sigma'],
    [/τ/g, 'tau'],
    [/υ/g, 'upsilon'],
    [/φ/g, 'phi'],
    [/χ/g, 'chi'],
    [/ψ/g, 'psi'],
    [/ω/g, 'omega'],
    
    // Greek uppercase letters
    [/Α/g, 'Alpha'],
    [/Β/g, 'Beta'],
    [/Γ/g, 'Gamma'],
    [/Δ/g, 'Delta'],
    [/Ε/g, 'Epsilon'],
    [/Ζ/g, 'Zeta'],
    [/Η/g, 'Eta'],
    [/Θ/g, 'Theta'],
    [/Ι/g, 'Iota'],
    [/Κ/g, 'Kappa'],
    [/Λ/g, 'Lambda'],
    [/Μ/g, 'Mu'],
    [/Ν/g, 'Nu'],
    [/Ξ/g, 'Xi'],
    [/Ο/g, 'Omicron'],
    [/Π/g, 'Pi'],
    [/Ρ/g, 'Rho'],
    [/Σ/g, 'Sigma'],
    [/Τ/g, 'Tau'],
    [/Υ/g, 'Upsilon'],
    [/Φ/g, 'Phi'],
    [/Χ/g, 'Chi'],
    [/Ψ/g, 'Psi'],
    [/Ω/g, 'Omega'],
    
    // Omega symbol (special Unicode character U+2126)
    [/\u2126/g, 'Omega'],
    
    // Mathematical operators
    [/∞/g, 'infinity'],
    [/≈/g, '~='],
    [/≠/g, '!='],
    [/≡/g, '='],
    [/≤/g, '<='],
    [/≥/g, '>='],
    [/±/g, '+/-'],
    [/∓/g, '-/+'],
    [/×/g, 'x'],
    [/·/g, '*'],
    [/÷/g, '/'],
    [/−/g, '-'],
    [/√/g, 'sqrt'],
    [/∛/g, 'cbrt'],
    [/∜/g, 'root'],
    [/∑/g, 'SUM'],
    [/∏/g, 'PRODUCT'],
    [/∫/g, 'integral'],
    [/∮/g, 'integral'],
    [/∂/g, 'd'],
    [/∆/g, 'Delta'],
    [/∇/g, 'nabla'],
    [/∝/g, 'proportional to'],
    [/∠/g, 'angle'],
    [/⊥/g, 'perpendicular'],
    [/∥/g, 'parallel'],
    [/∧/g, 'AND'],
    [/∨/g, 'OR'],
    [/¬/g, 'NOT'],
    [/⊕/g, 'XOR'],
    [/∈/g, 'in'],
    [/∉/g, 'not in'],
    [/⊂/g, 'subset'],
    [/⊃/g, 'superset'],
    [/∩/g, 'intersection'],
    [/∪/g, 'union'],
    [/∅/g, 'empty set'],
    
    // Superscripts
    [/⁰/g, '^0'],
    [/¹/g, '^1'],
    [/²/g, '^2'],
    [/³/g, '^3'],
    [/⁴/g, '^4'],
    [/⁵/g, '^5'],
    [/⁶/g, '^6'],
    [/⁷/g, '^7'],
    [/⁸/g, '^8'],
    [/⁹/g, '^9'],
    [/⁺/g, '^+'],
    [/⁻/g, '^-'],
    [/⁽/g, '^('],
    [/⁾/g, '^)'],
    [/ⁿ/g, '^n'],
    
    // Subscripts
    [/₀/g, '_0'],
    [/₁/g, '_1'],
    [/₂/g, '_2'],
    [/₃/g, '_3'],
    [/₄/g, '_4'],
    [/₅/g, '_5'],
    [/₆/g, '_6'],
    [/₇/g, '_7'],
    [/₈/g, '_8'],
    [/₉/g, '_9'],
    [/₊/g, '_+'],
    [/₋/g, '_-'],
    [/₍/g, '_('],
    [/₎/g, '_)'],
    
    // Arrows
    [/→/g, '->'],
    [/←/g, '<-'],
    [/↔/g, '<->'],
    [/↑/g, 'up'],
    [/↓/g, 'down'],
    [/⇒/g, '=>'],
    [/⇐/g, '<='],
    [/⇔/g, '<=>'],
    [/⇑/g, 'UP'],
    [/⇓/g, 'DOWN'],
    
    // Punctuation and typography
    [/\u201C/g, '"'],  // Left double quotation mark
    [/\u201D/g, '"'],  // Right double quotation mark
    [/\u2018/g, "'"],  // Left single quotation mark
    [/\u2019/g, "'"],  // Right single quotation mark
    [/\u2013/g, '-'],  // En dash
    [/\u2014/g, '--'], // Em dash
    [/\u2026/g, '...'], // Horizontal ellipsis
    [/\u2022/g, '*'],  // Bullet
    [/°/g, ' deg'],    // Degree sign
    [/′/g, "'"],       // Prime (minutes/feet)
    [/″/g, '"'],       // Double prime (seconds/inches)
    [/‰/g, 'per mille'],
    [/‱/g, 'per 10000'],
    
    // Fractions
    [/½/g, '1/2'],
    [/⅓/g, '1/3'],
    [/⅔/g, '2/3'],
    [/¼/g, '1/4'],
    [/¾/g, '3/4'],
    [/⅕/g, '1/5'],
    [/⅖/g, '2/5'],
    [/⅗/g, '3/5'],
    [/⅘/g, '4/5'],
    [/⅙/g, '1/6'],
    [/⅚/g, '5/6'],
    [/⅛/g, '1/8'],
    [/⅜/g, '3/8'],
    [/⅝/g, '5/8'],
    [/⅞/g, '7/8'],
    
    // Currency symbols
    [/€/g, 'EUR'],
    [/£/g, 'GBP'],
    [/¥/g, 'YEN'],
    [/¢/g, 'cents'],
    
    // Other common symbols
    [/©/g, '(c)'],
    [/®/g, '(R)'],
    [/™/g, '(TM)'],
    [/§/g, 'section'],
    [/¶/g, 'paragraph'],
    [/†/g, '+'],
    [/‡/g, '++'],
    [/µ/g, 'micro'],
    [/Å/g, 'Angstrom'],
    [/℃/g, ' degrees C'],
    [/℉/g, ' degrees F'],
  ];
  
  let sanitized = text;
  
  // Apply all replacements
  for (const [regex, replacement] of replacements) {
    sanitized = sanitized.replace(regex, replacement);
  }
  
  // Final safety check: Replace any remaining non-ASCII characters with ?
  // This catches any Unicode we didn't explicitly handle
  sanitized = sanitized.replace(/[^\x00-\x7F]/g, (char) => {
    // Log what we're replacing for debugging
    console.warn(`Replacing unknown character: ${char} (U+${char.charCodeAt(0).toString(16).toUpperCase()})`);
    return '?';
  });
  
  return sanitized;
}

/**
 * Extract content blocks from HTML (paragraphs, images, tables)
 * @param {string} html - HTML content from Mammoth
 * @returns {Promise<Array<Object>>} Array of content blocks
 */
async function extractContentFromHtml(html) {
  const contentBlocks = [];
  
  // Simple HTML parsing without external dependencies
  // Look for images first
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  let imgMatch;
  
  // Track positions of images
  const imagePositions = [];
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    imagePositions.push({
      index: imgMatch.index,
      length: imgMatch[0].length,
      src: imgMatch[1]
    });
  }
  
  // Look for tables
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const tablePositions = [];
  let tableMatch;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    tablePositions.push({
      index: tableMatch.index,
      length: tableMatch[0].length,
      content: tableMatch[0]
    });
  }
  
  // Combine and sort all special elements
  const specialElements = [...imagePositions, ...tablePositions].sort((a, b) => a.index - b.index);
  
  let currentIndex = 0;
  
  for (const element of specialElements) {
    // Process text before this element
    if (element.index > currentIndex) {
      const textBefore = html.substring(currentIndex, element.index);
      const paragraphs = extractParagraphsFromHtml(textBefore);
      contentBlocks.push(...paragraphs.map(p => ({ type: 'paragraph', ...p })));
    }
    
    // Process the special element
    if (element.src) {
      // It's an image
      contentBlocks.push({
        type: 'image',
        data: element.src,
        caption: null
      });
    } else if (element.content) {
      // It's a table
      const rows = extractTableRows(element.content);
      if (rows.length > 0) {
        contentBlocks.push({
          type: 'table',
          rows: rows
        });
      }
    }
    
    currentIndex = element.index + element.length;
  }
  
  // Process remaining text
  if (currentIndex < html.length) {
    const textAfter = html.substring(currentIndex);
    const paragraphs = extractParagraphsFromHtml(textAfter);
    contentBlocks.push(...paragraphs.map(p => ({ type: 'paragraph', ...p })));
  }
  
  return contentBlocks;
}

/**
 * Extract table rows from HTML table
 * @param {string} tableHtml - HTML table content
 * @returns {Array<Array<string>>} 2D array of table cells
 */
function extractTableRows(tableHtml) {
  const rows = [];
  
  // Extract rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowContent = rowMatch[1];
    const cells = [];
    
    // Extract cells (td or th)
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      let cellText = cellMatch[1];
      // Remove HTML tags
      cellText = cellText.replace(/<[^>]+>/g, '');
      // Decode HTML entities
      cellText = cellText
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
      
      cells.push(cellText);
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return rows;
}

/**
 * Embed image in PDF from base64 data
 * @param {PDFDocument} pdfDoc - PDF document
 * @param {PDFPage} page - Current page
 * @param {string} dataUri - Base64 data URI
 * @param {number} x - X position
 * @param {number} y - Y position (top)
 * @param {number} maxWidth - Maximum width
 * @returns {Promise<number>} Height of embedded image
 */
async function embedImageInPdf(pdfDoc, page, dataUri, x, y, maxWidth) {
  try {
    // Extract base64 data and type
    const matches = dataUri.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid image data URI');
    }
    
    const imageType = matches[1];
    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Embed image based on type
    let image;
    if (imageType === 'png') {
      image = await pdfDoc.embedPng(imageBuffer);
    } else if (imageType === 'jpeg' || imageType === 'jpg') {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else {
      throw new Error(`Unsupported image type: ${imageType}`);
    }
    
    // Calculate dimensions
    const imageDims = image.scale(1);
    let width = imageDims.width;
    let height = imageDims.height;
    
    // Scale down if too wide
    if (width > maxWidth) {
      const scale = maxWidth / width;
      width = maxWidth;
      height = height * scale;
    }
    
    // Scale down if too tall (max 400 points)
    const maxHeight = 400;
    if (height > maxHeight) {
      const scale = maxHeight / height;
      height = maxHeight;
      width = width * scale;
    }
    
    // Draw image (y is top, so subtract height)
    page.drawImage(image, {
      x: x,
      y: y - height,
      width: width,
      height: height
    });
    
    return height;
  } catch (error) {
    console.warn(`Image embedding failed: ${error.message}`);
    throw error;
  }
}

/**
 * Draw table on PDF page
 * @param {PDFPage} page - PDF page
 * @param {Array<Array<string>>} rows - Table rows
 * @param {number} x - X position
 * @param {number} y - Y position (top)
 * @param {number} maxWidth - Maximum width
 * @param {object} font - PDF font
 * @param {number} fontSize - Font size
 * @returns {number} Height of table
 */
function drawTable(page, rows, x, y, maxWidth, font, fontSize) {
  if (rows.length === 0) return 0;
  
  const cellPadding = 5;
  const lineHeight = fontSize * 1.3;
  const rowHeight = lineHeight + (cellPadding * 2);
  
  // Calculate column widths (equal distribution)
  const numCols = rows[0].length;
  const colWidth = maxWidth / numCols;
  
  let currentY = y;
  
  // Draw each row
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const isHeader = rowIndex === 0;
    
    // Draw row background (alternate colors)
    if (isHeader) {
      page.drawRectangle({
        x: x,
        y: currentY - rowHeight,
        width: maxWidth,
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.9)
      });
    } else if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: x,
        y: currentY - rowHeight,
        width: maxWidth,
        height: rowHeight,
        color: rgb(0.95, 0.95, 0.95)
      });
    }
    
    // Draw cell borders
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellX = x + (colIndex * colWidth);
      
      // Draw cell border
      page.drawRectangle({
        x: cellX,
        y: currentY - rowHeight,
        width: colWidth,
        height: rowHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5
      });
      
      // Draw cell text
      const cellText = sanitizeTextForPdf(row[colIndex] || '');
      const truncatedText = truncateText(cellText, font, fontSize - 1, colWidth - (cellPadding * 2));
      
      try {
        page.drawText(truncatedText, {
          x: cellX + cellPadding,
          y: currentY - cellPadding - fontSize,
          size: fontSize - 1,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: colWidth - (cellPadding * 2)
        });
      } catch (error) {
        // Fallback for encoding errors
        const fallback = truncatedText.replace(/[^\x00-\x7F]/g, '?');
        page.drawText(fallback, {
          x: cellX + cellPadding,
          y: currentY - cellPadding - fontSize,
          size: fontSize - 1,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: colWidth - (cellPadding * 2)
        });
      }
    }
    
    currentY -= rowHeight;
  }
  
  return (rows.length * rowHeight);
}

/**
 * Truncate text to fit within width
 * @param {string} text - Text to truncate
 * @param {object} font - PDF font
 * @param {number} fontSize - Font size
 * @param {number} maxWidth - Maximum width
 * @returns {string} Truncated text
 */
function truncateText(text, font, fontSize, maxWidth) {
  const width = font.widthOfTextAtSize(text, fontSize);
  
  if (width <= maxWidth) {
    return text;
  }
  
  // Truncate with ellipsis
  let truncated = text;
  while (font.widthOfTextAtSize(truncated + '...', fontSize) > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  
  return truncated + '...';
}

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
 * Decode common XML entities in PPTX text nodes
 */
function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * Detect if text looks like programming / source code
 */
function looksLikeCode(text, fontName = '') {
  const t = text.trim();
  if (!t) return false;

  const monoFonts = /consolas|courier|monaco|menlo|source.?code|fira.?code|jetbrains|lucida.?console|dejavu.?sans.?mono|ubuntu.?mono|hack/i;
  if (fontName && monoFonts.test(fontName)) return true;

  const codeStarters = /^(def |class |function |import |from |#include|public |private |protected |static |void |int |float |double |const |let |var |return |if\s*\(|for\s*\(|while\s*\(|switch\s*\(|try\s*\{|catch\s*\(|else\s*\{|elif |printf\s*\(|cout\s*<<|System\.out|console\.|package |using |namespace )/;
  if (codeStarters.test(t)) return true;

  const codeSignals = (t.match(/[{};=<>[\]]/g) || []).length;
  const hasIndent = /^\s{2,}|\t/.test(text);
  if (hasIndent && codeSignals >= 2) return true;
  if (codeSignals >= 4 && t.length < 200) return true;
  if (/;\s*$/.test(t) && /\(/.test(t) && codeSignals >= 2) return true;

  return false;
}

/**
 * Detect if text looks like a math / physics formula
 */
function looksLikeFormula(text) {
  const t = text.trim();
  if (!t || t.length > 180) return false;

  // Explicit formula / equation markers
  if (/^(formula|equation|eq\.?|theorem|law)\s*[:.]/i.test(t)) return true;

  const hasEquals = /=/.test(t) && !/==|===|=>|->/.test(t);
  const mathTokens = (t.match(/\b(sin|cos|tan|log|ln|sqrt|integral|sum|delta|omega|alpha|beta|gamma|theta|lambda|sigma|pi|mu|rho|phi|psi|nabla|partial)\b/gi) || []).length;
  const operators = (t.match(/[+\-*/^√∫∑∏≤≥≠±∞∂∇]|<=|>=|\^|_/g) || []).length;
  const greekAscii = (t.match(/\b(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|omega|phi|psi|rho|tau)\b/gi) || []).length;

  // Short equation style: F = m*a, E = mc^2, v = u + at
  if (hasEquals && t.length < 80 && (operators >= 1 || /[a-zA-Z]\s*=\s*[a-zA-Z0-9]/.test(t))) {
    // Avoid normal sentences with " = "
    if (!/\b(is|are|was|were|the|and|or|to|of|for|in|on|at)\b/i.test(t) || operators + mathTokens + greekAscii >= 2) {
      return true;
    }
  }

  if (mathTokens + greekAscii >= 2 && t.length < 120) return true;
  if (operators >= 3 && t.length < 100 && !/\s{2,}/.test(t)) return true;

  return false;
}

/**
 * Detect subtopic-style headings inside slide body
 */
function looksLikeSubtopic(text, isBold = false) {
  const t = text.trim();
  if (!t || t.length > 90) return false;
  if (/^[•\-\*\d]+[.)]\s/.test(t)) return false;
  if (looksLikeCode(t) || looksLikeFormula(t)) return false;

  if (t.endsWith(':') && t.length < 70) return true;
  if (isBold && t.length < 70 && !/[.!?]$/.test(t)) return true;
  if (/^[A-Z][A-Z0-9\s\-&,/()]{2,60}$/.test(t) && t.split(/\s+/).length <= 8) return true;
  if (/^\d+(\.\d+)*\s+[A-Z]/.test(t) && t.length < 70) return true;

  return false;
}

/**
 * Extract plain text from a PPTX table cell
 */
function extractPptxCellText(tcXml) {
  const parts = [];
  const tRegex = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
  let match;
  while ((match = tRegex.exec(tcXml)) !== null) {
    parts.push(decodeXmlEntities(match[1]));
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parse an <a:tbl> element into a 2D array of cell strings
 */
function parsePptxTableXml(tblXml) {
  const rows = [];
  const trRegex = /<a:tr\b[^>]*>([\s\S]*?)<\/a:tr>/gi;
  let trMatch;

  while ((trMatch = trRegex.exec(tblXml)) !== null) {
    const cells = [];
    const tcRegex = /<a:tc\b[^>]*>([\s\S]*?)<\/a:tc>/gi;
    let tcMatch;
    while ((tcMatch = tcRegex.exec(trMatch[1])) !== null) {
      cells.push(extractPptxCellText(tcMatch[1]));
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  if (rows.length === 0) return [];

  const maxCols = Math.max(...rows.map(r => r.length));
  return rows.map(row => {
    const padded = [...row];
    while (padded.length < maxCols) padded.push('');
    return padded;
  });
}

/**
 * Convert collected paragraphs into structured content blocks
 */
function paragraphsToBlocks(paragraphs) {
  const blocks = [];
  let i = 0;

  while (i < paragraphs.length) {
    const p = paragraphs[i];

    if (looksLikeCode(p.text, p.fontName)) {
      const codeLines = [p.text];
      let j = i + 1;
      while (j < paragraphs.length && looksLikeCode(paragraphs[j].text, paragraphs[j].fontName)) {
        codeLines.push(paragraphs[j].text);
        j++;
      }
      blocks.push({ type: 'code', lines: codeLines });
      i = j;
      continue;
    }

    if (looksLikeFormula(p.text)) {
      blocks.push({ type: 'formula', text: p.text });
      i++;
      continue;
    }

    if (looksLikeSubtopic(p.text, p.isBold) && p.level === 0) {
      blocks.push({ type: 'subtopic', text: p.text.replace(/:$/, '') });
      i++;
      continue;
    }

    const bulletPrefix = p.text.match(/^([•●○▪▸►\-–—*+]|\d+[.)]|[a-zA-Z][.)])\s+(.*)$/);
    if (p.level > 0 || bulletPrefix) {
      blocks.push({
        type: 'list',
        text: bulletPrefix ? bulletPrefix[2] : p.text,
        level: p.level > 0 ? p.level : 0
      });
      i++;
      continue;
    }

    if (p.text.length < 120 && !/[.!?]$/.test(p.text) && paragraphs.length > 3) {
      blocks.push({ type: 'list', text: p.text, level: 0 });
    } else {
      blocks.push({ type: 'paragraph', text: p.text, isBold: p.isBold });
    }
    i++;
  }

  return blocks;
}

/**
 * Parse a single slide XML into structured content blocks
 */
function parseSlideXml(slideXml, slideNumber) {
  const blocks = [];

  const collectParagraphs = (xml, role) => {
    const paragraphs = [];
    const pRegex = /<a:p\b[^>]*>([\s\S]*?)<\/a:p>/gi;
    let match;
    while ((match = pRegex.exec(xml)) !== null) {
      const pXml = match[1];
      const lvlMatch = pXml.match(/<a:pPr\b[^>]*\blvl="(\d+)"/i);
      const level = lvlMatch ? parseInt(lvlMatch[1], 10) : 0;

      const runs = [];
      const rRegex = /<a:r\b[^>]*>([\s\S]*?)<\/a:r>|<a:fld\b[^>]*>([\s\S]*?)<\/a:fld>/gi;
      let rMatch;
      let isBold = false;
      let fontName = '';

      while ((rMatch = rRegex.exec(pXml)) !== null) {
        const runXml = rMatch[1] || rMatch[2] || '';
        if (/<a:rPr\b[^>]*\bb="1"/i.test(runXml)) isBold = true;
        const fontMatch = runXml.match(/typeface="([^"]+)"/i);
        if (fontMatch) fontName = fontMatch[1];

        const tRegex = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
        let tMatch;
        while ((tMatch = tRegex.exec(runXml)) !== null) {
          runs.push(decodeXmlEntities(tMatch[1]));
        }
      }

      if (runs.length === 0) {
        const tRegex = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
        let tMatch;
        while ((tMatch = tRegex.exec(pXml)) !== null) {
          runs.push(decodeXmlEntities(tMatch[1]));
        }
      }

      const text = runs.join('').replace(/\s+/g, ' ').trim();
      if (!text) continue;

      paragraphs.push({ text, level, isBold, fontName, role });
    }
    return paragraphs;
  };

  // Title from placeholders
  const shapeRegex = /<p:sp\b[\s\S]*?<\/p:sp>/gi;
  const shapes = [];
  let shapeMatch;
  while ((shapeMatch = shapeRegex.exec(slideXml)) !== null) {
    shapes.push({ index: shapeMatch.index, xml: shapeMatch[0] });
  }

  let topic = null;
  const titleParas = [];
  const contentUnits = [];

  for (const { index, xml } of shapes) {
    const phMatch = xml.match(/<p:ph\b[^>]*\btype="([^"]+)"/i);
    const type = phMatch?.[1]?.toLowerCase() || '';
    if (type === 'title' || type === 'ctrtitle') {
      titleParas.push(...collectParagraphs(xml, 'title'));
    } else if (type === 'subtitle') {
      titleParas.push(...collectParagraphs(xml, 'subtitle'));
    } else {
      contentUnits.push({ index, kind: 'shape', xml });
    }
  }

  // Tables (usually inside graphicFrame) — keep document order with shapes
  const tblRegex = /<a:tbl\b[\s\S]*?<\/a:tbl>/gi;
  let tblMatch;
  while ((tblMatch = tblRegex.exec(slideXml)) !== null) {
    contentUnits.push({ index: tblMatch.index, kind: 'table', xml: tblMatch[0] });
  }

  contentUnits.sort((a, b) => a.index - b.index);

  if (titleParas.length > 0) {
    topic = titleParas.map(p => p.text).join(' - ');
  }

  // Fallback topic from first short body paragraph
  let bodyParagraphs = [];
  if (contentUnits.length === 0 && titleParas.length === 0) {
    // Last resort: whole slide minus tables (avoid treating cells as bullets)
    let withoutTables = slideXml.replace(/<a:tbl\b[\s\S]*?<\/a:tbl>/gi, '');
    bodyParagraphs = collectParagraphs(withoutTables, 'body');
  }

  if (!topic && bodyParagraphs.length === 0) {
    // Peek first shape text for topic
    for (const unit of contentUnits) {
      if (unit.kind !== 'shape') continue;
      const paras = collectParagraphs(unit.xml, 'body');
      if (paras.length > 0 && paras[0].text.length <= 100 && paras[0].level === 0) {
        topic = paras[0].text;
        unit._skipFirst = true;
      }
      break;
    }
  } else if (!topic && bodyParagraphs.length > 0) {
    const first = bodyParagraphs[0];
    if (first.text.length <= 100 && first.level === 0) {
      topic = first.text;
      bodyParagraphs.shift();
    }
  }

  blocks.push({
    type: 'topic',
    text: topic || `Slide ${slideNumber}`,
    slideNumber
  });

  if (bodyParagraphs.length > 0) {
    blocks.push(...paragraphsToBlocks(bodyParagraphs));
  }

  for (const unit of contentUnits) {
    if (unit.kind === 'table') {
      const rows = parsePptxTableXml(unit.xml);
      if (rows.length > 0) {
        blocks.push({ type: 'table', rows });
      }
      continue;
    }

    let paras = collectParagraphs(unit.xml, 'body');
    if (unit._skipFirst && paras.length > 0) {
      paras = paras.slice(1);
    }
    blocks.push(...paragraphsToBlocks(paras));
  }

  return blocks;
}

/**
 * Extract ordered slide XML strings from a PPTX buffer
 */
async function extractPptxSlides(fileBuffer) {
  const zip = await JSZip.loadAsync(fileBuffer);
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('string');
  if (!presentationXml) {
    throw new Error('Invalid PPTX: missing presentation.xml');
  }

  const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string');
  if (!relsXml) {
    throw new Error('Invalid PPTX: missing presentation relationships');
  }

  const relMap = {};
  const relRegex = /<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/?>/gi;
  let relMatch;
  while ((relMatch = relRegex.exec(relsXml)) !== null) {
    relMap[relMatch[1]] = relMatch[2].replace(/^\//, '').replace(/^\.\.\//, '');
  }

  // Also handle Target before Id attribute order
  const relRegex2 = /<Relationship\b[^>]*\bTarget="([^"]+)"[^>]*\bId="([^"]+)"[^>]*\/?>/gi;
  while ((relMatch = relRegex2.exec(relsXml)) !== null) {
    if (!relMap[relMatch[2]]) {
      relMap[relMatch[2]] = relMatch[1].replace(/^\//, '').replace(/^\.\.\//, '');
    }
  }

  const slideTargets = [];
  const sldRegex = /<p:sldId\b[^>]*\br:id="([^"]+)"[^>]*\/?>/gi;
  let sldMatch;
  while ((sldMatch = sldRegex.exec(presentationXml)) !== null) {
    const target = relMap[sldMatch[1]];
    if (target) {
      const normalized = target.startsWith('ppt/') ? target : `ppt/${target}`;
      slideTargets.push(normalized);
    }
  }

  // Fallback: enumerate slide files
  if (slideTargets.length === 0) {
    const slideFiles = Object.keys(zip.files)
      .filter(n => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)/i)?.[1] || '0', 10);
        const nb = parseInt(b.match(/slide(\d+)/i)?.[1] || '0', 10);
        return na - nb;
      });
    slideTargets.push(...slideFiles);
  }

  const slides = [];
  for (const target of slideTargets) {
    const file = zip.file(target) || zip.file(target.replace(/^ppt\//, ''));
    if (!file) continue;
    const xml = await file.async('string');
    slides.push(xml);
  }

  if (slides.length === 0) {
    throw new Error('No slides found in PowerPoint file');
  }

  return slides;
}

/**
 * Render structured lecture-notes PDF from content blocks
 */
async function renderLectureNotesPdf(allBlocks, originalname) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const monoFont = await pdfDoc.embedFont(StandardFonts.Courier);

  // Academic palette (navy / teal — not purple/cream AI defaults)
  const colors = {
    navy: rgb(0.06, 0.22, 0.38),
    teal: rgb(0.0, 0.42, 0.48),
    ink: rgb(0.12, 0.14, 0.16),
    muted: rgb(0.4, 0.45, 0.5),
    line: rgb(0.82, 0.86, 0.9),
    codeBg: rgb(0.95, 0.96, 0.97),
    formulaBg: rgb(0.93, 0.97, 0.98),
    formulaBorder: rgb(0.0, 0.42, 0.48),
    headerBg: rgb(0.06, 0.22, 0.38),
    white: rgb(1, 1, 1),
    listBullet: rgb(0.0, 0.42, 0.48)
  };

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 48;
  const marginTop = 56;
  const marginBottom = 48;
  const contentWidth = pageWidth - marginX * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;

  const drawHeader = (p) => {
    p.drawRectangle({
      x: 0,
      y: pageHeight - 36,
      width: pageWidth,
      height: 36,
      color: colors.headerBg
    });
    p.drawText('MUT Study Hub', {
      x: marginX,
      y: pageHeight - 23,
      size: 10,
      font: boldFont,
      color: colors.white
    });
    p.drawText('Lecture Notes', {
      x: pageWidth - marginX - boldFont.widthOfTextAtSize('Lecture Notes', 9),
      y: pageHeight - 22,
      size: 9,
      font: font,
      color: rgb(0.75, 0.85, 0.9)
    });
  };

  const drawFooter = (p, pageNum) => {
    p.drawLine({
      start: { x: marginX, y: 34 },
      end: { x: pageWidth - marginX, y: 34 },
      thickness: 0.5,
      color: colors.line
    });
    const name = path.parse(originalname).name.slice(0, 40);
    p.drawText(`Converted from PowerPoint  |  ${name}`, {
      x: marginX,
      y: 20,
      size: 7,
      font: font,
      color: colors.muted
    });
    p.drawText(String(pageNum), {
      x: pageWidth - marginX - 12,
      y: 20,
      size: 8,
      font: font,
      color: colors.muted
    });
  };

  drawHeader(page);
  let pageNum = 1;
  const pages = [page];

  const ensureSpace = (needed) => {
    if (y - needed < marginBottom + 10) {
      drawFooter(page, pageNum);
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      pages.push(page);
      pageNum += 1;
      drawHeader(page);
      y = pageHeight - marginTop - 8;
    }
  };

  // ASCII-only markers — StandardFonts use WinAnsi and cannot encode Unicode bullets
  const listMarkers = ['*', '-', 'o', '+'];

  for (const block of allBlocks) {
    if (block.type === 'topic') {
      ensureSpace(56);
      if (y < pageHeight - marginTop - 20) {
        y -= 10;
      }

      // Slide index chip
      const chip = `SLIDE ${block.slideNumber}`;
      page.drawText(chip, {
        x: marginX,
        y: y,
        size: 8,
        font: boldFont,
        color: colors.teal
      });
      y -= 16;

      const topicText = sanitizeTextForPdf(block.text);
      const topicSize = 16;
      const topicLines = wrapText(topicText, boldFont, topicSize, contentWidth);
      ensureSpace(topicLines.length * 20 + 18);

      for (const line of topicLines) {
        page.drawText(line, {
          x: marginX,
          y: y,
          size: topicSize,
          font: boldFont,
          color: colors.navy
        });
        y -= 20;
      }

      // Accent underline
      page.drawRectangle({
        x: marginX,
        y: y + 6,
        width: Math.min(120, contentWidth * 0.35),
        height: 2.5,
        color: colors.teal
      });
      y -= 14;
      continue;
    }

    if (block.type === 'subtopic') {
      ensureSpace(28);
      y -= 4;
      const text = sanitizeTextForPdf(block.text);
      const lines = wrapText(text, boldFont, 12, contentWidth - 8);
      ensureSpace(lines.length * 15 + 10);

      for (const line of lines) {
        page.drawText(line, {
          x: marginX,
          y: y,
          size: 12,
          font: boldFont,
          color: colors.teal
        });
        y -= 15;
      }
      y -= 4;
      continue;
    }

    if (block.type === 'list') {
      const level = Math.min(block.level || 0, 3);
      const indent = marginX + 12 + level * 16;
      const marker = listMarkers[level] || '-';
      const text = sanitizeTextForPdf(block.text);
      const maxW = pageWidth - marginX - indent - 8;
      const lines = wrapText(text, font, 10.5, maxW);
      ensureSpace(lines.length * 14 + 4);

      page.drawText(marker, {
        x: indent - 12,
        y: y,
        size: 11,
        font: boldFont,
        color: colors.listBullet
      });

      for (let li = 0; li < lines.length; li++) {
        page.drawText(lines[li], {
          x: indent,
          y: y,
          size: 10.5,
          font: font,
          color: colors.ink
        });
        y -= 14;
      }
      y -= 2;
      continue;
    }

    if (block.type === 'formula') {
      const text = sanitizeTextForPdf(block.text);
      const lines = wrapText(text, italicFont, 11, contentWidth - 28);
      const boxH = lines.length * 14 + 18;
      ensureSpace(boxH + 8);

      page.drawRectangle({
        x: marginX,
        y: y - boxH + 12,
        width: contentWidth,
        height: boxH,
        color: colors.formulaBg,
        borderColor: colors.formulaBorder,
        borderWidth: 1
      });

      // Left accent bar
      page.drawRectangle({
        x: marginX,
        y: y - boxH + 12,
        width: 3.5,
        height: boxH,
        color: colors.teal
      });

      page.drawText('FORMULA', {
        x: marginX + 12,
        y: y,
        size: 7,
        font: boldFont,
        color: colors.teal
      });
      y -= 12;

      for (const line of lines) {
        page.drawText(line, {
          x: marginX + 12,
          y: y,
          size: 11,
          font: italicFont,
          color: colors.navy
        });
        y -= 14;
      }
      y -= 10;
      continue;
    }

    if (block.type === 'code') {
      const lines = block.lines.map(l => sanitizeTextForPdf(l));
      const lineH = 12;
      const boxH = lines.length * lineH + 22;
      ensureSpace(Math.min(boxH, 200) + 8);

      // May span pages — draw in chunks
      let lineIdx = 0;
      while (lineIdx < lines.length) {
        const avail = y - (marginBottom + 10);
        const maxLines = Math.max(1, Math.floor((avail - 22) / lineH));
        const chunk = lines.slice(lineIdx, lineIdx + maxLines);
        const chunkH = chunk.length * lineH + 22;
        ensureSpace(chunkH);

        page.drawRectangle({
          x: marginX,
          y: y - chunkH + 12,
          width: contentWidth,
          height: chunkH,
          color: colors.codeBg,
          borderColor: colors.line,
          borderWidth: 0.8
        });

        if (lineIdx === 0) {
          page.drawText('CODE', {
            x: marginX + 10,
            y: y,
            size: 7,
            font: boldFont,
            color: colors.muted
          });
          y -= 12;
        } else {
          y -= 8;
        }

        for (const line of chunk) {
          const display = truncateText(line, monoFont, 9, contentWidth - 24);
          page.drawText(display || ' ', {
            x: marginX + 12,
            y: y,
            size: 9,
            font: monoFont,
            color: colors.ink
          });
          y -= lineH;
        }
        y -= 10;
        lineIdx += chunk.length;

        if (lineIdx < lines.length) {
          ensureSpace(40);
        }
      }
      continue;
    }

    if (block.type === 'table') {
      const rows = (block.rows || [])
        .map(row => row.map(cell => sanitizeTextForPdf(String(cell ?? ''))))
        .filter(row => row.some(cell => cell.length > 0) || row.length > 0);

      if (rows.length === 0) continue;

      const tableFontSize = 9;
      const rowHeight = tableFontSize * 1.3 + 10;
      const header = rows[0];
      const dataRows = rows.slice(1);

      ensureSpace(28);
      page.drawText('TABLE', {
        x: marginX,
        y: y,
        size: 7,
        font: boldFont,
        color: colors.teal
      });
      y -= 14;

      // Draw in page-sized chunks; repeat header on each new page
      let rowIdx = 0;
      let firstChunk = true;
      while (rowIdx < dataRows.length || firstChunk) {
        const avail = y - (marginBottom + 10);
        const maxDataRows = Math.max(1, Math.floor(avail / rowHeight) - 1);
        const chunkData = dataRows.slice(rowIdx, rowIdx + maxDataRows);
        const chunk = firstChunk && dataRows.length === 0
          ? [header]
          : [header, ...chunkData];

        ensureSpace(chunk.length * rowHeight + 8);
        const tableHeight = drawTable(page, chunk, marginX, y, contentWidth, font, tableFontSize);
        y -= tableHeight + 12;

        if (dataRows.length === 0) break;
        rowIdx += chunkData.length;
        firstChunk = false;

        if (rowIdx < dataRows.length) {
          ensureSpace(rowHeight * 2);
        } else {
          break;
        }
      }
      continue;
    }

    if (block.type === 'paragraph') {
      const text = sanitizeTextForPdf(block.text);
      const useFont = block.isBold ? boldFont : font;
      const lines = wrapText(text, useFont, 10.5, contentWidth);
      ensureSpace(lines.length * 14 + 6);

      for (const line of lines) {
        page.drawText(line, {
          x: marginX,
          y: y,
          size: 10.5,
          font: useFont,
          color: colors.ink
        });
        y -= 14;
      }
      y -= 4;
    }
  }

  // Footers on all pages
  pages.forEach((p, idx) => {
    drawFooter(p, idx + 1);
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Convert PowerPoint (.pptx) to a presentable lecture-notes PDF
 * Extracts topics, subtopics, lists, formulas, code, and tables — then lays them out cleanly.
 * Legacy .ppt (binary) is not supported and fails gracefully.
 * @param {Buffer} fileBuffer - PowerPoint document buffer
 * @param {string} originalname - Original filename
 * @returns {Promise<{buffer: Buffer, success: boolean, method: string, convertedFilename: string, mimetype: string}>}
 */
export const convertPptxToPdf = async (fileBuffer, originalname) => {
  console.log(`🔄 Starting PowerPoint conversion for: ${originalname}`);

  const extension = path.extname(originalname).toLowerCase();
  const nameWithoutExt = path.parse(originalname).name;

  if (extension === '.ppt') {
    console.warn('⚠️ Legacy .ppt format is not supported for conversion; uploading original file');
    return {
      buffer: fileBuffer,
      success: false,
      method: 'none',
      convertedFilename: originalname,
      mimetype: 'application/vnd.ms-powerpoint',
      error: 'Legacy .ppt format cannot be converted automatically. Please upload a .pptx file.'
    };
  }

  try {
    const slideXmls = await extractPptxSlides(fileBuffer);
    const allBlocks = [];

    slideXmls.forEach((xml, index) => {
      const blocks = parseSlideXml(xml, index + 1);
      allBlocks.push(...blocks);
    });

    if (allBlocks.length === 0) {
      throw new Error('No content extracted from PowerPoint slides');
    }

    const pdfBuffer = await renderLectureNotesPdf(allBlocks, originalname);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PPTX conversion produced an empty PDF');
    }

    const topics = allBlocks.filter(b => b.type === 'topic').length;
    const lists = allBlocks.filter(b => b.type === 'list').length;
    const formulas = allBlocks.filter(b => b.type === 'formula').length;
    const codeBlocks = allBlocks.filter(b => b.type === 'code').length;
    const tables = allBlocks.filter(b => b.type === 'table').length;
    console.log(
      `✅ PowerPoint converted to lecture notes: ${topics} topics, ${lists} list items, ${formulas} formulas, ${codeBlocks} code blocks, ${tables} tables (${pdfBuffer.length} bytes)`
    );

    return {
      buffer: pdfBuffer,
      success: true,
      method: 'structured-notes',
      convertedFilename: `${nameWithoutExt}.pdf`,
      mimetype: 'application/pdf'
    };
  } catch (pptxError) {
    console.error('PowerPoint conversion failed:', pptxError.message);

    return {
      buffer: fileBuffer,
      success: false,
      method: 'none',
      convertedFilename: originalname,
      mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      error: 'Conversion failed: ' + pptxError.message
    };
  }
};

/**
 * Check if LibreOffice is available on the system
 * Note: Currently not used as we're using Mammoth / pptx-to-pdf conversion only
 * @returns {Promise<boolean>}
 */
export const checkLibreOfficeAvailability = async () => {
  // LibreOffice conversion via docx-pdf is disabled due to PhantomJS deprecation
  console.log('ℹ️ LibreOffice/docx-pdf conversion is disabled (PhantomJS deprecated)');
  console.log('ℹ️ Using Mammoth + PDF-lib for Word, structured lecture-notes for PowerPoint');
  return false;
};

/**
 * Middleware to handle document conversion in memory
 * Converts Word (.doc/.docx) and PowerPoint (.pptx) to PDF before Cloudinary upload.
 * Use this with multer's memoryStorage
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const convertDocumentMiddleware = async (req, res, next) => {
  try {
    if (!req.file || !isConvertibleDocument(req.file.mimetype, req.file.originalname)) {
      return next(); // Not a convertible document, skip
    }

    const originalExt = path.extname(req.file.originalname).toLowerCase().replace('.', '') || 'unknown';
    const isPpt = isPowerPointDocument(req.file.mimetype, req.file.originalname);
    const docLabel = isPpt ? 'PowerPoint' : 'Word';

    console.log(`📄 ${docLabel} document detected: ${req.file.originalname}`);

    const conversionResult = isPpt
      ? await convertPptxToPdf(req.file.buffer, req.file.originalname)
      : await convertWordToPdf(req.file.buffer, req.file.originalname);

    if (conversionResult.success) {
      // Update req.file with converted PDF
      req.file.buffer = conversionResult.buffer;
      req.file.originalname = conversionResult.convertedFilename;
      req.file.mimetype = conversionResult.mimetype;
      req.file.size = conversionResult.buffer.length;

      req.fileConversion = {
        converted: true,
        method: conversionResult.method,
        originalFormat: originalExt
      };

      console.log(`✅ Conversion successful using ${conversionResult.method} method`);
    } else {
      // Conversion failed, but we'll allow upload of original file
      req.fileConversion = {
        converted: false,
        error: conversionResult.error,
        originalFormat: originalExt
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
  convertPptxToPdf,
  isWordDocument,
  isPowerPointDocument,
  isConvertibleDocument,
  checkLibreOfficeAvailability,
  convertDocumentMiddleware
};
