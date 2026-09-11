-- Migration: Add Class Representative Role
-- Description: Add is_class_rep column to users table to allow class reps to create courses
-- Date: 2026-09-09

-- Add is_class_rep column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_class_rep BOOLEAN DEFAULT FALSE;

-- Add created_by_class_rep column to courses table to track class rep created courses
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS created_by_class_rep INTEGER REFERENCES users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_class_rep ON users(is_class_rep) WHERE is_class_rep = TRUE;
CREATE INDEX IF NOT EXISTS idx_courses_class_rep ON courses(created_by_class_rep) WHERE created_by_class_rep IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN users.is_class_rep IS 'Indicates if the user is a class representative who can create courses for their program';
COMMENT ON COLUMN courses.created_by_class_rep IS 'User ID of the class rep who created this course, NULL if created by admin';

-- Note: Class reps can create courses in their own program to reduce admin workload
