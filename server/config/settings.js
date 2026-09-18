import { query } from './database.js';

/**
 * Central registry of all configurable system settings.
 *
 * `type`    - how the stored text value is parsed/coerced
 * `public`  - whether the value is safe to expose to the student client
 * `value`   - default used when the key is missing from the database
 */
export const SETTINGS_DEFAULTS = {
  // General
  site_name: {
    value: 'MUT Study Hub',
    type: 'string',
    public: true,
    description: 'Public site name shown in the header, footer and browser tab',
  },
  site_description: {
    value: 'Your comprehensive platform for academic resources, collaboration, and success at Muranga University of Technology.',
    type: 'string',
    public: true,
    description: 'Short description of the platform used for branding and SEO',
  },
  contact_email: {
    value: 'support@mutstudy.com',
    type: 'string',
    public: true,
    description: 'Support email address displayed to users',
  },
  max_file_size: {
    value: 52428800,
    type: 'number',
    public: true,
    description: 'Maximum file upload size in bytes (default: 50MB)',
  },
  allowed_file_types: {
    value: '.pdf,.doc,.docx,.txt,.html,.rtf,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.csv,.ods,.zip,.rar,.7z,.tar,.gz,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm,.mp3,.wav,.ogg,.m4a,.aac',
    type: 'string',
    public: true,
    description: 'Comma-separated list of allowed file extensions',
  },
  downloads_enabled: {
    value: true,
    type: 'boolean',
    public: true,
    description: 'Enable or disable file downloads globally',
  },
  registration_enabled: {
    value: true,
    type: 'boolean',
    public: true,
    description: 'Enable or disable new user registrations',
  },
  maintenance_mode: {
    value: false,
    type: 'boolean',
    public: true,
    description: 'Show a maintenance notice and pause new uploads',
  },
  allow_student_uploads: {
    value: true,
    type: 'boolean',
    public: true,
    description: 'Allow students to upload study materials',
  },
  allow_students_add_course: {
    value: false,
    type: 'boolean',
    public: true,
    description: 'Allow all students to add courses (normally class reps only)',
  },

  // Security
  password_min_length: {
    value: 8,
    type: 'number',
    public: true,
    description: 'Minimum number of characters required for user passwords',
  },
  require_strong_password: {
    value: true,
    type: 'boolean',
    public: true,
    description: 'Require uppercase, lowercase and numeric characters in passwords',
  },
  require_email_verification: {
    value: false,
    type: 'boolean',
    public: false,
    description: 'Require users to verify their email before accessing the platform',
  },
  session_timeout_minutes: {
    value: 10080,
    type: 'number',
    public: false,
    description: 'How long a login session stays valid, in minutes (default: 10080 = 7 days)',
  },
  max_login_attempts: {
    value: 5,
    type: 'number',
    public: false,
    description: 'Maximum number of failed login attempts before a temporary lockout',
  },

  // Approval workflow
  auto_approve: {
    value: false,
    type: 'boolean',
    public: false,
    description: 'Automatically approve uploaded resources without review',
  },
  require_class_rep_approval: {
    value: true,
    type: 'boolean',
    public: false,
    description: 'Allow class representatives to approve resources',
  },
  require_admin_approval: {
    value: false,
    type: 'boolean',
    public: false,
    description: 'Only administrators can approve resources',
  },
  moderation_queue_limit: {
    value: 100,
    type: 'number',
    public: false,
    description: 'Maximum number of resources allowed in the approval queue',
  },

  // Notifications
  email_notifications: {
    value: true,
    type: 'boolean',
    public: false,
    description: 'Receive email notifications for important events',
  },
  new_resource_alert: {
    value: true,
    type: 'boolean',
    public: false,
    description: 'Notify administrators when new resources are uploaded',
  },
  approval_notification: {
    value: true,
    type: 'boolean',
    public: false,
    description: 'Notify reviewers when resources need approval',
  },
  weekly_report: {
    value: false,
    type: 'boolean',
    public: false,
    description: 'Receive a weekly activity summary email',
  },
  system_alerts: {
    value: true,
    type: 'boolean',
    public: false,
    description: 'Receive critical system notifications and updates',
  },

  // Email service
  email_provider: {
    value: 'brevo',
    type: 'string',
    public: false,
    description: 'Email provider used to send platform emails (Brevo SMTP relay)',
  },
  email_api_key: {
    value: '',
    type: 'string',
    public: false,
    description: 'Legacy API key setting (kept for compatibility - sending now uses SMTP credentials below)',
  },
  email_smtp_host: {
    value: 'smtp-relay.brevo.com',
    type: 'string',
    public: false,
    description: 'SMTP server hostname used to send emails',
  },
  email_smtp_port: {
    value: 587,
    type: 'number',
    public: false,
    description: 'SMTP server port (587 = STARTTLS, 465 = implicit TLS)',
  },
  email_smtp_user: {
    value: '',
    type: 'string',
    public: false,
    description: 'SMTP login username (leave empty to use the SMTP_USER environment variable)',
  },
  email_smtp_key: {
    value: '',
    type: 'string',
    public: false,
    description: 'SMTP password/key (starts with xsmtpsib- for Brevo; leave empty to use BREVO_SMTP_KEY)',
  },
  email_from_name: {
    value: 'MUT Study Hub',
    type: 'string',
    public: false,
    description: 'Sender name shown on outgoing emails',
  },
  email_from_address: {
    value: 'byronoyoo2030@gmail.com',
    type: 'string',
    public: false,
    description: 'Sender address emails are sent from (must be a registered/verified sender)',
  },
  email_support_address: {
    value: 'support@mutstudy.com',
    type: 'string',
    public: false,
    description: 'Reply-to address used on outgoing emails',
  },
  email_enabled: {
    value: true,
    type: 'boolean',
    public: false,
    description: 'Master switch for sending outbound emails',
  },
};

