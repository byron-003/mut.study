# 🔐 Password Reset System - Complete Guide

## Overview

MUT Study Hub now has a complete password reset system with email OTP verification using [Resend](https://resend.com).

---

## ✨ Features

### User Experience
- ✅ **4-Step Reset Flow**: Email → OTP → New Password → Success
- ✅ **6-Digit OTP Codes**: Easy to enter, secure
- ✅ **10-Minute Expiration**: Security-focused
- ✅ **Beautiful Email Templates**: Professional design
- ✅ **Mobile Responsive**: Works on all devices
- ✅ **Success Notifications**: Email confirmation after reset

### Security
- ✅ **OTP Hashing**: SHA-256 hashed before storage
- ✅ **Time-Limited Codes**: 10-minute expiration
- ✅ **Single-Use OTPs**: Cleared after successful reset
- ✅ **Email Verification**: Only registered users can reset
- ✅ **Password Validation**: Minimum 6 characters

### Developer Experience
- ✅ **Console Logging**: Development mode (no API key needed)
- ✅ **Resend Integration**: Production-ready email delivery
- ✅ **Error Handling**: Comprehensive error messages
- ✅ **Database Migration**: Automatic schema updates

---

## 🚀 Quick Start

### Development (No Setup Required)

1. **Start the server:**
   ```bash
   cd server
   npm start
   ```

2. **Test password reset:**
   - Go to http://localhost:5173/forgot-password
   - Enter any registered email
   - Check **server console** for OTP code
   - Complete the reset flow

3. **OTPs appear in console:**
   ```
   📧 ===== PASSWORD RESET EMAIL (DEV MODE) =====
   To: student@mutstudy.ac.za
   OTP Code: 123456
   Valid for: 10 minutes
   ============================================
   ```

---

## 📧 Production Setup (Resend)

### Step 1: Get Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy the key (starts with `re_`)

### Step 2: Configure Environment

Edit `server/.env`:

```env
# Resend Configuration
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=MUT Study Hub <onboarding@resend.dev>
```

### Step 3: Test Real Emails

1. Restart server
2. Use password reset with your real email
3. Check inbox for OTP
4. Complete reset flow

### Step 4: Custom Domain (Optional)

For production with your own domain:

1. Add domain in [Resend Dashboard](https://resend.com/domains)
2. Configure DNS records
3. Update `.env`:
   ```env
   EMAIL_FROM=MUT Study Hub <noreply@mutstudy.ac.za>
   ```

---

## 📁 File Structure

### Backend Files

```
server/
├── config/
│   └── email.js                    # Resend email configuration
├── controllers/
│   └── passwordResetController.js  # Reset logic & endpoints
├── routes/
│   └── passwordResetRoutes.js      # API routes
├── utils/
│   └── otp.js                      # OTP generation & hashing
├── scripts/
│   └── addPasswordResetFields.js   # Database migration
├── .env                             # API keys (gitignored)
└── RESEND_SETUP.md                  # Setup guide
```

### Frontend Files

```
client/
├── src/
│   ├── pages/
│   │   ├── ForgotPasswordPage.jsx  # Main reset UI
│   │   └── LoginPage.jsx           # "Forgot password?" link
│   └── App.jsx                      # Route configuration
```

### Database Schema

```sql
-- New columns added to users table
ALTER TABLE users ADD COLUMN reset_otp_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_otp_expires TIMESTAMP;
```

---

## 🔌 API Endpoints

### 1. Request Password Reset
```http
POST /api/password-reset/request
Content-Type: application/json

{
  "email": "student@mutstudy.ac.za"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset code."
}
```

### 2. Verify OTP
```http
POST /api/password-reset/verify-otp
Content-Type: application/json

{
  "email": "student@mutstudy.ac.za",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### 3. Reset Password
```http
POST /api/password-reset/reset
Content-Type: application/json

{
  "email": "student@mutstudy.ac.za",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

## 🎨 User Flow

### Step 1: Request Reset
![Step 1](https://via.placeholder.com/600x400/10b981/ffffff?text=Enter+Email)
- User enters email address
- System sends OTP (or logs to console)

### Step 2: Enter OTP
![Step 2](https://via.placeholder.com/600x400/10b981/ffffff?text=Enter+6-Digit+OTP)
- User receives email with OTP
- Enters 6-digit code
- System validates OTP

### Step 3: New Password
![Step 3](https://via.placeholder.com/600x400/10b981/ffffff?text=Create+New+Password)
- User enters new password
- Confirms password
- System updates password

### Step 4: Success
![Step 4](https://via.placeholder.com/600x400/10b981/ffffff?text=Success!)
- Confirmation screen
- Link back to login
- Success email sent

---

## 📧 Email Templates

### Password Reset OTP Email

**Subject:** Password Reset OTP - MUT Study Hub

**Features:**
- Modern gradient header
- Large, easy-to-read OTP code
- Security warnings
- Expiration notice (10 minutes)
- Mobile responsive

**Preview:**
```
┌─────────────────────────────────────┐
│  🔐 Password Reset                  │
│     MUT Study Hub                   │
├─────────────────────────────────────┤
│                                     │
│  Hi John Doe,                       │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Your Verification Code       │  │
│  │                              │  │
│  │      1 2 3 4 5 6            │  │
│  │                              │  │
│  │  ⏱️ Expires in 10 minutes    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ⚠️ Security Notice                 │
│  • Never share this code            │
│  • Expires in 10 minutes            │
│                                     │
└─────────────────────────────────────┘
```

### Success Notification Email

**Subject:** Password Successfully Reset - MUT Study Hub

**Features:**
- Success confirmation
- Security alert
- Professional design

---

## 🔒 Security Considerations

### What We Do Right

1. ✅ **Hash OTPs**: Never store plain text codes
2. ✅ **Time-Limited**: 10-minute expiration
3. ✅ **Single-Use**: OTP cleared after successful use
4. ✅ **No Email Enumeration**: Same response regardless of email existence
5. ✅ **Password Requirements**: Minimum 6 characters
6. ✅ **HTTPS**: Required for production
7. ✅ **Rate Limiting**: Recommended (add in production)

### Recommended Enhancements

1. **Rate Limiting**: Prevent brute force attacks
   ```javascript
   // Add express-rate-limit
   import rateLimit from 'express-rate-limit';
   
   const resetLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 3 // 3 attempts per 15 minutes
   });
   
   router.post('/request', resetLimiter, requestPasswordReset);
   ```

2. **Account Lockout**: After multiple failed attempts
3. **2FA Option**: For sensitive accounts
4. **Audit Logging**: Track reset attempts

---

## 🐛 Troubleshooting

### Problem: No email received

**Solutions:**
1. Check server console for OTP (dev mode)
2. Verify `RESEND_API_KEY` is set correctly
3. Check spam/junk folder
4. Ensure email exists in database
5. Check Resend dashboard for delivery logs

### Problem: OTP Invalid or Expired

**Solutions:**
1. Check OTP expiration (10 minutes)
2. Request new OTP
3. Ensure correct email used
4. Check for typos in OTP

### Problem: Console shows Resend errors

**Solutions:**
1. Verify API key format (`re_...`)
2. Check Resend account status
3. Verify domain (use `onboarding@resend.dev` for testing)
4. Check Resend usage limits

---

## 💰 Cost Analysis

### Resend Free Tier
- 3,000 emails/month
- 100 emails/day
- Unlimited API keys

### MUT Study Hub Usage Estimate
- **Students**: ~500 users
- **Password Resets**: ~50/month (estimated)
- **Success Emails**: ~50/month
- **Total**: ~100 emails/month

**Cost:** FREE ✅ (well within limits)

---

## 📚 Additional Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend API Reference**: https://resend.com/docs/api-reference
- **Setup Guide**: `server/RESEND_SETUP.md`
- **Email Best Practices**: https://resend.com/docs/send-with-nodejs

---

## ✅ Testing Checklist

### Development Testing
- [ ] Request OTP (check console)
- [ ] Verify OTP works
- [ ] Test password change
- [ ] Test expired OTP (wait 10 min)
- [ ] Test invalid OTP
- [ ] Test non-existent email
- [ ] Check success email (console)

### Production Testing
- [ ] Request OTP (check inbox)
- [ ] Verify real email delivery
- [ ] Test on mobile device
- [ ] Check spam folder
- [ ] Verify email design
- [ ] Test from different email providers
- [ ] Monitor Resend dashboard

### Security Testing
- [ ] Cannot reuse OTP
- [ ] OTP expires after 10 minutes
- [ ] Password requirements enforced
- [ ] No email enumeration
- [ ] HTTPS enforced

---

## 🎉 Summary

You now have a **production-ready** password reset system with:
- ✅ Email OTP verification
- ✅ Beautiful email templates
- ✅ Secure implementation
- ✅ Development-friendly (console logging)
- ✅ Production-ready (Resend)
- ✅ Free to run (Resend free tier)

**Next Steps:**
1. Restart server
2. Test password reset flow
3. (Optional) Add Resend API key for production
4. (Optional) Configure custom domain

Happy coding! 🚀
