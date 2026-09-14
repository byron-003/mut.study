-- Migration 018: Add user settings and AI summaries tables
-- Created: 2026-09-09
-- Description: Adds advanced_features_enabled to users table and creates ai_summaries table for storing AI-generated summaries

-- Add advanced_features_enabled column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS advanced_features_enabled BOOLEAN DEFAULT FALSE;

-- Create ai_summaries table for storing AI-generated document summaries
CREATE TABLE IF NOT EXISTS ai_summaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id INTEGER NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
  
  -- Summary content
  summary_text TEXT NOT NULL,
  summary_length INTEGER NOT NULL, -- Character count of summary
  
  -- Original document info
  original_filename VARCHAR(500) NOT NULL,
  original_file_url TEXT NOT NULL,
  original_file_type VARCHAR(50) NOT NULL, -- pdf, docx, pptx, etc.
  
  -- AI metadata
  ai_model VARCHAR(100) DEFAULT 'gemini-pro', -- Which AI model was used
  tokens_used INTEGER, -- For tracking API usage
  processing_time_ms INTEGER, -- How long it took to generate
  
  -- Status and error tracking
  status VARCHAR(20) DEFAULT 'completed', -- completed, failed, processing
  error_message TEXT, -- If failed, store error details
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT unique_user_resource_summary UNIQUE (user_id, resource_id, created_at)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_summaries_user_id ON ai_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_resource_id ON ai_summaries(resource_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_created_at ON ai_summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_status ON ai_summaries(status);
CREATE INDEX IF NOT EXISTS idx_users_advanced_features ON users(advanced_features_enabled);

-- Create view for summary statistics
CREATE OR REPLACE VIEW v_user_summary_stats AS
SELECT 
  u.id AS user_id,
  u.first_name,
  u.last_name,
  u.email,
  u.advanced_features_enabled,
  COUNT(s.id) AS total_summaries,
  COUNT(CASE WHEN s.status = 'completed' THEN 1 END) AS completed_summaries,
  COUNT(CASE WHEN s.status = 'failed' THEN 1 END) AS failed_summaries,
  COALESCE(SUM(s.tokens_used), 0) AS total_tokens_used,
  COALESCE(AVG(s.processing_time_ms), 0) AS avg_processing_time_ms,
  MAX(s.created_at) AS last_summary_at
FROM users u
LEFT JOIN ai_summaries s ON u.id = s.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.advanced_features_enabled;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_summaries_updated_at ON ai_summaries;
CREATE TRIGGER trigger_update_ai_summaries_updated_at
  BEFORE UPDATE ON ai_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_summaries_updated_at();

-- Add comments for documentation
COMMENT ON TABLE ai_summaries IS 'Stores AI-generated summaries of study materials';
COMMENT ON COLUMN ai_summaries.user_id IS 'User who requested the summary';
COMMENT ON COLUMN ai_summaries.resource_id IS 'Study material that was summarized';
COMMENT ON COLUMN ai_summaries.summary_text IS 'The AI-generated summary content';
COMMENT ON COLUMN ai_summaries.tokens_used IS 'Number of tokens consumed by AI API';
COMMENT ON COLUMN ai_summaries.processing_time_ms IS 'Time taken to generate summary in milliseconds';
COMMENT ON COLUMN users.advanced_features_enabled IS 'Whether user has access to AI features';

-- Insert sample data for testing (optional - remove in production)
-- This helps verify the migration worked correctly
DO $$
BEGIN
  -- Only insert if no summaries exist (fresh install)
  IF NOT EXISTS (SELECT 1 FROM ai_summaries LIMIT 1) THEN
    RAISE NOTICE 'Migration 018 completed successfully. Tables created and ready for AI summarization feature.';
  END IF;
END $$;
