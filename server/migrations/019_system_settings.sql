-- Migration: Create system_settings table
-- Purpose: Store dynamic system configuration that can be changed without server restart

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on setting_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('downloads_enabled', 'true', 'Enable or disable file downloads globally'),
  ('max_file_size', '52428800', 'Maximum file upload size in bytes (default: 50MB)'),
  ('maintenance_mode', 'false', 'Enable maintenance mode to disable uploads'),
  ('registration_enabled', 'true', 'Enable or disable new user registrations')
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE system_settings IS 'Stores dynamic system configuration settings that can be modified by admins';
COMMENT ON COLUMN system_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN system_settings.setting_value IS 'Value of the setting (stored as text, parse as needed)';
COMMENT ON COLUMN system_settings.description IS 'Human-readable description of what this setting controls';
COMMENT ON COLUMN system_settings.updated_by IS 'User ID of the admin who last updated this setting';
