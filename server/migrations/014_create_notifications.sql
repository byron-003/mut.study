-- Migration: Create Notifications System
-- Description: Add notifications table for admin-to-student notifications
-- Date: 2026-09-09

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  target_type VARCHAR(50) NOT NULL, -- 'all', 'program', 'user'
  target_program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
  target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_target CHECK (
    (target_type = 'all' AND target_program_id IS NULL AND target_user_id IS NULL) OR
    (target_type = 'program' AND target_program_id IS NOT NULL AND target_user_id IS NULL) OR
    (target_type = 'user' AND target_user_id IS NOT NULL AND target_program_id IS NULL)
  )
);

-- Create notification_reads table (track who read what)
CREATE TABLE IF NOT EXISTS notification_reads (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate reads
  UNIQUE(notification_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_program ON notifications(target_program_id) WHERE target_program_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification ON notification_reads(notification_id);

-- Add comments
COMMENT ON TABLE notifications IS 'System notifications sent by admins to students';
COMMENT ON COLUMN notifications.target_type IS 'Delivery scope: all (everyone), program (specific program), user (specific user)';
COMMENT ON COLUMN notifications.type IS 'Visual indicator: info, success, warning, error';
COMMENT ON TABLE notification_reads IS 'Tracks which users have read which notifications';
