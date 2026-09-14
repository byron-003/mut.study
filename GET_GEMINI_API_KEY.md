# How to Get a Valid Gemini API Key

## ❌ Current Issue

Your API key appears to be invalid or in the wrong format.

**Current key format:** `AQ.Ab8RN6IINhZA...`  
**Expected format:** `AIzaSy...` (starts with "AIza")

---

## ✅ How to Get the Correct API Key

### Step 1: Go to Google AI Studio

Open this link in your browser:  
**https://aistudio.google.com/app/apikey**

### Step 2: Sign In

- Sign in with your Google account
- If you don't have one, create a free Google account first

### Step 3: Create API Key

1. Click **"Create API Key"** button
2. Select **"Create API key in new project"** (or use existing project)
3. Wait a few seconds for the key to be generated

### Step 4: Copy the API Key

- The key will look like: `AIzaSyBkXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Important**: It should start with `AIza`
- Copy the entire key

### Step 5: Update Your .env File

Open `server/.env` and replace the GEMINI_API_KEY line:

```env
GEMINI_API_KEY=AIzaSyYourActualKeyHere
```

**Example:**
```env
GEMINI_API_KEY=AIzaSyBkXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 6: Save and Restart

1. Save the `.env` file
2. Restart your server:
   ```bash
   cd server
   npm run dev
   ```

---

## 🧪 Test Your API Key

After updating, run this test:

```bash
cd server
node test-files-api.js
```

**Expected output:**
```
✅ API Response: Hello, API works!
✅ FileManager initialized
✅ Found 0 files
✅ All tests passed!
```

---

## 📝 Important Notes

### Free Tier Limits

Google Gemini API Free Tier includes:
- ✅ **60 requests per minute** (RPM)
- ✅ **1 million tokens per day**
- ✅ **Enough for thousands of summaries**
- ✅ **No credit card required**

### Supported Models

With a valid API key, you can use:
- ✅ `gemini-pro` - Stable, recommended
- ✅ `gemini-1.5-pro` - Latest, best quality
- ✅ `gemini-1.5-flash` - Fastest

### API Key Security

⚠️ **Keep your API key private!**
- Never commit to Git
- Don't share publicly
- Don't expose in client-side code
- Use `.env` file only (already in `.gitignore`)

---

## ❓ Troubleshooting

### "API key is invalid"

**Solution:** Get a new key from Google AI Studio

### "Model not found"

**Possible causes:**
1. Invalid API key
2. Wrong model name
3. API not enabled for your account

**Solution:**
1. Verify API key format (starts with `AIza`)
2. Use supported model name: `gemini-1.5-pro`
3. Check if you're in a supported region

### "Quota exceeded"

**Solution:**
- Wait 24 hours for quota reset
- Upgrade to paid tier if needed
- Check your usage dashboard

---

## 🔗 Useful Links

- **Get API Key**: https://aistudio.google.com/app/apikey
- **API Documentation**: https://ai.google.dev/docs
- **Pricing**: https://ai.google.dev/pricing
- **Supported Models**: https://ai.google.dev/models/gemini

---

## ✅ After Getting Valid Key

Once you have a valid API key:

1. Update `server/.env`:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   GEMINI_MODEL=gemini-1.5-pro
   ```

2. Test it:
   ```bash
   node test-files-api.js
   ```

3. Try summarizing a PDF!
   - Upload a PDF
   - Click "Summarize"
   - Should see actual content extracted

---

**Your AI summarization will work perfectly once you have a valid API key! 🚀**
