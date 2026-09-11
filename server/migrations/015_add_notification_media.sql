-- Migration: Add Media Support to Notifications
-- Description: Add media_url and media_type columns to support images/videos in notifications
-- Date: 2026-09-09

-- Add media columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50); -- 'image' or 'video'

-- Add comment
COMMENT ON COLUMN notifications.media_url IS 'URL to uploaded image or video file';
COMMENT ON COLUMN notifications.media_type IS 'Type of media: image or video';

-- Create index for media queries
CREATE INDEX IF NOT EXISTS idx_notifications_media_type ON notifications(media_type) WHERE media_type IS NOT NULL;
