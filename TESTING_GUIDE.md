# Testing Guide - Rate Limiting & Program Requirements

## 🧪 How to Test the New Features

### ✅ Test 1: Program Field Required in Registration

**Steps:**
1. Navigate to registration page: `http://localhost:5173/register`
2. Fill in all fields EXCEPT the program field
3. Try to submit the form
4. **Expected Result:** Error message "Please select your program"

**Visual Check:**
- Program field should have a red asterisk (*) next to label
- Input should have `required` attribute

---

### ✅ Test 2: Login Rate Limiting (5 attempts / 5 minutes)

**Steps:**
1. Navigate to login page: `http://localhost:5173/login`
2. Enter any email (e.g., `test@example.com`)
3. Enter wrong password
4. Submit 6 times in a row
5. **Expected Result:** 
   - First 5 attempts: "Login failed. Please try again."
   - 6th attempt: "Too many login attempts. Please try again after 5 minutes."
   - HTTP Status: 429 (Too Many Requests)

**Reset:**
- Wait 5 minutes OR restart server to reset counter

---

### ✅ Test 3: Registration Rate Limiting (3 attempts / 15 minutes)

**Steps:**
1. Register 4 different accounts from the same browser/IP
2. **Expected Result:**
   - First 3 registrations: Should work normally (or show validation errors)
   - 4th registration: "Too many registration attempts. Please try again after 15 minutes."
   - HTTP Status: 429

**Reset:**
- Wait 15 minutes OR restart server

---

### ✅ Test 4: Password Reset Rate Limiting (3 attempts / 15 minutes)

**Steps:**
1. Navigate to: `http://localhost:5173/forgot-password`
2. Request password reset 4 times
3. **Expected Result:**
   - First 3 attempts: OTP sent (or email not found message)
   - 4th attempt: "Too many password reset attempts. Please try again after 15 minutes."
   - HTTP Status: 429

**Also test OTP verification:**
1. Request OTP once
2. Enter wrong OTP 4 times
3. 4th attempt should be rate limited

**Reset:**
- Wait 15 minutes OR restart server

---

### ✅ Test 5: General API Rate Limiting (100 requests / 15 minutes)

**Steps:**
1. Make 101 API requests rapidly (you can use browser console):
```javascript
// Run this in browser console
for(let i = 0; i < 101; i++) {
  fetch('http://localhost:5000/api/schools')
    .then(r => console.log(`Request ${i+1}: ${r.status}`))
    .catch(e => console.error(`Request ${i+1}: Error`));
}
```

2. **Expected Result:**
   - First 100 requests: Status 200 (success)
   - 101st request: Status 429 (rate limited)

**Reset:**
- Wait 15 minutes OR restart server

---

## 📊 Rate Limit Response Format

When rate limit is exceeded, you'll receive:

```json
{
  "success": false,
  "message": "Too many login attempts. Please try again after 5 minutes.",
  "retryAfter": 300
}
```

**HTTP Headers:**
```
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1704067200
```

---

## 🔍 Monitoring Rate Limits

### **Check Rate Limit Headers (Browser DevTools):**

1. Open DevTools (F12)
2. Go to Network tab
3. Make a login request
4. Check response headers:
   - `RateLimit-Limit`: Total allowed requests
   - `RateLimit-Remaining`: Requests remaining in window
   - `RateLimit-Reset`: Unix timestamp when counter resets

### **Example:**
```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1704067800
```
This means: 5 max attempts, 3 remaining, resets at the timestamp

---

## 🐛 Troubleshooting

### **Rate limits not working:**
1. Check server is running: `http://localhost:5000/api/health`
2. Verify middleware is loaded (check server console)
3. Restart server to clear any issues

### **Rate limit hit too quickly:**
- Remember: limits are **per IP address**
- If testing from same computer, all attempts count
- Use incognito/different browser doesn't help (same IP)
- Restart server to reset all counters immediately

### **Can't register without program:**
- This is expected behavior!
- Program field is now required
- Select a program from dropdown before submitting

---

## ✅ Expected Behavior Summary

| Action | Limit | Window | Error After Limit |
|--------|-------|--------|-------------------|
| Login attempts | 5 | 5 min | "Too many login attempts. Please try again after 5 minutes." |
| Registrations | 3 | 15 min | "Too many registration attempts. Please try again after 15 minutes." |
| Password resets | 3 | 15 min | "Too many password reset attempts. Please try again after 15 minutes." |
| API requests | 100 | 15 min | "Too many requests from this IP. Please try again later." |
| Program field | N/A | Required | "Please select your program" |

---

## 🎯 Success Criteria

✅ **All tests pass if:**
1. Cannot submit registration without selecting program
2. Login blocked after 5 failed attempts (429 error)
3. Registration blocked after 3 attempts (429 error)
4. Password reset blocked after 3 attempts (429 error)
5. General API blocked after 100 requests (429 error)
6. User-friendly error messages displayed
7. Rate limit headers present in responses
8. Counters reset after time window OR server restart

---

## 🚀 Production Recommendations

Before deploying to production:

1. **Consider Redis for rate limit storage** (survives server restarts)
2. **Adjust limits based on usage patterns**
3. **Monitor rate limit hits** (add logging)
4. **Whitelist internal IPs** if needed
5. **Add CAPTCHA** for extra protection after rate limit hit
6. **Set up alerts** for unusual rate limit patterns

---

## 📝 Notes

- Rate limits reset **per IP address**
- Server restart **clears all counters** (in-memory storage)
- Error messages are **user-friendly** (no technical details exposed)
- Program validation happens **before API call** (saves server resources)
- Password reset **never reveals** if email exists (security best practice)

---

**Testing Status:** Ready for testing ✅
**Server:** Must be running on port 5000
**Client:** Must be running on port 5173
