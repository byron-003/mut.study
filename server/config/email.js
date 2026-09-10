import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Fallback for development without API key
const isDevelopment = !process.env.RESEND_API_KEY;

/**
 * Send OTP email for password reset
 */
export const sendPasswordResetOTP = async (email, otp, userName) => {
  try {
    // Development fallback - log to console
    if (isDevelopment) {
      console.log('\n📧 ===== PASSWORD RESET EMAIL (DEV MODE) =====');
      console.log('To:', email);
      console.log('Subject: Password Reset OTP - MUT Study Hub');
      console.log('OTP Code:', otp);
      console.log('User:', userName);
      console.log('Valid for: 10 minutes');
      console.log('============================================\n');
      return { success: true, messageId: 'dev-mode' };
    }

    // Production - use Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'MUT Study Hub <onboarding@resend.dev>',
      to: [email],
      subject: 'Password Reset OTP - MUT Study Hub',
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

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email via Resend');
    }

    console.log(`✅ Password reset OTP sent to ${email} (ID: ${data.id})`);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send password reset success notification
 */
export const sendPasswordResetSuccess = async (email, userName) => {
  try {
    // Development fallback
    if (isDevelopment) {
      console.log('\n📧 ===== PASSWORD RESET SUCCESS (DEV MODE) =====');
      console.log('To:', email);
      console.log('Subject: Password Successfully Reset');
      console.log('User:', userName);
      console.log('==============================================\n');
      return { success: true };
    }

    // Production - use Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'MUT Study Hub <onboarding@resend.dev>',
      to: [email],
      subject: 'Password Successfully Reset - MUT Study Hub',
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

    if (error) {
      console.error('Resend error:', error);
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
  try {
    // Development fallback - log to console
    if (isDevelopment) {
      console.log('\n📧 ===== CONTACT REPLY EMAIL (DEV MODE) =====');
      console.log('To:', email);
      console.log('Subject: Re:', originalSubject);
      console.log('User:', userName);
      console.log('Reply:', replyMessage);
      console.log('============================================\n');
      return { success: true, messageId: 'dev-mode' };
    }

    // Production - use Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'MUT Study Hub <onboarding@resend.dev>',
      to: [email],
      replyTo: process.env.SUPPORT_EMAIL || 'support@mutstudy.ac.za',
      subject: `Re: ${originalSubject}`,
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
                <a href="mailto:support@mutstudy.ac.za">support@mutstudy.ac.za</a>
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

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending contact reply email:', error);
    throw error;
  }
};
