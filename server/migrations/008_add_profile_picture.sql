-- Add profile_picture_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture_url);
