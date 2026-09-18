-- Migration: Create email logs table
-- Purpose: Record every email send attempt and configuration check so admins can see
-- 'Email configured successfully', 'API key invalid', 'sender domain not verified', etc.

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  event VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  recipient VARCHAR(255),
  subject VARCHAR(255),
  message TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_event ON email_logs(event);