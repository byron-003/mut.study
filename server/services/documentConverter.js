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
