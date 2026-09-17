-- Migration: Add referral tracking to users
-- Purpose: Track which user referred a new registration (set from ?ref= on /register)

ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);