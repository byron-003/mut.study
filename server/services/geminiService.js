import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { AppError } from '../middleware/errorHandler.js';
import { extractTextFromFile, truncateText, isSupportedFileType } from './fileExtractor.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// Model Configuration - Change this to use a different model
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
const GEMINI_VISION_MODEL = 'gemini-3.5-flash-lite'; // Supports vision and file analysis

// Available models:
// - 'gemini-pro' (stable, recommended for production)
// - 'gemini-1.5-pro' (latest, supports vision and file analysis)
// - 'gemini-1.5-flash' (faster, good for quick summaries)
// Note: Check https://ai.google.dev/models for latest available models

/**
 * Generate summary using uploaded file from client (NEW - Best approach!)
 * @param {Object} options - Summary options with file path
 * @returns {Promise<Object>} Summary result
 */
export const generateSummaryWithUploadedFile = async (options) => {
  const startTime = Date.now();
  let googleFile = null;

  try {
    const { filePath, fileType, mimeType, title, description, courseCode, courseTitle } = options;

    console.log('🤖 ===== GEMINI UPLOAD DEBUG =====');
    console.log(`📁 Processing uploaded file: ${filePath}`);
    console.log(`📎 File type: ${fileType}, MIME: ${mimeType}`);
    console.log(`📊 File exists: ${fs.existsSync(filePath)}`);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`📊 File size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    }
    console.log('🤖 ================================');

    // Step 1: Upload file to Google's Files API (file already on server)
    console.log(`☁️ Uploading to Google Files API...`);
    console.log(`📤 Upload params: mimeType=${mimeType}, displayName=${title}`);
    
    googleFile = await fileManager.uploadFile(filePath, {
      mimeType: mimeType,
      displayName: title
    });

    console.log(`✅ File uploaded to Google successfully!`);
    console.log(`🔗 File URI: ${googleFile.file.uri}`);
    console.log(`📛 File name: ${googleFile.file.name}`);
    console.log(`📊 File state: ${googleFile.file.state}`);
    console.log(`📎 File MIME: ${googleFile.file.mimeType}`);

    // Step 2: Wait for file to be ready (if needed)
    let file = googleFile.file;
    let attempts = 0;
    const maxAttempts = 30;

    while (file.state === 'PROCESSING' && attempts < maxAttempts) {
      console.log(`⏳ Waiting for file processing... (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        file = await fileManager.getFile(file.name);
        console.log(`📊 File state: ${file.state}`);
      } catch (getError) {
        console.warn(`⚠️ Could not check file state: ${getError.message}`);
        break;
      }
      
      attempts++;
    }

    if (file.state === 'FAILED') {
      throw new Error('File processing failed on Google\'s servers');
    }

    // Step 3: Generate content using model fallback strategy
    const context = `
Course: ${courseCode ? `${courseCode} - ` : ''}${courseTitle || 'N/A'}
Document Title: ${title}
${description ? `Description: ${description}` : ''}
File Type: ${fileType.toUpperCase()}
    `.trim();

    const prompt = `You are an expert academic tutor helping university students study efficiently.

${context}

**YOUR TASK:**
Analyze this document thoroughly and provide a comprehensive summary that includes:

1. **Main Topics**: List the key topics covered (use bullet points with -)
2. **Key Concepts**: Explain the most important concepts in simple terms
3. **Important Details**: Highlight critical information, formulas, definitions, or facts
4. **Visual Elements**: Describe any diagrams, charts, or tables and their significance
5. **Study Tips**: Suggest 2-3 specific ways students can use this material effectively
6. **Quick Reference**: Create a brief 2-3 sentence overview for quick revision

**IMPORTANT FORMATTING RULES:**
- Use Markdown with clear headings (## for main sections, ### for subsections)
- Use bullet points with - for lists
- Write formulas as LaTeX math: use $formula$ for inline or $$formula$$ for display
  Example: $\\frac{1}{2}$ for fractions, $\\sum_{i=1}^{n} x_i$ for sums
- Keep the summary concise but comprehensive (400-600 words)
- Use simple language that students can easily understand

Analyze the ENTIRE document including all pages, diagrams, and formatted content.`;

    // Try multiple models with fallback
    const models = [GEMINI_VISION_MODEL, 'gemini-1.5-flash', 'gemini-pro'];
    let summaryText = null;
    let modelUsed = null;
    let tokensUsed = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        console.log(`🚀 Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log(`📤 Sending to Gemini with:`);
        console.log(`   - fileData.mimeType: ${file.mimeType}`);
        console.log(`   - fileData.fileUri: ${file.uri}`);
        console.log(`   - prompt length: ${prompt.length} chars`);

        const result = await model.generateContent([
          {
            fileData: {
              mimeType: file.mimeType,
              fileUri: file.uri
            }
          },
          { text: prompt }
        ]);

        const textResponse = await result.response;
        summaryText = textResponse.text();
        modelUsed = modelName;

        console.log(`✅ Received response from Gemini!`);
        console.log(`📝 Summary length: ${summaryText.length} chars`);
        console.log(`📋 First 200 chars: ${summaryText.substring(0, 200)}...`);

        // Get token usage
        try {
          const usageMetadata = textResponse.usageMetadata;
          if (usageMetadata) {
            tokensUsed = (usageMetadata.promptTokenCount || 0) + (usageMetadata.candidatesTokenCount || 0);
            console.log(`📊 Tokens used: ${tokensUsed} (prompt: ${usageMetadata.promptTokenCount}, response: ${usageMetadata.candidatesTokenCount})`);
          }
        } catch (e) {
          console.log('Could not extract token usage:', e.message);
        }

        console.log(`✅ Successfully generated summary with ${modelName}`);
        break;

      } catch (error) {
        lastError = error;
        const is503 = error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded');
        
        if (is503 && modelName !== models[models.length - 1]) {
          console.warn(`⚠️ ${modelName} returned 503 (High Demand). Trying fallback model...`);
          continue;
        } else if (modelName !== models[models.length - 1]) {
          console.warn(`⚠️ ${modelName} failed: ${error.message}. Trying fallback model...`);
          continue;
        } else {
          throw error;
        }
      }
    }

    if (!summaryText) {
      throw lastError || new Error('All models failed to generate summary');
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Summary generated in ${processingTime}ms`);

    return {
      summary: summaryText,
      model: modelUsed,
      tokensUsed,
      success: true,
      hadFullText: true,
      extractionNote: 'Analyzed using Google Files API with client-uploaded file (most reliable method)',
      processingTime
    };

  } catch (error) {
    console.error('❌ Summary generation error:', error);
    throw error;
  } finally {
    // Clean up - delete Google file
    if (googleFile?.file?.name) {
      try {
        await fileManager.deleteFile(googleFile.file.name);
        console.log(`🗑️ Deleted uploaded file from Google: ${googleFile.file.name}`);
      } catch (cleanupError) {
        console.warn(`Could not delete Google file: ${cleanupError.message}`);
      }
    }
    
    // Clean up - delete temp file (will be done by controller after response)
  }
};

