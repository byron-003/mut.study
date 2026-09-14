# Testing AI Summarization File Upload Flow

## 🔍 What to Check

When you click "Summarize" on a document, check these logs in order:

### 1. Browser Console (F12)
Look for these CLIENT logs:
```
📥 CLIENT: Starting file download from: https://...
📥 CLIENT: Fetch response status: 200
📥 CLIENT: Content-Type: application/pdf
📥 CLIENT: Content-Length: XXXXX bytes
📥 CLIENT: Blob created - size: XXXXX bytes, type: application/pdf
📤 CLIENT: FormData created with resourceId: X
📤 CLIENT: File in FormData - name: document.pdf, size: XXXXX bytes
📤 CLIENT: Sending to server /api/ai/summarize...
✅ CLIENT: Response received from server
```

**Problem Signs:**
- ❌ If size is 0 or very small → File download failed
- ❌ If Content-Type is wrong → File type issue
- ❌ If error during fetch → CORS or network issue

### 2. Server Console (Backend Terminal)
Look for these SERVER logs in order:

**A. File Upload to Server:**
```
📄 ===== FILE UPLOAD DEBUG =====
📄 File received: document.pdf
📊 File size: XXXXX bytes (X.XX MB)
📎 MIME type: application/pdf
💾 Temp path: C:\Users\...\temp-uploads\...
🔍 File exists: true
📄 ==============================
```

**Problem Signs:**
- ❌ File size = 0 → Upload failed
- ❌ File exists = false → Temp file not saved
- ❌ MIME type wrong → File type detection issue

**B. Google Files API Upload:**
```
🤖 ===== GEMINI UPLOAD DEBUG =====
📁 Processing uploaded file: C:\Users\...\temp-uploads\...
📎 File type: pdf, MIME: application/pdf
📊 File exists: true
📊 File size: XXXXX bytes (X.XX MB)
🤖 ================================
☁️ Uploading to Google Files API...
📤 Upload params: mimeType=application/pdf, displayName=...
✅ File uploaded to Google successfully!
🔗 File URI: https://generativelanguage.googleapis.com/v1beta/files/...
📛 File name: files/...
📊 File state: ACTIVE
📎 File MIME: application/pdf
```

**Problem Signs:**
- ❌ Upload fails → Check GEMINI_API_KEY
- ❌ File state = PROCESSING forever → Wait or retry
- ❌ File state = FAILED → Google rejected file

**C. Gemini Content Generation:**
```
🚀 Trying model: gemini-1.5-pro...
📤 Sending to Gemini with:
   - fileData.mimeType: application/pdf
   - fileData.fileUri: https://generativelanguage.googleapis.com/...
   - prompt length: XXXX chars
✅ Received response from Gemini!
📝 Summary length: XXXX chars
📋 First 200 chars: ## Main Topics...
📊 Tokens used: XXXX (prompt: XXX, response: XXX)
✅ Successfully generated summary with gemini-1.5-pro
```

**Problem Signs:**
- ❌ "metadata only" in response → File not reaching Gemini
- ❌ Disclaimer about no content → File upload to Gemini failed
- ❌ Error 503 → Gemini overloaded (will try fallback)
- ❌ Error 400 → Invalid request format

### 3. Summary Response
Check the actual summary text:
- ✅ Should mention actual content from the PDF
- ✅ Should have specific topics/concepts from the document
- ❌ If it says "metadata only" → File didn't reach Gemini
- ❌ If disclaimer about "document metadata only" → Text extraction failed

## 🐛 Common Issues & Solutions

### Issue 1: "Only unit title and description reaching Gemini"
**Cause:** File not being sent to Google Files API properly
**Check:**
1. Server logs show file size > 0
2. Google upload succeeds (✅ File uploaded to Google successfully!)
3. fileUri is passed to model.generateContent()

### Issue 2: File size is 0 bytes
**Cause:** Client not downloading file or server not receiving it
**Check:**
1. Browser console shows blob size > 0
2. Server receives req.file with size > 0

### Issue 3: "Disclaimer: ...metadata only..."
**Cause:** Old code path or file not uploaded to Google
**Check:**
1. Using `generateSummaryWithUploadedFile()` function
2. Google Files API upload succeeds
3. fileUri is valid in Gemini request

## ✅ Success Indicators

When working correctly, you should see:
1. ✅ CLIENT: Blob size matches file size
2. ✅ SERVER: File received with correct size
3. ✅ SERVER: File uploaded to Google successfully
4. ✅ SERVER: Gemini response mentions actual PDF content
5. ✅ UI: Summary includes specific topics from the document

## 🧪 Quick Test
1. Click "Summarize" on any PDF
2. Open Browser Console (F12)
3. Check server terminal
4. Compare logs with the checklist above
5. Report which step fails first

---

**Current Configuration:**
- Model: `gemini-1.5-pro` (supports Files API)
- API Key: Set in `.env` (starts with `AQ.Ab8...`)
- Upload Method: Client → Server → Google Files API → Gemini
