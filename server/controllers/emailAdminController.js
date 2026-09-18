import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { checkEmailConfiguration, sendTestEmail, getEmailConfig, logEmailEvent } from '../config/email.js';

const maskSecret = (value) => {
  if (!value || value.length < 8) return value ? '••••' : '';
  return `${value.slice(0, 4)}••••••${value.slice(-4)}`;
};

/**
 * GET /api/admin/email/status
 * Current email configuration snapshot + recent send logs + latest check result.
 */
export const getEmailStatus = async (req, res, next) => {
  try {
    const config = await getEmailConfig();
    const { smtpHost, smtpPort, smtpUser, smtpKey, enabled, provider, from, fromName, fromAddress, supportEmail } = config;

    const [logsRes, countsRes, lastCheckRes] = await Promise.all([
      query(
        `SELECT id, event, status, recipient, subject, message, details, created_at
         FROM email_logs
         ORDER BY created_at DESC, id DESC
         LIMIT 30`
      ),
      query(
        `SELECT status, COUNT(*)::int AS count FROM email_logs GROUP BY status`
      ),
      query(
        `SELECT id, event, status, message, details, created_at
         FROM email_logs
         WHERE event = 'config_check'
         ORDER BY created_at DESC, id DESC
         LIMIT 1`
      ),
    ]);

    const counts = countsRes.rows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, { success: 0, failed: 0, warning: 0, skipped: 0 });

    res.json({
      success: true,
      data: {
        configured: {
          provider: provider || 'brevo',
          enabled,
          from,
          fromName,
          fromAddress,
          supportEmail,
          smtpHost,
          smtpPort,
          smtpUserPresent: !!smtpUser,
          smtpUserMasked: smtpUser ? maskSecret(smtpUser) : null,
          smtpKeyPresent: !!smtpKey,
          smtpKeyMasked: smtpKey ? maskSecret(smtpKey) : null,
          smtpKeySource: smtpKey ? (process.env.BREVO_SMTP_KEY && smtpKey === process.env.BREVO_SMTP_KEY ? 'environment' : 'settings') : 'none',
          apiKeyPresent: !!smtpKey,
          apiKeyMasked: smtpKey ? maskSecret(smtpKey) : null,
          apiKeySource: smtpKey ? (process.env.BREVO_SMTP_KEY && smtpKey === process.env.BREVO_SMTP_KEY ? 'environment' : 'none') : 'none',
        },
        lastCheck: lastCheckRes.rows[0] || null,
        counts,
        logs: logsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/email/check
 * Live verification against the provider (API key validity + sender domain status).
 * Writes the outcome to email_logs.
 */
export const runEmailCheck = async (req, res, next) => {
  try {
    const result = await checkEmailConfiguration();
    res.json({ success: true, data: result });
  } catch (error) {
    await logEmailEvent({ event: 'config_check', status: 'failed', message: `Unexpected error: ${error.message}`, details: error.stack });
    next(error);
  }
};

/**
 * POST /api/admin/email/test
 * Send a test email to verify the service end-to-end.
 */
export const sendTestEmailAdmin = async (req, res, next) => {
  try {
    const { to } = req.body;
    if (!to || typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
      throw new AppError('A valid recipient email address is required', 400);
    }

    const result = await sendTestEmail(to.trim());
    res.json({ success: result.success, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/email/logs
 * Clear all email log history.
 */
export const clearEmailLogs = async (req, res, next) => {
  try {
    await query('DELETE FROM email_logs');
    res.json({ success: true, message: 'Email logs cleared' });
  } catch (error) {
    next(error);
  }
};