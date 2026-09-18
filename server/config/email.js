import nodemailer from 'nodemailer';
import { query } from './database.js';
import { getSettingValue } from './settings.js';

let transport = null;
let transportKey = null;

/**
 * Resolve email configuration from admin settings, falling back to environment variables.
 * Never throws - falls back to safe env-based defaults if the settings lookup fails.
 */
export const getEmailConfig = async () => {
  try {
    const [enabled, fromName, fromAddress, supportAddress, provider, smtpHost, smtpPort, smtpUser, smtpKey] = await Promise.all([
      getSettingValue('email_enabled'),
      getSettingValue('email_from_name'),
      getSettingValue('email_from_address'),
      getSettingValue('email_support_address'),
      getSettingValue('email_provider'),
      getSettingValue('email_smtp_host'),
      getSettingValue('email_smtp_port'),
      getSettingValue('email_smtp_user'),
      getSettingValue('email_smtp_key'),
    ]);

    const name = fromName || 'MUT Study Hub';
    const address = fromAddress || 'byronoyoo2030@gmail.com';
    const from = `${name} <${address}>`;
    const supportEmail = supportAddress || process.env.SUPPORT_EMAIL || 'support@mutstudy.com';

    return {
      enabled,
      provider: provider || 'brevo',
      from,
      fromName: name,
      fromAddress: address,
      supportEmail,
      smtpHost: smtpHost || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      smtpPort: Number(smtpPort || process.env.SMTP_PORT || 587),
      smtpUser: smtpUser || process.env.SMTP_USER || '',
      smtpKey: smtpKey || process.env.BREVO_SMTP_KEY || '',
    };
  } catch (error) {
    return {
      enabled: true,
      provider: 'brevo',
      from: process.env.EMAIL_FROM || 'MUT Study Hub <byronoyoo2030@gmail.com>',
      fromName: 'MUT Study Hub',
      fromAddress: 'byronoyoo2030@gmail.com',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@mutstudy.com',
      smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      smtpPort: Number(process.env.SMTP_PORT || 587),
      smtpUser: process.env.SMTP_USER || '',
      smtpKey: process.env.BREVO_SMTP_KEY || '',
    };
  }
};

/**
 * Recreate the SMTP transport whenever host/port/login/key change.
 * Uses STARTTLS on port 587, implicit TLS on 465.
 */
const getSmtpTransport = async () => {
  const config = await getEmailConfig();
  const key = `${config.smtpHost}|${config.smtpPort}|${config.smtpUser}|${config.smtpKey}`;
  if (key === transportKey && transport) return transport;

  transport = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpKey } : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
  transportKey = key;
  return transport;
};

/**
 * Best-effort: write an email event to the email_logs table. Never throws.
 */