const coerce = (raw, type, fallback) => {
  if (raw === null || raw === undefined) return fallback;
  if (type === 'boolean') return raw === true || raw === 'true';
  if (type === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return String(raw);
};

/**
 * Get every setting as a flat map of typed values, falling back to defaults.
 */
export const getAllSettings = async () => {
  const result = await query('SELECT setting_key, setting_value FROM system_settings');

  const stored = {};
  for (const row of result.rows) {
    stored[row.setting_key] = row.setting_value;
  }

  const settings = {};
  for (const [key, def] of Object.entries(SETTINGS_DEFAULTS)) {
    settings[key] = coerce(stored[key], def.type, def.value);
  }

  // Preserve any keys that exist in the DB but are not in the registry
  for (const [key, value] of Object.entries(stored)) {
    if (!(key in settings)) settings[key] = value;
  }

  return settings;
};

/**
 * Get a single typed setting value, falling back to the registry default.
 */
export const getSettingValue = async (key, fallback) => {
  const def = SETTINGS_DEFAULTS[key];
  const result = await query(
    'SELECT setting_value FROM system_settings WHERE setting_key = $1',
    [key]
  );

  if (result.rows.length === 0) {
    return fallback !== undefined ? fallback : def?.value;
  }

  return coerce(result.rows[0].setting_value, def?.type || 'string', fallback ?? def?.value);
};

/**
 * Get only the settings that are safe to expose to the student client.
 */
export const getPublicSettings = async () => {
  const all = await getAllSettings();
  const publicSettings = {};

  for (const [key, def] of Object.entries(SETTINGS_DEFAULTS)) {
    if (def.public) publicSettings[key] = all[key];
  }

  return publicSettings;
};

/**
 * Persist a batch of settings. Unknown keys are accepted and stored as strings.
 * Returns the refreshed, fully-typed settings map.
 */
export const saveSettings = async (updates, userId) => {
  const entries = Object.entries(updates);

  for (const [key, value] of entries) {
    if (value === undefined) continue;
    await query(
      `INSERT INTO system_settings (setting_key, setting_value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value = $2, updated_by = $4, updated_at = CURRENT_TIMESTAMP`,
      [key, String(value), SETTINGS_DEFAULTS[key]?.description || null, userId || null]
    );
  }

  return getAllSettings();
};
