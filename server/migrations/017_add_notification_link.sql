-- Migration: Add Link Support to Notifications
-- Description: Add link_url and link_text columns for actionable notifications
-- Date: 2026-09-09

-- Add link columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS link_text VARCHAR(100);

-- Add index for notifications with links
CREATE INDEX IF NOT EXISTS idx_notifications_link ON notifications(link_url) WHERE link_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN notifications.link_url IS 'Optional URL for call-to-action button';
COMMENT ON COLUMN notifications.link_text IS 'Button text for the link (e.g., "View Course", "Learn More")';
