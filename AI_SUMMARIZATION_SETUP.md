# AI Summarization Feature Setup Guide

## Overview
The AI Summarization feature uses Google's Gemini API to generate intelligent summaries of study materials. This document explains how to set up and configure this feature.

---

## Prerequisites

1. **Google Account** - Required to get Gemini API key
2. **Node.js & npm** - Already installed
3. **Running MUT Study Hub** - Backend server must be operational

---

## Step 1: Install Required Package

Navigate to the server directory and install the Google Generative AI package:

```bash
cd server
npm install @google/generative-ai
```

This package provides the official Google Gemini AI SDK for Node.js.

---

## Step 2: Get Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Get API Key" or "Create API Key"
   - Select "Create API key in new project" (recommended)
   - Copy the generated API key

3. **API Key Features**
   - ✅ Free tier available with generous limits
   - ✅ No credit card required for testing
   - ✅ Supports text generation and analysis
   - ⚠️ Keep your API key secure - never commit to git

---

## Step 3: Configure Environment Variables

Add the Gemini API key to your `.env` file:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_actual_api_key_here
```

**Example:**
```env
GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

---

## Step 4: Verify Installation

### Test API Connection

You can test the Gemini API connection using this simple script:

Create `server/test-gemini.js`:

```javascript
import { testGeminiConnection } from './services/geminiService.js';

testGeminiConnection().then(result => {
  console.log(result);
  process.exit(result.success ? 0 : 1);
});
```

Run the test:
```bash
node test-gemini.js
```

Expected output:
```json
{
  "success": true,
  "message": "Gemini API connection successful",
  "model": "gemini-1.5-flash"
}
```

---

## Step 5: Run Database Migration

The database migration for AI summaries should run automatically on server startup. However, you can manually verify:

```bash
# Check if migration ran
psql -d mut_study_hub -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'advanced_features_enabled';"
```

Should return:
```
 column_name
--------------
 advanced_features_enabled
```

---

## How It Works

### User Flow

1. **Enable Advanced Features**
   - User navigates to Settings page
   - Toggles "Advanced Features" switch ON
   - This sets `advanced_features_enabled = true` in database

2. **Generate Summary**
   - User views a resource on Dashboard
   - Clicks "Summarize" button (appears next to "Mark as Complete")
   - AI generates summary using Gemini API
   - Summary is saved to `ai_summaries` table

3. **View History**
   - User accesses Summary History page
   - Sees all previously generated summaries
   - Can review, revisit, or delete summaries

### Backend Flow

```
User Request → Auth Check → Feature Check → Get Resource → Call Gemini API → Save Summary → Return to User
```

### Database Schema

**users table:**
- `advanced_features_enabled` BOOLEAN - Feature flag

**ai_summaries table:**
- User & resource references
- Summary text and metadata
- AI model info and token usage
- Processing time tracking
- Status (completed/failed/processing)

---

## API Endpoints

### Settings Endpoints

**Get Settings**
```http
GET /api/auth/settings
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "advancedFeaturesEnabled": false
  }
}
```

**Update Settings**
```http
PUT /api/auth/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "advancedFeaturesEnabled": true
}

Response:
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "advancedFeaturesEnabled": true
  }
}
```

### AI Summarization Endpoints

**Generate Summary**
```http
POST /api/ai/summarize
Authorization: Bearer {token}
Content-Type: application/json

{
  "resourceId": 123
}

Response:
{
  "success": true,
  "message": "Summary generated successfully",
  "data": {
    "summary": {
      "id": 1,
      "summary_text": "...",
      "created_at": "2026-09-09T...",
      ...
    },
    "isNew": true
  }
}
```

**Get Summary History**
```http
GET /api/ai/summaries?page=1&limit=20&status=completed
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "summaries": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalSummaries": 42,
      "limit": 20
    }
  }
}
```

**Get Summary Stats**
```http
GET /api/ai/summaries/stats
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "total_summaries": 42,
    "completed_summaries": 40,
    "failed_summaries": 2,
    "total_tokens_used": 12500,
    "avg_processing_time_ms": 3200
  }
}
```

**Delete Summary**
```http
DELETE /api/ai/summaries/:id
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Summary deleted successfully"
}
```

---

## Features

### Summary Caching
- If user requests summary for same resource within 24 hours, existing summary is returned
- Reduces API calls and improves response time

### Error Handling
- Failed summaries are saved with error messages
- Users can retry failed summaries
- Quota exceeded errors are handled gracefully

### Token Tracking
- Records tokens used for each summary
- Helps monitor API usage
- Can be used for cost analysis

### Processing Time
- Tracks how long each summary takes
- Useful for performance monitoring
- Average processing time: 2-5 seconds

---

## Gemini API Limits (Free Tier)

- **Rate Limit**: 15 requests per minute
- **Daily Limit**: 1,500 requests per day
- **Token Limit**: 1M tokens per minute
- **Model**: gemini-1.5-flash (fast and efficient)

For higher limits, upgrade to paid plan at: https://ai.google.dev/pricing

---

## Security Best Practices

1. **API Key Security**
   - Never commit API key to version control
   - Use environment variables only
   - Add `.env` to `.gitignore`

2. **Rate Limiting**
   - Backend already implements rate limiting
   - Prevents API abuse

3. **User Authorization**
   - Feature gated behind `advanced_features_enabled` flag
   - Only authenticated users can access
   - Users can only access their own summaries

4. **Input Validation**
   - Resource ID validation
   - User ownership verification
   - File type checking

---

## Troubleshooting

### Issue: "Gemini API key is not configured"
**Solution**: Add `GEMINI_API_KEY` to `.env` file

### Issue: "Advanced features are not enabled"
**Solution**: User must enable Advanced Features in Settings page

### Issue: "API_KEY_INVALID"
**Solution**: Verify API key is correct and active in Google AI Studio

### Issue: "QUOTA_EXCEEDED"
**Solution**: 
- Wait for quota to reset (daily/hourly)
- Or upgrade to paid plan
- Or contact Google Cloud support

### Issue: Summary generation is slow
**Solution**:
- Normal processing time is 2-5 seconds
- Large documents may take longer
- Check network connectivity
- Verify Gemini API status

---

## Future Enhancements

Planned improvements for AI summarization:

1. **Document Text Extraction**
   - Parse PDF content directly
   - Extract text from DOCX, PPTX files
   - More accurate summaries

2. **Custom Summary Formats**
   - Bullet points only
   - Detailed analysis
   - Quick reference cards
   - Flashcards generation

3. **Multiple Languages**
   - Support for non-English documents
   - Swahili language summaries
   - Multi-language interface

4. **Advanced AI Features**
   - Question answering from documents
   - Key concept extraction
   - Quiz generation
   - Study plan recommendations

---

## Support

If you encounter issues:

1. Check server logs: `npm run dev` (look for errors)
2. Verify database migration ran successfully
3. Test Gemini API connection
4. Check `.env` configuration
5. Review API rate limits

For additional help, contact the development team or create an issue in the repository.

---

## Resources

- **Gemini API Documentation**: https://ai.google.dev/docs
- **Google AI Studio**: https://aistudio.google.com
- **Pricing**: https://ai.google.dev/pricing
- **Node.js SDK**: https://www.npmjs.com/package/@google/generative-ai

---

**Last Updated**: September 9, 2026
**Version**: 1.0.0
