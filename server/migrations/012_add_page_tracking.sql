-- Add page tracking columns to study_progress table
ALTER TABLE study_progress
ADD COLUMN IF NOT EXISTS current_page INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_pages INTEGER;

-- Add index for page tracking
CREATE INDEX IF NOT EXISTS idx_study_progress_current_page ON study_progress(current_page);

-- Update the trigger function to calculate progress based on pages
CREATE OR REPLACE FUNCTION update_study_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Calculate progress percentage based on pages if total_pages is set
    IF NEW.total_pages IS NOT NULL AND NEW.total_pages > 0 THEN
        NEW.progress_percentage = LEAST(100, ROUND((NEW.current_page::NUMERIC / NEW.total_pages::NUMERIC) * 100));
    END IF;
    
    -- Auto-complete if progress is 100%
    IF NEW.progress_percentage >= 100 AND NEW.completed = FALSE THEN
        NEW.completed = TRUE;
        NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN study_progress.current_page IS 'Current page number for document/PDF tracking';
COMMENT ON COLUMN study_progress.total_pages IS 'Total number of pages in the document';