/**
 * Generate summary using Google's Files API (Best for complex/multi-page PDFs)
 * Uses the working flow from the reference implementation
 * @param {Object} options - Summary options
 * @returns {Promise<Object>} Summary result
 */
export const generateSummaryWithFilesAPI = async (options) => {
  const startTime = Date.now();
  let tempFilePath = null;
  let googleFile = null;

  try {
    const { fileUrl, fileType, title, description, courseCode, courseTitle } = options;

    console.log(`📁 Using Google Files API for ${fileType}...`);

    // Step 1: Download the file to a temporary location
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60 seconds
      maxContentLength: 100 * 1024 * 1024 // 100MB
    });

    const buffer = Buffer.from(response.data);
    console.log(`✅ Downloaded file: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Determine MIME type
    const mimeTypes = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      txt: 'text/plain',
      md: 'text/markdown'
    };
    const mimeType = mimeTypes[fileType.toLowerCase()] || 'application/pdf';

    // Step 2: Save to temporary file
    const tempDir = os.tmpdir();
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    tempFilePath = path.join(tempDir, `${sanitizedTitle}_${Date.now()}.${fileType}`);
    
    fs.writeFileSync(tempFilePath, buffer);
    console.log(`💾 Saved to temp file: ${tempFilePath}`);

    // Step 3: Upload file to Google's Files API (working approach from reference)
    console.log(`☁️ Uploading to Google Files API...`);
    googleFile = await fileManager.uploadFile(tempFilePath, {
      mimeType: mimeType,
      displayName: title
    });

    console.log(`✅ File uploaded: ${googleFile.file.uri}`);
    console.log(`📊 File name: ${googleFile.file.name}`);

    // Step 4: Wait for file to be ready (if needed)
    // Note: Most files are ACTIVE immediately, but some may need processing
    let file = googleFile.file;
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds max wait

    while (file.state === 'PROCESSING' && attempts < maxAttempts) {
      console.log(`⏳ Waiting for file processing... (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      // Get file status
      try {
        file = await fileManager.getFile(file.name);
        console.log(`📊 File state: ${file.state}`);
      } catch (getError) {
        console.warn(`⚠️ Could not check file state: ${getError.message}`);
        break; // Continue anyway
      }
      
      attempts++;
    }

    if (file.state === 'FAILED') {
      throw new Error('File processing failed on Google\'s servers');
    }

    // Step 5: Generate content using model fallback strategy (from reference)
    const context = `
Course: ${courseCode ? `${courseCode} - ` : ''}${courseTitle || 'N/A'}
Document Title: ${title}
${description ? `Description: ${description}` : ''}
File Type: ${fileType.toUpperCase()}
    `.trim();

    const prompt = `You are an expert academic tutor helping university students study efficiently.

${context}

**YOUR TASK:**
Analyze this document thoroughly and provide a comprehensive summary that includes:

1. **Main Topics**: List the key topics covered (use bullet points with -)
2. **Key Concepts**: Explain the most important concepts in simple terms
3. **Important Details**: Highlight critical information, formulas, definitions, or facts
4. **Visual Elements**: Describe any diagrams, charts, or tables and their significance
5. **Study Tips**: Suggest 2-3 specific ways students can use this material effectively
6. **Quick Reference**: Create a brief 2-3 sentence overview for quick revision

**IMPORTANT FORMATTING RULES:**
- Use Markdown with clear headings (## for main sections, ### for subsections)
- Use bullet points with - for lists
- Write formulas as LaTeX math: use $formula$ for inline or $$formula$$ for display
  Example: $\\frac{1}{2}$ for fractions, $\\sum_{i=1}^{n} x_i$ for sums
- Keep the summary concise but comprehensive (400-600 words)
- Use simple language that students can easily understand

Analyze the ENTIRE document including all pages, diagrams, and formatted content.`;

    // Try multiple models with fallback (working strategy from reference)
    const models = [GEMINI_VISION_MODEL, 'gemini-1.5-flash', 'gemini-pro'];
    let summaryText = null;
    let modelUsed = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        console.log(`🚀 Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent([
          {
            fileData: {
              mimeType: file.mimeType,
              fileUri: file.uri
            }
          },
          { text: prompt }
        ]);

        const textResponse = await result.response;
        summaryText = textResponse.text();
        modelUsed = modelName;

        // Get token usage
        let tokensUsed = null;
        try {
          const usageMetadata = textResponse.usageMetadata;
          if (usageMetadata) {
            tokensUsed = (usageMetadata.promptTokenCount || 0) + (usageMetadata.candidatesTokenCount || 0);
            console.log(`📊 Tokens used: ${tokensUsed}`);
          }
        } catch (e) {
          console.log('Could not extract token usage:', e.message);
        }

        console.log(`✅ Successfully generated summary with ${modelName}`);
        break; // Success! Exit loop

      } catch (error) {
        lastError = error;
        const is503 = error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded');
        
        if (is503 && modelName !== models[models.length - 1]) {
          console.warn(`⚠️ ${modelName} returned 503 (High Demand). Trying fallback model...`);
          continue; // Try next model
        } else if (modelName !== models[models.length - 1]) {
          console.warn(`⚠️ ${modelName} failed: ${error.message}. Trying fallback model...`);
          continue; // Try next model
        } else {
          throw error; // Last model failed, throw error
        }
      }
    }

    if (!summaryText) {
      throw lastError || new Error('All models failed to generate summary');
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Files API summary generated in ${processingTime}ms`);

    return {
      summary: summaryText,
      model: modelUsed,
      tokensUsed: null,
      success: true,
      hadFullText: true,
      extractionNote: 'Analyzed using Google Files API (supports multi-page PDFs, diagrams, complex layouts)',
      processingTime
    };

  } catch (error) {
    console.error('❌ Files API error:', error);
    throw error;
  } finally {
    // Step 6: Clean up - delete temp file and Google file (working cleanup from reference)
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`🗑️ Deleted temp file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.warn('Could not delete temp file:', cleanupError.message);
      }
    }

    if (googleFile?.file?.name) {
      try {
        await fileManager.deleteFile(googleFile.file.name);
        console.log(`🗑️ Deleted uploaded file from Google: ${googleFile.file.name}`);
      } catch (cleanupError) {
        console.warn(`Could not delete Google file: ${cleanupError.message}`);
      }
    }
  }
};

/**
 * Generate summary using Gemini's native file/image processing (for PDFs with images/scans)
 * @param {Object} options - Summary options
 * @returns {Promise<Object>} Summary result
 */
export const generateSummaryWithVision = async (options) => {
  const startTime = Date.now();
  
  try {
    const { fileUrl, fileType, title, description, courseCode, courseTitle } = options;

    console.log(`👁️ Attempting vision-based extraction for ${fileType}...`);

    // Download the file as binary
    const fileResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024 // 50MB
    });

    const buffer = Buffer.from(fileResponse.data);
    const base64Data = buffer.toString('base64');

    // Determine MIME type
    const mimeTypes = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp'
    };
    const mimeType = mimeTypes[fileType.toLowerCase()] || 'application/pdf';

    console.log(`📄 File downloaded: ${buffer.length} bytes, MIME: ${mimeType}`);

    // Use Gemini 1.5 Pro with vision capabilities
    const model = genAI.getGenerativeModel({ model: GEMINI_VISION_MODEL });

    const context = `
Course: ${courseCode ? `${courseCode} - ` : ''}${courseTitle || 'N/A'}
Document Title: ${title}
${description ? `Description: ${description}` : ''}
File Type: ${fileType.toUpperCase()}
    `.trim();

    const prompt = `You are an AI assistant helping university students study more efficiently. 
You have been given a document (PDF or image) from a student's study materials that may contain text, images, diagrams, or scanned content.

${context}

**YOUR TASK:**
Analyze this document carefully and provide a comprehensive summary that includes:

1. **Main Topics**: List the key topics covered (use bullet points)
2. **Key Concepts**: Explain the most important concepts in simple terms
3. **Important Details**: Highlight critical information, formulas, definitions, diagrams, or facts
4. **Visual Elements**: Describe any diagrams, charts, or tables and their significance
5. **Study Tips**: Suggest 2-3 specific ways students can use this material effectively
6. **Quick Reference**: Create a brief 2-3 sentence overview for quick revision

**FORMAT REQUIREMENTS:**
- Use markdown with clear headings (##)
- Use bullet points for lists
- Keep the summary concise but comprehensive (aim for 400-600 words)
- Use simple language that students can easily understand
- If text is unclear or image quality is poor, mention this
- Transcribe any important formulas, equations, or code snippets you see

Focus on extracting ALL visible content from the document, including text in images.`;

    // Create the request with inline data
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    console.log(`🚀 Sending to Gemini Vision AI (${GEMINI_VISION_MODEL})...`);
    
    const result = await model.generateContent([prompt, imagePart]);
    const visionResponse = await result.response;
    const summaryText = visionResponse.text();

    // Get token usage
    let tokensUsed = null;
    try {
      const usageMetadata = visionResponse.usageMetadata;
      if (usageMetadata) {
        tokensUsed = (usageMetadata.promptTokenCount || 0) + (usageMetadata.candidatesTokenCount || 0);
        console.log(`📊 Tokens used: ${tokensUsed}`);
      }
    } catch (e) {
      console.log('Could not extract token usage:', e.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Vision-based summary generated in ${processingTime}ms`);

    return {
      summary: summaryText,
      model: GEMINI_VISION_MODEL,
      tokensUsed,
      success: true,
      hadFullText: true,
      extractionNote: 'Analyzed using Gemini Vision AI (supports scanned/image-based PDFs)',
      processingTime
    };

  } catch (error) {
    console.error('❌ Vision extraction error:', error);
    throw error;
  }
};

