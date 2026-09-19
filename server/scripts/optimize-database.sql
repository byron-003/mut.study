-- ============================================
-- Database Optimization Script
-- Adds indexes for high-traffic queries
-- Run this manually or via migration
-- ============================================

-- ============================================
-- USERS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_program_id ON users(program_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_class_rep ON users(is_class_rep) WHERE is_class_rep = true;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================
-- RESOURCES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_program_id ON resources(program_id);
CREATE INDEX IF NOT EXISTS idx_resources_course_id ON resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_approved ON resources(status) WHERE status = 'approved';

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_resources_program_status ON resources(program_id, status);
CREATE INDEX IF NOT EXISTS idx_resources_course_status ON resources(course_id, status);
CREATE INDEX IF NOT EXISTS idx_resources_user_status ON resources(user_id, status);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_resources_title_search ON resources USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_resources_desc_search ON resources USING gin(to_tsvector('english', description));

-- ============================================
-- PROGRAMS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);
CREATE INDEX IF NOT EXISTS idx_programs_department ON programs(department_id);
CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(name);

-- ============================================
-- COURSES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_courses_program_id ON courses(program_id);
CREATE INDEX IF NOT EXISTS idx_courses_unit_code ON courses(unit_code);
CREATE INDEX IF NOT EXISTS idx_courses_level_semester ON courses(level, semester);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);

-- ============================================
-- FORUM POSTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_course_id ON forum_posts(course_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent_id ON forum_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_upvotes ON forum_posts(upvote_count DESC);

-- Composite for threaded comments
CREATE INDEX IF NOT EXISTS idx_forum_posts_course_parent ON forum_posts(course_id, parent_id, created_at DESC);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_forum_posts_content_search ON forum_posts USING gin(to_tsvector('english', content));

-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Composite for unread notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;

-- ============================================
-- PROGRESS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_resource_id ON progress(resource_id);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON progress(is_completed);
CREATE INDEX IF NOT EXISTS idx_progress_updated_at ON progress(updated_at DESC);

-- Composite for user progress tracking
CREATE INDEX IF NOT EXISTS idx_progress_user_resource ON progress(user_id, resource_id);

-- ============================================
-- RESOURCE RATINGS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource_id ON resource_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_user_id ON resource_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_rating ON resource_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_created_at ON resource_ratings(created_at DESC);

-- Unique constraint to prevent duplicate ratings
CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_ratings_unique ON resource_ratings(user_id, resource_id);

-- ============================================
-- REPUTATION EVENTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reputation_events_user_id ON reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_event_type ON reputation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_reputation_events_created_at ON reputation_events(created_at DESC);

-- ============================================
-- CONTACT MESSAGES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- ============================================
-- PLATFORM FEEDBACK TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_platform_feedback_user_id ON platform_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_feedback_status ON platform_feedback(status);
CREATE INDEX IF NOT EXISTS idx_platform_feedback_created_at ON platform_feedback(created_at DESC);

-- ============================================
-- AI SUMMARIES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_summaries_resource_id ON ai_summaries(resource_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_created_at ON ai_summaries(created_at DESC);

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================
ANALYZE users;
ANALYZE resources;
ANALYZE programs;
ANALYZE courses;
ANALYZE forum_posts;
ANALYZE notifications;
ANALYZE progress;
ANALYZE resource_ratings;
ANALYZE reputation_events;

-- ============================================
-- CREATE MATERIALIZED VIEW FOR LEADERBOARD
-- Refreshed periodically to avoid expensive calculations
-- ============================================
DROP MATERIALIZED VIEW IF EXISTS leaderboard_cache;

CREATE MATERIALIZED VIEW leaderboard_cache AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.program_id,
    p.name as program_name,
    p.code as program_code,
    COALESCE(SUM(re.points), 0) as reputation_points,
    COUNT(DISTINCT r.id) as resources_uploaded,
    u.created_at
FROM users u
LEFT JOIN programs p ON u.program_id = p.id
LEFT JOIN reputation_events re ON u.id = re.user_id
LEFT JOIN resources r ON u.id = r.user_id AND r.status = 'approved'
WHERE u.is_active = true
GROUP BY u.id, u.first_name, u.last_name, u.email, u.program_id, p.name, p.code, u.created_at
ORDER BY reputation_points DESC
LIMIT 100;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_cache_id ON leaderboard_cache(id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_points ON leaderboard_cache(reputation_points DESC);

-- ============================================
-- FUNCTION TO REFRESH LEADERBOARD CACHE
-- Call this periodically (e.g., every hour via cron)
-- ============================================
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
    RAISE NOTICE 'Leaderboard cache refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VACUUM AND ANALYZE FOR CLEANUP
-- ============================================
VACUUM ANALYZE;

-- ============================================
-- DISPLAY INDEX STATISTICS
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Database optimization completed successfully! ✅' as status;
