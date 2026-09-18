-- Migration: Seed default system settings used by the admin Settings & Configuration page
-- Purpose: Every configurable setting has a persisted row so the admin UI can load and save
--          real values (no client-side mocks). Existing values are preserved.
-- Consumed by: server/config/settings.js

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('site_name', 'MUT Study Hub', 'Public site name shown in the header, footer and browser tab'),
  ('site_description', 'Your comprehensive platform for academic resources, collaboration, and success at Muranga University of Technology.', 'Short description of the platform used for branding and SEO'),
  ('contact_email', 'support@mutstudy.ac.za', 'Support email address displayed to users'),
  ('allowed_file_types', '.pdf,.doc,.docx,.txt,.html,.rtf,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.csv,.ods,.zip,.rar,.7z,.tar,.gz,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm,.mp3,.wav,.ogg,.m4a,.aac', 'Comma-separated list of allowed file extensions'),
  ('allow_student_uploads', 'true', 'Allow students to upload study materials'),
  ('password_min_length', '8', 'Minimum number of characters required for user passwords'),
  ('require_strong_password', 'true', 'Require uppercase, lowercase and numeric characters in passwords'),
  ('require_email_verification', 'false', 'Require users to verify their email before accessing the platform'),
  ('session_timeout_minutes', '10080', 'How long a login session stays valid, in minutes (default: 10080 = 7 days)'),
  ('max_login_attempts', '5', 'Maximum number of failed login attempts before a temporary lockout'),
  ('auto_approve', 'false', 'Automatically approve uploaded resources without review'),
  ('require_class_rep_approval', 'true', 'Allow class representatives to approve resources'),
  ('require_admin_approval', 'false', 'Only administrators can approve resources'),
  ('moderation_queue_limit', '100', 'Maximum number of resources allowed in the approval queue'),
  ('email_notifications', 'true', 'Receive email notifications for important events'),
  ('new_resource_alert', 'true', 'Notify administrators when new resources are uploaded'),
  ('approval_notification', 'true', 'Notify reviewers when resources need approval'),
  ('weekly_report', 'false', 'Receive a weekly activity summary email'),
  ('system_alerts', 'true', 'Receive critical system notifications and updates')
ON CONFLICT (setting_key) DO NOTHING;

-- Refresh descriptions for the pre-existing seeded keys without touching their values
UPDATE system_settings SET description = 'Enable or disable new user registrations'
  WHERE setting_key = 'registration_enabled';
UPDATE system_settings SET description = 'Show a maintenance notice and pause new uploads'
  WHERE setting_key = 'maintenance_mode';
UPDATE system_settings SET description = 'Enable or disable file downloads globally'
  WHERE setting_key = 'downloads_enabled';
UPDATE system_settings SET description = 'Maximum file upload size in bytes (default: 50MB)'
  WHERE setting_key = 'max_file_size';
