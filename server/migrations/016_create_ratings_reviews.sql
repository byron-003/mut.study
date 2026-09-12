-- Migration: Create Ratings and Reviews System
-- Description: Add resource ratings, reviews, and user reputation tracking

-- =============================================
-- 1. RESOURCE RATINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS resource_ratings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure one rating per user per resource
    UNIQUE KEY unique_user_resource_rating (user_id, resource_id),
    
    -- Indexes for performance
    INDEX idx_resource_ratings (resource_id),
    INDEX idx_user_ratings (user_id),
    INDEX idx_rating_value (rating),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. RESOURCE REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS resource_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_id INT NOT NULL,
    user_id INT NOT NULL,
    review_text TEXT NOT NULL,
    helpful_count INT DEFAULT 0,
    reported_count INT DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_resource_reviews (resource_id),
    INDEX idx_user_reviews (user_id),
    INDEX idx_helpful_count (helpful_count),
    INDEX idx_created_at (created_at),
    INDEX idx_flagged (is_flagged)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. REVIEW HELPFUL VOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (review_id) REFERENCES resource_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure one vote per user per review
    UNIQUE KEY unique_user_review_vote (user_id, review_id),
    
    -- Indexes
    INDEX idx_review_votes (review_id),
    INDEX idx_user_votes (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. USER REPUTATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_reputation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    reputation_score INT DEFAULT 0,
    total_uploads INT DEFAULT 0,
    total_approved_uploads INT DEFAULT 0,
    total_downloads_received INT DEFAULT 0,
    total_ratings_received INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews_written INT DEFAULT 0,
    total_helpful_votes_received INT DEFAULT 0,
    quality_badge VARCHAR(20) DEFAULT 'none', -- none, bronze, silver, gold, platinum
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_reputation_score (reputation_score DESC),
    INDEX idx_quality_badge (quality_badge),
    INDEX idx_average_rating (average_rating DESC),
    INDEX idx_total_uploads (total_approved_uploads DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. ADD RATING STATS TO RESOURCES TABLE
-- =============================================
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0,
ADD INDEX idx_average_rating (average_rating DESC),
ADD INDEX idx_rating_count (rating_count DESC);

-- =============================================
-- 6. REPUTATION ACTIVITY LOG TABLE (for tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS reputation_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'upload_approved', 'rating_received', 'review_helpful', 'resource_downloaded'
    points_earned INT NOT NULL,
    resource_id INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_user_activities (user_id, created_at DESC),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. INITIALIZE REPUTATION FOR EXISTING USERS
-- =============================================
INSERT INTO user_reputation (user_id, reputation_score, total_uploads, total_approved_uploads)
SELECT 
    u.id,
    0 as reputation_score,
    COUNT(r.id) as total_uploads,
    COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as total_approved_uploads
FROM users u
LEFT JOIN resources r ON r.uploader_id = u.id
WHERE NOT EXISTS (SELECT 1 FROM user_reputation ur WHERE ur.user_id = u.id)
GROUP BY u.id;

-- =============================================
-- 8. CREATE VIEWS FOR EASY QUERYING
-- =============================================

-- Top Rated Resources View
CREATE OR REPLACE VIEW v_top_rated_resources AS
SELECT 
    r.id,
    r.title,
    r.type,
    r.average_rating,
    r.rating_count,
    r.review_count,
    r.download_count,
    c.unitCode as course_code,
    c.unitTitle as course_title,
    CONCAT(u.firstName, ' ', u.lastName) as uploader_name
FROM resources r
LEFT JOIN courses c ON r.courseId = c.id
LEFT JOIN users u ON r.uploader_id = u.id
WHERE r.status = 'approved' 
  AND r.rating_count >= 3
ORDER BY r.average_rating DESC, r.rating_count DESC
LIMIT 100;

-- Top Contributors View
CREATE OR REPLACE VIEW v_top_contributors AS
SELECT 
    u.id,
    CONCAT(u.firstName, ' ', u.lastName) as name,
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
-- 9. TRIGGERS FOR AUTOMATIC STATS UPDATE
-- =============================================

-- Trigger: Update resource rating stats when a new rating is added
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_resource_rating_stats_insert
AFTER INSERT ON resource_ratings
FOR EACH ROW
BEGIN
    UPDATE resources
    SET 
        rating_count = (SELECT COUNT(*) FROM resource_ratings WHERE resource_id = NEW.resource_id),
        average_rating = (SELECT ROUND(AVG(rating), 2) FROM resource_ratings WHERE resource_id = NEW.resource_id)
    WHERE id = NEW.resource_id;
    
    -- Update uploader reputation
    UPDATE user_reputation ur
    INNER JOIN resources r ON r.uploader_id = ur.user_id
    SET 
        ur.total_ratings_received = ur.total_ratings_received + 1,
        ur.average_rating = (
            SELECT ROUND(AVG(res.average_rating), 2)
            FROM resources res
            WHERE res.uploader_id = ur.user_id 
              AND res.status = 'approved'
              AND res.rating_count > 0
        )
    WHERE r.id = NEW.resource_id;
END//

-- Trigger: Update resource rating stats when a rating is updated
CREATE TRIGGER IF NOT EXISTS update_resource_rating_stats_update
AFTER UPDATE ON resource_ratings
FOR EACH ROW
BEGIN
    UPDATE resources
    SET 
        rating_count = (SELECT COUNT(*) FROM resource_ratings WHERE resource_id = NEW.resource_id),
        average_rating = (SELECT ROUND(AVG(rating), 2) FROM resource_ratings WHERE resource_id = NEW.resource_id)
    WHERE id = NEW.resource_id;
    
    -- Update uploader reputation
    UPDATE user_reputation ur
    INNER JOIN resources r ON r.uploader_id = ur.user_id
    SET 
        ur.average_rating = (
            SELECT ROUND(AVG(res.average_rating), 2)
            FROM resources res
            WHERE res.uploader_id = ur.user_id 
              AND res.status = 'approved'
              AND res.rating_count > 0
        )
    WHERE r.id = NEW.resource_id;
END//

-- Trigger: Update resource rating stats when a rating is deleted
CREATE TRIGGER IF NOT EXISTS update_resource_rating_stats_delete
AFTER DELETE ON resource_ratings
FOR EACH ROW
BEGIN
    UPDATE resources
    SET 
        rating_count = (SELECT COUNT(*) FROM resource_ratings WHERE resource_id = OLD.resource_id),
        average_rating = (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM resource_ratings WHERE resource_id = OLD.resource_id)
    WHERE id = OLD.resource_id;
    
    -- Update uploader reputation
    UPDATE user_reputation ur
    INNER JOIN resources r ON r.uploader_id = ur.user_id
    SET 
        ur.total_ratings_received = GREATEST(0, ur.total_ratings_received - 1),
        ur.average_rating = (
            SELECT COALESCE(ROUND(AVG(res.average_rating), 2), 0)
            FROM resources res
            WHERE res.uploader_id = ur.user_id 
              AND res.status = 'approved'
              AND res.rating_count > 0
        )
    WHERE r.id = OLD.resource_id;
END//

-- Trigger: Update review count when review is added
CREATE TRIGGER IF NOT EXISTS update_resource_review_count_insert
AFTER INSERT ON resource_reviews
FOR EACH ROW
BEGIN
    UPDATE resources
    SET review_count = (SELECT COUNT(*) FROM resource_reviews WHERE resource_id = NEW.resource_id)
    WHERE id = NEW.resource_id;
    
    -- Update user reputation
    UPDATE user_reputation
    SET total_reviews_written = total_reviews_written + 1
    WHERE user_id = NEW.user_id;
END//

-- Trigger: Update review count when review is deleted
CREATE TRIGGER IF NOT EXISTS update_resource_review_count_delete
AFTER DELETE ON resource_reviews
FOR EACH ROW
BEGIN
    UPDATE resources
    SET review_count = (SELECT COUNT(*) FROM resource_reviews WHERE resource_id = OLD.resource_id)
    WHERE id = OLD.resource_id;
    
    -- Update user reputation
    UPDATE user_reputation
    SET total_reviews_written = GREATEST(0, total_reviews_written - 1)
    WHERE user_id = OLD.user_id;
END//

-- Trigger: Update helpful count when vote is added
CREATE TRIGGER IF NOT EXISTS update_review_helpful_count_insert
AFTER INSERT ON review_helpful_votes
FOR EACH ROW
BEGIN
    UPDATE resource_reviews
    SET helpful_count = (SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = NEW.review_id)
    WHERE id = NEW.review_id;
    
    -- Update review author's reputation
    UPDATE user_reputation ur
    INNER JOIN resource_reviews rr ON rr.user_id = ur.user_id
    SET ur.total_helpful_votes_received = ur.total_helpful_votes_received + 1
    WHERE rr.id = NEW.review_id;
END//

-- Trigger: Update helpful count when vote is deleted
CREATE TRIGGER IF NOT EXISTS update_review_helpful_count_delete
AFTER DELETE ON review_helpful_votes
FOR EACH ROW
BEGIN
    UPDATE resource_reviews
    SET helpful_count = (SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = OLD.review_id)
    WHERE id = OLD.review_id;
    
    -- Update review author's reputation
    UPDATE user_reputation ur
    INNER JOIN resource_reviews rr ON rr.user_id = ur.user_id
    SET ur.total_helpful_votes_received = GREATEST(0, ur.total_helpful_votes_received - 1)
    WHERE rr.id = OLD.review_id;
END//

DELIMITER ;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
