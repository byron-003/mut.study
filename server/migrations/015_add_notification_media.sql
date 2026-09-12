-- Migration: Add Media Support to Notifications
-- Description: Add media_url and media_type columns to notifications table
-- Date: 2026-09-09

-- Add media columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20); -- 'image' or 'video'

-- Add index for media queries
CREATE INDEX IF NOT EXISTS idx_notifications_media ON notifications(media_type) WHERE media_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN notifications.media_url IS 'Optional media attachment URL (image or video)';
COMMENT ON COLUMN notifications.media_type IS 'Media type: image or video';
