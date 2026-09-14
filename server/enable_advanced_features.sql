-- Quick script to enable advanced features for a user
-- Usage: Replace the email or ID with actual user details

-- Method 1: Enable by email
UPDATE users 
SET advanced_features_enabled = true 
WHERE email = 'user@example.com';

-- Method 2: Enable by user ID
-- UPDATE users 
-- SET advanced_features_enabled = true 
-- WHERE id = 123;

-- Method 3: Enable for ALL users (use with caution!)
-- UPDATE users 
-- SET advanced_features_enabled = true;

-- Verify the change
SELECT id, email, first_name, last_name, advanced_features_enabled 
FROM users 
WHERE advanced_features_enabled = true;

-- Check if the column exists first
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'advanced_features_enabled';