export const logEmailEvent = async ({ event, status, recipient, subject, message, details } = {}) => {
  try {
    await query(
      `INSERT INTO email_logs (event, status, recipient, subject, message, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event || 'email',
        status || 'info',
        recipient || null,
        subject || null,
        message || null,
        details ? String(details).slice(0, 2000) : null,
      ]
    );
  } catch (error) {
    console.error('Failed to write email log:', error.message);
  }
};

/**
 * Map an SMTP/nodemailer error to a short human-readable status message.
 */
const describeSmtpError = (error) => {
  const response = String(error?.response || '');
  const msg = error?.message || String(error || 'Failed to send email');
  const lower = (response + ' ' + msg).toLowerCase();

  if (/535|EAUTH|ELOGIN|authentication|auth failed|credentials/i.test(lower)) return 'SMTP authentication failed - check the SMTP key and login';
  if (/ENOTFOUND|ECONNREFUSED|EDNS|ETIMEDOUT|ECONNRESET|getaddrinfo|connect/i.test(lower)) return 'Could not connect to the SMTP server - check the host and port';
  if (/421|429|rate limit|too much mail|quota|sending quota/i.test(lower)) return 'SMTP rate limit or daily sending quota reached - try again later';
  if (/50[0-9]|rejected|spam|blocked|relay/i.test(lower)) return `Email rejected by the SMTP server (${msg.slice(0, 180)})`;
  if (msg && msg.length > 4) return msg.length > 200 ? `${msg.slice(0, 200)}...` : msg;
  return 'Failed to send email';
};

/**
 * Shared send pipeline: enforces the enabled/disabled master switch, applies the
 * configured sender/reply-to addresses and writes a row to email_logs on every attempt.
 */
const requestSend = async ({ to, subject, html, replyTo, event }) => {
  const config = await getEmailConfig();
  const recipient = Array.isArray(to) ? to.join(', ') : to;

  if (config.enabled === false) {
    await logEmailEvent({ event, status: 'skipped', recipient, subject, message: 'Outbound email disabled in settings' });
    return { disabled: true };
  }

  if (!config.smtpUser || !config.smtpKey) {
    console.log(`📧 [${event}] Email to ${recipient}: ${subject} (no SMTP credentials - logged to console)`);
    await logEmailEvent({ event, status: 'success', recipient, subject, message: 'No SMTP credentials configured - email logged to console (development mode)' });
    return { noApiKey: true };
  }

  const mailOptions = {
    from: `"${config.fromName}" <${config.fromAddress}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    replyTo: replyTo || config.supportEmail,
  };

  let info;
  try {
    const smtp = await getSmtpTransport();
    info = await smtp.sendMail(mailOptions);
  } catch (error) {
    const friendly = describeSmtpError(error);
    const details = JSON.stringify({
      code: error?.code || null,
      responseCode: error?.responseCode || null,
      response: error?.response || null,
      message: error?.message,
    });
    await logEmailEvent({ event, status: 'failed', recipient, subject, message: friendly, details });
    console.error('Email send failed:', error?.message);
    return { error, friendly };
  }

  const messageId = info?.messageId || null;
  await logEmailEvent({
    event,
    status: 'success',
    recipient,
    subject,
    message: 'Email sent successfully',
    details: messageId ? `${messageId}${info?.response ? ' | ' + info.response : ''}` : info?.response || '',
  });
  console.log(`✅ [${event}] Email sent to ${recipient} (${messageId || 'no message id'})`);
  return { data: { messageId, ...info } };
};

/**
 * Send OTP email for password reset
 */
export const sendPasswordResetOTP = async (email, otp, userName) => {
  const subject = 'Password Reset OTP - MUT Study Hub';
  try {
    const result = await requestSend({
      to: [email],
      subject,
      event: 'password_reset_otp',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 8px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content { 
              padding: 40px 30px;
            }
            .otp-box { 
              background: #f9fafb;
              border: 2px dashed #10b981; 
              border-radius: 12px; 
              padding: 30px; 
              text-align: center; 
              margin: 30px 0;
            }
            .otp-label {
              margin: 0 0 12px 0;
              color: #6b7280;
              font-size: 14px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .otp-code { 
              font-size: 42px; 
              font-weight: 700; 
              color: #10b981; 
              letter-spacing: 12px;
              font-family: 'Courier New', monospace;
            }
            .otp-expiry {
              margin: 12px 0 0 0;
              color: #6b7280;
              font-size: 13px;
            }
            .warning { 
              background: #fef3c7; 
              border-left: 4px solid #f59e0b; 
              padding: 20px; 
              margin: 30px 0;
              border-radius: 4px;
            }
            .warning strong {
              display: block;
              margin-bottom: 8px;
              color: #92400e;
            }
            .warning ul {
              margin: 8px 0;
              padding-left: 20px;
              color: #92400e;
            }
            .warning li {
              margin: 4px 0;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f9fafb;
              color: #6b7280; 
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              margin: 4px 0;
            }
            p {
              margin: 16px 0;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>MUT Study Hub</p>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>We received a request to reset your password for your MUT Study Hub account.</p>
              
              <div class="otp-box">
                <p class="otp-label">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p class="otp-expiry">⏱️ Expires in 10 minutes</p>
              </div>
              
              <p>Enter this code on the password reset page to continue.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice</strong>
                <ul>
                  <li>Never share this code with anyone</li>
                  <li>MUT Study Hub staff will never ask for your OTP</li>
                  <li>This code expires in 10 minutes</li>
                </ul>
              </div>
              
              <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
              
              <p style="margin-top: 40px;">
                Best regards,<br>
                <strong>MUT Study Hub Team</strong>
              </p>
            </div>
            <div class="footer">
              <p><strong>Muranga University of Technology</strong></p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result.disabled) return { success: false, skipped: true };
    if (result.noApiKey) {
      console.log('\n📧 ===== PASSWORD RESET EMAIL (DEV MODE) =====');
      console.log('To:', email);
      console.log('Subject: Password Reset OTP - MUT Study Hub');
      console.log('OTP Code:', otp);
      console.log('User:', userName);
      console.log('Valid for: 10 minutes');
      console.log('============================================\n');
      return { success: true, messageId: 'dev-mode' };
    }
    if (result.error) {
      console.error('Brevo error:', result.error);
      throw new Error('Failed to send email via Brevo');
    }

    console.log(`✅ Password reset OTP sent to ${email} (ID: ${result.data.messageId})`);
    return { success: true, messageId: result.data.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send password reset success notification
 */
export const sendPasswordResetSuccess = async (email, userName) => {
  const subject = 'Password Successfully Reset - MUT Study Hub';
  try {
    const result = await requestSend({
      to: [email],
      subject,
      event: 'password_reset_success',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content { 
              padding: 40px 30px;
            }
            .success-box { 
              background: #d1fae5; 
              border: 2px solid #10b981; 
              border-radius: 12px; 
              padding: 30px; 
              text-align: center; 
              margin: 30px 0;
            }
            .success-box h2 {
              color: #059669;
              margin: 0 0 8px 0;
              font-size: 24px;
            }
            .success-box p {
              margin: 0;
              color: #047857;
            }
            .footer { 
              text-align: center; 
              padding: 30px;
              background: #f9fafb;
              color: #6b7280; 
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            p {
              margin: 16px 0;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Reset Successful</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <div class="success-box">
                <h2>Password Updated!</h2>
                <p>Your password has been successfully reset.</p>
              </div>
              
              <p>You can now log in to your MUT Study Hub account using your new password.</p>
              
              <p><strong>⚠️ If you did not make this change:</strong><br>
              Please contact our support team immediately as your account may have been compromised.</p>
              
              <p style="margin-top: 40px;">
                Best regards,<br>
                <strong>MUT Study Hub Team</strong>
              </p>
            </div>
            <div class="footer">
              <p><strong>Muranga University of Technology</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result.disabled || result.noApiKey) {
      console.log('\n📧 ===== PASSWORD RESET SUCCESS (DEV MODE) =====');
      console.log('To:', email);
      console.log('Subject: Password Successfully Reset');
      console.log('User:', userName);
      console.log('==============================================\n');
      return { success: true };
    }
    if (result.error) {
      console.error('Brevo error:', result.error);
      return { success: false };
    }

    console.log(`✅ Success notification sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending success email:', error);
    return { success: false };
  }
};


/**
 * Send reply email for contact message
 */
export const sendContactReply = async (email, userName, originalSubject, replyMessage) => {
  const subject = `Re: ${originalSubject}`;
  try {
    const result = await requestSend({
      to: [email],
      subject,
      event: 'contact_reply',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content { 
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #111827;
              margin-bottom: 20px;
            }
            .reply-box { 
              background: #f9fafb;
              border-left: 4px solid #10b981; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 24px 0;
            }
            .footer { 
              background: #f9fafb; 
              padding: 30px; 
              text-align: center; 
              color: #6b7280;
              font-size: 14px;
            }
            .footer a {
              color: #10b981;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Message Reply</h1>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${userName},</p>
              
              <p>Thank you for contacting MUT Study Hub. We have reviewed your message regarding:</p>
              
              <p style="font-style: italic; color: #6b7280;">"${originalSubject}"</p>
              
              <div class="reply-box">
                ${replyMessage.split('\n').map(line => `<p style="margin: 8px 0;">${line}</p>`).join('')}
              </div>
              
              <p>If you have any further questions, please don't hesitate to contact us again.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>MUT Study Hub Support Team</strong><br>
                Muranga University of Technology
              </p>
            </div>
            
            <div class="footer">
              <p>This email was sent from MUT Study Hub</p>
              <p>
                <a href="mailto:support@mutstudy.com">support@mutstudy.com</a>
              </p>
              <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                Developed by MCOKOTH TECHNOLOGIES. All rights reserved, 2026.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result.disabled || result.noApiKey) {
      console.log('\n📧 ===== CONTACT REPLY EMAIL (DEV MODE) =====');
      console.log('To:', email);
      console.log('Subject: Re:', originalSubject);
      console.log('User:', userName);
      console.log('Reply:', replyMessage);
      console.log('============================================\n');
      return { success: true, messageId: 'dev-mode' };
    }
    if (result.error) {
      throw result.error;
    }

    return result.data;
  } catch (error) {
    console.error('Error sending contact reply email:', error);
    throw error;
  }
};

/**
 * Send admin notification when a new contact message is submitted.
 * Best-effort - failures are logged and never block the request.
 */
export const sendContactNotification = async (adminEmails, message) => {
  const subject = `📬 New Contact Message: ${message.subject}`;
  try {
    if (!adminEmails || adminEmails.length === 0) {
      console.log('📭 No admin emails configured; skipping contact notification');
      return { success: false, skipped: true };
    }

    const result = await requestSend({
      to: adminEmails,
      subject,
      event: 'contact_notification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: white; 
              padding: 30px 30px; 
              text-align: center;
            }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 30px; }
            .meta { background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
            .meta p { margin: 6px 0; font-size: 14px; }
            .message-box { 
              background: #f0fdf4; 
              border-left: 4px solid #10b981; 
              border-radius: 8px; 
              padding: 16px; 
              margin: 16px 0;
              white-space: pre-wrap;
            }
            .footer { 
              background: #f9fafb; 
              padding: 20px; 
              text-align: center; 
              color: #6b7280;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 New Contact Message</h1>
            </div>
            <div class="content">
              <div class="meta">
                <p><strong>Name:</strong> ${message.name}</p>
                <p><strong>Email:</strong> <a href="mailto:${message.email}">${message.email}</a></p>
                <p><strong>Subject:</strong> ${message.subject}</p>
                <p><strong>Received:</strong> ${new Date(message.created_at || Date.now()).toLocaleString()}</p>
              </div>
              <h3 style="margin: 0 0 8px;">Message:</h3>
              <div class="message-box">
                ${(message.message || '').split('\n').map(line => `<p style="margin: 6px 0;">${line}</p>`).join('')}
              </div>
              <p>Reply to this message from the admin panel to get back to the sender.</p>
            </div>
            <div class="footer">
              <p>MUT Study Hub - Muranga University of Technology</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result.disabled || result.noApiKey) {
      console.log('\n📧 ===== CONTACT NOTIFICATION (DEV MODE) =====');
      console.log('To Admins:', adminEmails.join(', '));
      console.log('From:', `${message.name} <${message.email}>`);
      console.log('Subject:', message.subject);
      console.log('Message:', message.message);
      console.log('============================================\n');
      return { success: true, messageId: 'dev-mode' };
    }
    if (result.error) {
      throw result.error;
    }

    return result.data;
  } catch (error) {
    console.error('Error sending contact notification email:', error);
    return { success: false };
  }
};

/**
 * Verify the full email service configuration against the SMTP provider:
 * - SMTP login and key present?
 * - Server reachable and credentials accepted (transport.verify)?
 * Writes the outcome to email_logs so admins see 'SMTP server verified',
 * 'SMTP authentication failed', or the current problem.
 */
export const checkEmailConfiguration = async () => {
  const config = await getEmailConfig();
  const base = {
    provider: config.provider || 'brevo',
    from: config.from,
    fromName: config.fromName,
    fromAddress: config.fromAddress,
    supportEmail: config.supportEmail,
    enabled: config.enabled !== false,
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
  };

  if (config.enabled === false) {
    await logEmailEvent({ event: 'config_check', status: 'skipped', message: 'Outbound email disabled in settings' });
    return { ...base, status: 'disabled', message: 'Outbound email is currently disabled in settings', smtpUserPresent: !!config.smtpUser, smtpKeyPresent: !!config.smtpKey };
  }

  if (!config.smtpUser || !config.smtpKey) {
    const message = `Email service is not configured - add the SMTP login and SMTP key (${config.smtpHost}:${config.smtpPort})`;
    await logEmailEvent({ event: 'config_check', status: 'failed', message });
    return { ...base, status: 'not_configured', message, smtpUserPresent: !!config.smtpUser, smtpKeyPresent: !!config.smtpKey };
  }

  try {
    const smtp = await getSmtpTransport();
    await smtp.verify();
    const message = `SMTP server verified (${config.smtpHost}:${config.smtpPort}) - ready to send`;
    await logEmailEvent({ event: 'config_check', status: 'success', message, details: JSON.stringify({ host: config.smtpHost, port: config.smtpPort, user: config.smtpUser }) });
    return { ...base, status: 'success', message, smtpUserPresent: true, smtpKeyPresent: true };
  } catch (error) {
    const friendly = describeSmtpError(error);
    const details = JSON.stringify({
      code: error?.code || null,
      responseCode: error?.responseCode || null,
      response: error?.response || null,
      message: error?.message,
    });
    await logEmailEvent({ event: 'config_check', status: 'failed', message: friendly, details });
    return { ...base, status: 'error', message: friendly, smtpUserPresent: !!config.smtpUser, smtpKeyPresent: true };
  }
};

/**
 * Send a test email to confirm the service is delivering. Logs the outcome.
 */
export const sendTestEmail = async (to, options = {}) => {
  const subject = options.subject || 'MUT Study Hub - Email Service Test';
  const config = await getEmailConfig();

  if (config.enabled === false) {
    return { success: false, status: 'disabled', message: 'Outbound email is currently disabled in settings' };
  }

  const result = await requestSend({
    to: [to],
    subject,
    event: 'test_email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🔧 Email Service Test</h1>
          </div>
          <div style="padding: 30px;">
            <p>This is a test email from <strong>MUT Study Hub</strong>.</p>
            <p>If you are reading this, the email service is working correctly.</p>
            <p style="margin-top: 40px;">Best regards,<br>MUT Study Hub Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  if (result.disabled) return { success: false, message: 'Outbound email is currently disabled in settings', status: 'disabled' };
  if (result.noApiKey) return { success: false, message: 'Email service is not configured - add the SMTP login and SMTP key', status: 'not_configured' };
  if (result.error) {
    console.error('Test email failed:', result.error);
    return { success: false, message: result.friendly, status: 'failed' };
  }

  console.log(`✅ Test email sent to ${to} (ID: ${result.data.messageId})`);
  return { success: true, messageId: result.data.messageId, message: `Test email sent successfully to ${to}`, status: 'success' };
};