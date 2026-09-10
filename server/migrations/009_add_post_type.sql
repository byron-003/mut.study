-- Add post_type column to forum_posts table
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(50) DEFAULT 'discussion';

-- Add check constraint for valid post types
ALTER TABLE forum_posts 
  DROP CONSTRAINT IF EXISTS forum_posts_post_type_check;

ALTER TABLE forum_posts 
  ADD CONSTRAINT forum_posts_post_type_check 
  CHECK (post_type IN ('discussion', 'quiz', 'group_study'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_forum_posts_post_type ON forum_posts(post_type);
