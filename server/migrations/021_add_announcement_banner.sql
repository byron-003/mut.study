-- Migration: Add announcement banner setting
-- Purpose: Store the site-wide announcement banner message shown below the header
-- Admin sets this via PUT /api/admin/banner; client reads via GET /api/admin/public/banner

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('announcement_banner', '', 'Site-wide announcement banner shown below the header when non-empty')
ON CONFLICT (setting_key) DO NOTHING;