# Resend Email Setup Guide

This project uses [Resend](https://resend.com) for sending transactional emails like password reset OTPs.

## Quick Start (Development)

For local development without an API key:
- Emails are automatically logged to the console
- No configuration needed!
- Perfect for testing the password reset flow

## Production Setup

### Step 1: Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name (e.g., "MUT Study Hub - Production")
4. Copy the API key (starts with `re_`)

### Step 3: Configure Environment

Add to your `server/.env` file:

```env
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=MUT Study Hub <onboarding@resend.dev>
```

### Step 4: Domain Setup (Optional - Recommended for Production)

For production, you should use your own domain:

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `mutstudy.com`)
4. Add the DNS records shown by Resend to your domain
5. Wait for verification (usually a few minutes)
6. Update `.env`:

```env
EMAIL_FROM=MUT Study Hub <noreply@mutstudy.com>
```

## Testing Email Delivery

### Local Development (No API Key)
```bash
# Emails are logged to console
npm start

# Check server console for OTP codes
```

### With Resend API Key
```bash
# Test password reset
# 1. Go to http://localhost:5173/forgot-password
# 2. Enter your email
# 3. Check your inbox for OTP
# 4. Check server logs for delivery status
```

## Resend Free Tier

Resend offers a generous free tier:
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ Unlimited API keys
- ✅ Real-time analytics
- ✅ Email logs and webhooks

Perfect for a university project!

## Email Templates

The project includes two email templates:

1. **Password Reset OTP**
   - Beautiful HTML design
   - 6-digit OTP code
   - Security warnings
   - 10-minute expiration notice

2. **Password Reset Success**
   - Confirmation message
   - Security alert if unauthorized
   - Professional design

## Troubleshooting

### No emails received?

1. **Check API key**: Make sure it starts with `re_`
2. **Check domain**: Use `onboarding@resend.dev` for testing
3. **Check logs**: Server console shows delivery status
4. **Check spam**: Resend emails might go to spam initially
5. **Verify domain**: For custom domains, ensure DNS is configured

### Console shows errors?

```
Error: Invalid API key
```
- API key is wrong or missing
- Use `onboarding@resend.dev` as EMAIL_FROM for testing

```
Error: Domain not verified
```
- Custom domain not set up yet
- Use `onboarding@resend.dev` instead

### Development Mode

If no `RESEND_API_KEY` is set:
- System automatically uses console logging
- OTP codes appear in server logs
- No actual emails sent
- Perfect for testing!

## Security Best Practices

1. ✅ **Never commit API keys** - Already in `.gitignore`
2. ✅ **Use environment variables** - Keys in `.env` only
3. ✅ **Rotate keys regularly** - Change every 90 days
4. ✅ **Use different keys** - Dev, staging, production
5. ✅ **Monitor usage** - Check Resend dashboard

## Support

- 📧 Resend Support: [support@resend.com](mailto:support@resend.com)
- 📚 Resend Docs: [https://resend.com/docs](https://resend.com/docs)
- 🔗 API Reference: [https://resend.com/docs/api-reference](https://resend.com/docs/api-reference)

## Cost Estimate

For MUT Study Hub:
- **Students**: ~500 users
- **Password resets**: ~50/month estimated
- **Success emails**: ~50/month
- **Total**: ~100 emails/month

**Cost**: FREE (well within 3,000/month limit) 🎉
