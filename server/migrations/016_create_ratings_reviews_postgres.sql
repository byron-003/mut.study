-- Migration: Create Ratings and Reviews System (PostgreSQL)
-- Description: Add resource ratings, reviews, and user reputation tracking

-- =============================================
-- 1. RESOURCE RATINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS resource_ratings (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one rating per user per resource
    UNIQUE (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource ON resource_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_user ON resource_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_value ON resource_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_created ON resource_ratings(created_at);

-- =============================================
-- 2. RESOURCE REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS resource_reviews (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_text TEXT NOT NULL,
    helpful_count INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resource_reviews_resource ON resource_reviews(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_user ON resource_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_helpful ON resource_reviews(helpful_count);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_created ON resource_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_flagged ON resource_reviews(is_flagged);

-- =============================================
-- 3. REVIEW HELPFUL VOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES resource_reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one vote per user per review
    UNIQUE (user_id, review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user ON review_helpful_votes(user_id);

-- =============================================
-- 4. USER REPUTATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_reputation (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    reputation_score INTEGER DEFAULT 0,
    total_uploads INTEGER DEFAULT 0,
    total_approved_uploads INTEGER DEFAULT 0,
    total_downloads_received INTEGER DEFAULT 0,
    total_ratings_received INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews_written INTEGER DEFAULT 0,
    total_helpful_votes_received INTEGER DEFAULT 0,
    quality_badge VARCHAR(20) DEFAULT 'none', -- none, bronze, silver, gold, platinum
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_reputation_badge ON user_reputation(quality_badge);
CREATE INDEX IF NOT EXISTS idx_user_reputation_rating ON user_reputation(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_user_reputation_uploads ON user_reputation(total_approved_uploads DESC);

-- =============================================
-- 5. ADD RATING STATS TO RESOURCES TABLE
-- =============================================
ALTER TABLE study_materials 
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_study_materials_avg_rating ON study_materials(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_study_materials_rating_count ON study_materials(rating_count DESC);

-- =============================================
-- 6. REPUTATION ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reputation_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'upload_approved', 'rating_received', 'review_helpful', 'resource_downloaded'
    points_earned INTEGER NOT NULL,
    resource_id INTEGER REFERENCES study_materials(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reputation_activities_user ON reputation_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_activities_type ON reputation_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_reputation_activities_created ON reputation_activities(created_at DESC);

-- =============================================
-- 7. INITIALIZE REPUTATION FOR EXISTING USERS
-- =============================================
INSERT INTO user_reputation (user_id, reputation_score, total_uploads, total_approved_uploads)
SELECT 
    u.id,
    0 as reputation_score,
    COUNT(sm.id) as total_uploads,
    COUNT(CASE WHEN sm.status = 'approved' THEN 1 END) as total_approved_uploads
FROM users u
LEFT JOIN study_materials sm ON sm.uploader_id = u.id
WHERE NOT EXISTS (SELECT 1 FROM user_reputation ur WHERE ur.user_id = u.id)
GROUP BY u.id;

-- =============================================
-- 8. CREATE VIEWS FOR EASY QUERYING
-- =============================================

-- Top Rated Resources View
CREATE OR REPLACE VIEW v_top_rated_resources AS
SELECT 
    sm.id,
    sm.title,
    sm.category,
    sm.average_rating,
    sm.rating_count,
    sm.review_count,
    sm.download_count,
    c.unit_code as course_code,
    c.unit_title as course_title,
    CONCAT(u.first_name, ' ', u.last_name) as uploader_name
FROM study_materials sm
LEFT JOIN courses c ON sm.course_id = c.id
LEFT JOIN users u ON sm.uploader_id = u.id
WHERE sm.status = 'approved' 
  AND sm.rating_count >= 3
ORDER BY sm.average_rating DESC, sm.rating_count DESC
LIMIT 100;

-- Top Contributors View
CREATE OR REPLACE VIEW v_top_contributors AS
SELECT 
    u.id,
    CONCAT(u.first_name, ' ', u.last_name) as name,
    u.email,
    ur.reputation_score,
    ur.quality_badge,
    ur.total_approved_uploads,
    ur.average_rating,
    ur.total_ratings_received,
    ur.total_helpful_votes_received
FROM users u
INNER JOIN user_reputation ur ON u.id = ur.user_id
WHERE ur.total_approved_uploads > 0
ORDER BY ur.reputation_score DESC, ur.average_rating DESC
LIMIT 100;

-- =============================================
-- 9. FUNCTIONS FOR AUTOMATIC STATS UPDATE
-- =============================================

-- Function to update resource rating stats
CREATE OR REPLACE FUNCTION update_resource_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update resource rating statistics
    UPDATE study_materials
    SET 
        rating_count = (SELECT COUNT(*) FROM resource_ratings WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)),
        average_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM resource_ratings WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id))
    WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);
    
    -- Update uploader reputation on INSERT or UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE user_reputation ur
        SET 
            total_ratings_received = (
                SELECT COUNT(DISTINCT rr.id)
                FROM resource_ratings rr
                INNER JOIN study_materials sm ON sm.id = rr.resource_id
                WHERE sm.uploader_id = ur.user_id
            ),
            average_rating = (
                SELECT COALESCE(ROUND(AVG(sm.average_rating)::numeric, 2), 0)
                FROM study_materials sm
                WHERE sm.uploader_id = ur.user_id 
                  AND sm.status = 'approved'
                  AND sm.rating_count > 0
            )
        FROM study_materials sm
        WHERE sm.id = NEW.resource_id AND sm.uploader_id = ur.user_id;
    END IF;
    
    -- Update uploader reputation on DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE user_reputation ur
        SET 
            total_ratings_received = GREATEST(0, ur.total_ratings_received - 1),
            average_rating = (
                SELECT COALESCE(ROUND(AVG(sm.average_rating)::numeric, 2), 0)
                FROM study_materials sm
                WHERE sm.uploader_id = ur.user_id 
                  AND sm.status = 'approved'
                  AND sm.rating_count > 0
            )
        FROM study_materials sm
        WHERE sm.id = OLD.resource_id AND sm.uploader_id = ur.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rating stats
DROP TRIGGER IF EXISTS trigger_update_rating_stats ON resource_ratings;
CREATE TRIGGER trigger_update_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON resource_ratings
FOR EACH ROW
EXECUTE FUNCTION update_resource_rating_stats();

-- Function to update review counts
CREATE OR REPLACE FUNCTION update_resource_review_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE study_materials
        SET review_count = review_count + 1
        WHERE id = NEW.resource_id;
        
        UPDATE user_reputation
        SET total_reviews_written = total_reviews_written + 1
        WHERE user_id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE study_materials
        SET review_count = GREATEST(0, review_count - 1)
        WHERE id = OLD.resource_id;
        
        UPDATE user_reputation
        SET total_reviews_written = GREATEST(0, total_reviews_written - 1)
        WHERE user_id = OLD.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for review counts
DROP TRIGGER IF EXISTS trigger_update_review_count ON resource_reviews;
CREATE TRIGGER trigger_update_review_count
AFTER INSERT OR DELETE ON resource_reviews
FOR EACH ROW
EXECUTE FUNCTION update_resource_review_count();

-- Function to update helpful counts
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE resource_reviews
        SET helpful_count = helpful_count + 1
        WHERE id = NEW.review_id;
        
        UPDATE user_reputation ur
        SET total_helpful_votes_received = total_helpful_votes_received + 1
        FROM resource_reviews rr
        WHERE rr.id = NEW.review_id AND rr.user_id = ur.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE resource_reviews
        SET helpful_count = GREATEST(0, helpful_count - 1)
        WHERE id = OLD.review_id;
        
        UPDATE user_reputation ur
        SET total_helpful_votes_received = GREATEST(0, total_helpful_votes_received - 1)
        FROM resource_reviews rr
        WHERE rr.id = OLD.review_id AND rr.user_id = ur.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful counts
DROP TRIGGER IF EXISTS trigger_update_helpful_count ON review_helpful_votes;
CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR DELETE ON review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION update_review_helpful_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_resource_ratings_updated_at ON resource_ratings;
CREATE TRIGGER trigger_resource_ratings_updated_at
BEFORE UPDATE ON resource_ratings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_resource_reviews_updated_at ON resource_reviews;
CREATE TRIGGER trigger_resource_reviews_updated_at
BEFORE UPDATE ON resource_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
