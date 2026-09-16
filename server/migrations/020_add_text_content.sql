-- Migration: Add text_content column to study_materials
-- Purpose: Store rich text content directly in database for text-based resources

-- Add text_content column
ALTER TABLE study_materials
ADD COLUMN IF NOT EXISTS text_content TEXT,
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'file' CHECK (content_type IN ('file', 'text'));

-- Add index for content_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_materials_content_type ON study_materials(content_type);

-- Add comment
COMMENT ON COLUMN study_materials.text_content IS 'Rich text HTML content for text-based resources (alternative to file upload)';
COMMENT ON COLUMN study_materials.content_type IS 'Type of resource: file (uploaded file) or text (database-stored text)';

-- For text-based resources, file_url and file_size can be NULL
ALTER TABLE study_materials
ALTER COLUMN file_url DROP NOT NULL,
ALTER COLUMN file_size DROP NOT NULL;