/**
 * Generate summary for a document with actual file content extraction
 * Automatically tries text extraction first, then falls back to vision AI for PDFs
 * @param {Object} options - Summary generation options
 * @param {string} options.fileUrl - URL of the file to summarize
 * @param {string} options.fileType - Type of file (pdf, docx, pptx, etc.)
 * @param {string} options.title - Title of the document
 * @param {string} options.description - Description of the document
 * @param {string} options.courseCode - Course code
 * @param {string} options.courseTitle - Course title
 * @returns {Promise<Object>} Summary result
 */
export const generateSummary = async (options) => {
  const startTime = Date.now();
  
  try {
    const { fileUrl, fileType, title, description, courseCode, courseTitle } = options;

    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      throw new AppError('Gemini API key is not configured', 500);
    }

    console.log(`🤖 Starting AI summarization for: ${title}`);
    console.log(`📎 File type: ${fileType}, URL: ${fileUrl}`);

    // Get the model
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Build context for better summarization
    const context = `
Course: ${courseCode ? `${courseCode} - ` : ''}${courseTitle || 'N/A'}
Document Title: ${title}
${description ? `Description: ${description}` : ''}
File Type: ${fileType.toUpperCase()}
    `.trim();

    let fullText = null;
    let extractionNote = '';

    // Try to extract actual file content
    if (isSupportedFileType(fileType)) {
      try {
        console.log(`📄 Extracting text from ${fileType} file...`);
        fullText = await extractTextFromFile(fileUrl, fileType);
        
        // Check if extraction returned meaningful content
        if (!fullText || fullText.trim().length < 50) {
          throw new Error('PDF appears to be image-based or empty - using vision AI instead');
        }
        
        // Truncate if too long (Gemini has token limits)
        const originalLength = fullText.length;
        fullText = truncateText(fullText, 30000); // ~7500 words max
        
        if (fullText.length < originalLength) {
          extractionNote = `Note: Document was truncated from ${originalLength} to ${fullText.length} characters due to length.`;
        }
        
        console.log(`✅ Successfully extracted ${fullText.length} characters from document`);
      } catch (extractionError) {
        console.warn(`⚠️ Text extraction failed: ${extractionError.message}`);
        console.error('Full extraction error:', extractionError);
        
        // For PDFs, try Files API (best for complex/multi-page PDFs)
        if (fileType.toLowerCase() === 'pdf') {
          console.log(`🔄 Switching to Google Files API for PDF...`);
          try {
            return await generateSummaryWithFilesAPI(options);
          } catch (filesAPIError) {
            console.error(`❌ Files API failed: ${filesAPIError.message}`);
            console.error('Full Files API error:', filesAPIError);
            // Try vision as final fallback
            console.log(`🔄 Trying vision-based extraction as final fallback...`);
            try {
              return await generateSummaryWithVision(options);
            } catch (visionError) {
              console.error(`❌ All extraction methods failed: ${visionError.message}`);
              console.error('Full vision error:', visionError);
              extractionNote = `Note: All extraction methods failed. Summary based on metadata only.`;
            }
          }
        } else {
          extractionNote = `Note: Could not extract text from file (${extractionError.message}). Summary based on metadata only.`;
        }
      }
    } else {
      extractionNote = `Note: File type ${fileType} does not support text extraction. Summary based on metadata only.`;
      console.log(`ℹ️ ${extractionNote}`);
    }

    // Create enhanced prompt with actual content or metadata-only
    let prompt;
    
    if (fullText) {
      prompt = `You are an AI assistant helping university students study more efficiently. 
You have been given the FULL TEXT CONTENT of a document from a student's study materials.

${context}

${extractionNote ? extractionNote + '\n' : ''}

**DOCUMENT CONTENT:**
${fullText}

**YOUR TASK:**
Please analyze this document and provide a comprehensive summary that includes:

1. **Main Topics**: List the key topics covered (use bullet points)
2. **Key Concepts**: Explain the most important concepts in simple terms
3. **Important Details**: Highlight critical information, formulas, definitions, or facts that appear in the document
4. **Study Tips**: Suggest 2-3 specific ways students can use this material effectively
5. **Quick Reference**: Create a brief 2-3 sentence overview for quick revision

**FORMAT REQUIREMENTS:**
- Use markdown with clear headings (##)
- Use bullet points for lists
- Keep the summary concise but comprehensive (aim for 300-500 words)
- Use simple language that students can easily understand
- Be specific and reference actual content from the document

Focus on the ACTUAL CONTENT you see in the document text above, not just the title.`;
    } else {
      prompt = `You are an AI assistant helping university students study more efficiently. 
You have been given metadata about a document, but the actual content could not be extracted.

${context}

${extractionNote}

**YOUR TASK:**
Based on the document title, description, and course context, provide a helpful summary that includes:

1. **Likely Topics**: Based on the title and course, what topics might this cover?
2. **Study Approach**: How should students approach this type of material?
3. **Key Areas to Focus**: What areas are typically important in such documents?
4. **Study Tips**: General study tips for this type of content

**IMPORTANT**: Make it clear that this is a metadata-based summary and students should review the actual document for specific details.

Format your response in markdown with clear headings and bullet points (300-400 words).`;
    }

    // Generate content
    console.log(`🚀 Sending to Gemini AI (${GEMINI_MODEL})...`);
    const result = await model.generateContent(prompt);
    const textResponse = await result.response;
    const summaryText = textResponse.text();

    // Get token usage if available
    let tokensUsed = null;
    try {
      const usageMetadata = textResponse.usageMetadata;
      if (usageMetadata) {
        tokensUsed = (usageMetadata.promptTokenCount || 0) + (usageMetadata.candidatesTokenCount || 0);
        console.log(`📊 Tokens used: ${tokensUsed} (prompt: ${usageMetadata.promptTokenCount}, response: ${usageMetadata.candidatesTokenCount})`);
      }
    } catch (e) {
      console.log('Could not extract token usage:', e.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Summary generated successfully in ${processingTime}ms`);

    return {
      summary: summaryText,
      model: GEMINI_MODEL,
      tokensUsed,
      success: true,
      hadFullText: !!fullText,
      extractionNote: extractionNote || null,
      processingTime
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY')) {
      throw new AppError('Invalid Gemini API key configuration', 500);
    }
    
    if (error.message?.includes('QUOTA')) {
      throw new AppError('AI service quota exceeded. Please try again later.', 429);
    }

    if (error.message?.includes('SAFETY')) {
      throw new AppError('Content filtered by AI safety systems', 400);
    }

    throw new AppError(error.message || 'Failed to generate summary', 500);
  }
};

/**
 * Enhanced version that attempts to extract text from document URL
 * This now uses the file extractor service
 */
export const generateSummaryWithExtraction = async (options) => {
  // This is now the default behavior in generateSummary
  return generateSummary(options);
};

/**
 * Test Gemini API connection
 */
export const testGeminiConnection = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        message: 'Gemini API key is not configured'
      };
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent('Hello, respond with OK if you receive this.');
    const testResponse = await result.response;
    
    return {
      success: true,
      message: 'Gemini API connection successful',
      model: GEMINI_MODEL
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to connect to Gemini API'
    };
  }
};
