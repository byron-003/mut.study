# Gemini Model Configuration Guide

## Quick Reference

The Gemini AI model is now configurable via environment variable!

---

## How to Change the Model

### Option 1: Edit `.env` File (Recommended)

```env
# In server/.env
GEMINI_MODEL=gemini-pro
```

**Available Models:**
- `gemini-pro` - Stable, production-ready (default)
- `gemini-1.5-pro` - Latest with enhanced features
- `gemini-1.5-flash` - Faster, optimized for speed

### Option 2: Edit Code Directly

If you don't set `GEMINI_MODEL` in `.env`, you can change the default in `server/services/geminiService.js`:

```javascript
// Line 7-8
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';
```

Just change `'gemini-pro'` to your preferred model.

---

## Model Comparison

### `gemini-pro`
- ✅ **Status**: Stable, production-ready
- ⚡ **Speed**: Fast
- 🎯 **Use For**: General purpose, reliable summaries
- 💰 **Cost**: Free tier available
- 📝 **Recommended For**: Production use

### `gemini-1.5-pro`
- ✅ **Status**: Latest version
- ⚡ **Speed**: Fast with larger context window
- 🎯 **Use For**: Complex documents, longer texts
- 💰 **Cost**: Free tier available
- 📝 **Recommended For**: Advanced features, larger documents
- ⚠️ **Note**: May not be available in all regions yet

### `gemini-1.5-flash`
- ✅ **Status**: Optimized for speed
- ⚡ **Speed**: Very fast
- 🎯 **Use For**: Quick summaries, real-time responses
- 💰 **Cost**: Lower cost per request
- 📝 **Recommended For**: High-volume usage, quick summaries
- ⚠️ **Note**: May have slightly less detailed output

---

## How It Works

The model configuration is centralized in one place:

```javascript
// server/services/geminiService.js (Top of file)

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';
```

This constant is used in **three places**:
1. `generateSummary()` - When generating summaries
2. `testGeminiConnection()` - When testing API connection
3. Return value - Stored in database for tracking

**Benefits:**
- ✅ Change once, applies everywhere
- ✅ Can override via environment variable
- ✅ Easy to test different models
- ✅ No code changes needed (just .env)

---

## Testing Different Models

### Step 1: Update `.env`
```env
GEMINI_MODEL=gemini-1.5-flash
```

### Step 2: Restart Server
```bash
cd server
npm run dev
```

### Step 3: Test
1. Go to any resource
2. Click "Summarize"
3. Check the summary quality and speed

### Step 4: Compare
Check the database to see which model was used:

```sql
SELECT id, resource_id, ai_model, processing_time_ms, tokens_used 
FROM ai_summaries 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Troubleshooting

### Model Not Found Error

**Error**: `models/XXX is not found for API version v1beta`

**Solutions:**
1. Check the model name is correct (no typos)
2. Verify the model is available: https://ai.google.dev/models
3. Try a different model:
   ```env
   GEMINI_MODEL=gemini-pro
   ```

### Slow Response Times

**Issue**: Summaries taking too long

**Solutions:**
1. Switch to faster model:
   ```env
   GEMINI_MODEL=gemini-1.5-flash
   ```
2. Check your internet connection
3. Verify API quota isn't exhausted

### Different Quality Results

**Issue**: Summaries not as detailed as expected

**Solutions:**
1. Switch to more powerful model:
   ```env
   GEMINI_MODEL=gemini-1.5-pro
   ```
2. Adjust prompt in `generateSummary()` function
3. Check token limits aren't being hit

---

## Best Practices

### For Production
```env
GEMINI_MODEL=gemini-pro
```
✅ Stable, tested, reliable

### For Development
```env
GEMINI_MODEL=gemini-1.5-flash
```
✅ Faster iteration, quick testing

### For Best Quality
```env
GEMINI_MODEL=gemini-1.5-pro
```
✅ Most advanced features, best results

---

## Model Feature Matrix

| Feature | gemini-pro | gemini-1.5-pro | gemini-1.5-flash |
|---------|-----------|----------------|------------------|
| Speed | Fast | Fast | Very Fast |
| Quality | High | Very High | Good |
| Context Window | 30K tokens | 1M tokens | 1M tokens |
| Stability | ✅ Stable | ⚠️ Beta | ⚠️ Beta |
| Cost | Low | Medium | Very Low |
| Availability | ✅ Global | ⚠️ Limited | ⚠️ Limited |

---

## Configuration Files

### Environment Variable
**File**: `server/.env`
```env
GEMINI_MODEL=gemini-pro
```

### Code Constant
**File**: `server/services/geminiService.js`
```javascript
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';
```

### Database Storage
**Table**: `ai_summaries.ai_model`

This column stores which model was used for each summary, allowing you to:
- Track model performance
- Compare results across models
- Audit AI usage

---

## Checking Current Model

### In Code
```javascript
console.log('Using model:', GEMINI_MODEL);
```

### In Database
```sql
SELECT DISTINCT ai_model, COUNT(*) as usage_count 
FROM ai_summaries 
GROUP BY ai_model;
```

### Via API Test
```bash
node server/test-gemini.js
```

Output will show:
```json
{
  "success": true,
  "message": "Gemini API connection successful",
  "model": "gemini-pro"
}
```

---

## Migration Between Models

If you want to change models for production:

1. **Backup current summaries**
2. **Test new model** with a few summaries
3. **Compare results** - check quality and speed
4. **Update `.env`** with new model
5. **Restart server**
6. **Monitor** - check error rates and user feedback

New summaries will use the new model, old summaries remain unchanged.

---

## Resources

- **Google AI Studio**: https://aistudio.google.com
- **Model Documentation**: https://ai.google.dev/models
- **API Reference**: https://ai.google.dev/api/rest
- **Pricing**: https://ai.google.dev/pricing

---

**Last Updated**: 2026-09-09
**Version**: 1.1.0
