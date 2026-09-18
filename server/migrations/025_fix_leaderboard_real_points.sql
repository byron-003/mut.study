-- Migration 025: Real-time leaderboard reputation points
-- ---------------------------------------------------------------------------
-- The leaderboard previously read reputation_score from user_reputation, which
-- was seeded to 0 and only refreshed by the manual updateReputations script or
-- the recalculate endpoint. This made every contributor show "0 points".
--
-- This migration replaces v_top_contributors with a view that computes the
-- reputation score LIVE from real activity, using the exact same point values
-- as utils/reputationCalculator.js:
--   +50 per approved upload
--   +10/7/5/2/1 per 5/4/3/2/1-star rating received (approved uploads only)
--   +5 per review written
--   +3 per helpful vote received
--   +1 per download (capped at 1,000)
--
-- quality_badge is derived from the same thresholds (bronze/silver/gold/platinum).
-- DROP + CREATE keeps column types as INTEGER, which pg reports to clients as numbers.
DROP VIEW IF EXISTS v_top_contributors;

CREATE OR REPLACE VIEW v_top_contributors AS
WITH user_scores AS (
    SELECT
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        u.email,
        (
            (SELECT COUNT(*) FROM study_materials sma WHERE sma.uploader_id = u.id AND sma.status = 'approved') * 50
            + COALESCE((
                SELECT SUM(CASE rr.rating
                    WHEN 5 THEN 10 WHEN 4 THEN 7 WHEN 3 THEN 5
                    WHEN 2 THEN 2 WHEN 1 THEN 1 ELSE 0 END)
                FROM resource_ratings rr
                INNER JOIN study_materials smr ON smr.id = rr.resource_id
                WHERE smr.uploader_id = u.id AND smr.status = 'approved'
            ), 0)
            + (SELECT COUNT(*) FROM resource_reviews rw WHERE rw.user_id = u.id) * 5
            + COALESCE((
                SELECT SUM(COALESCE(rh.helpful_count, 0))
                FROM resource_reviews rh
                WHERE rh.user_id = u.id
            ), 0) * 3
            + LEAST(
                COALESCE((
                    SELECT SUM(smd.download_count)
                    FROM study_materials smd
                    WHERE smd.uploader_id = u.id AND smd.status = 'approved'
                ), 0),
                1000
            ) * 1
        )::int AS reputation_score,
        ((SELECT COUNT(*) FROM study_materials smp
         WHERE smp.uploader_id = u.id AND smp.status = 'approved'))::int AS total_approved_uploads,
        COALESCE((
            SELECT ROUND(AVG(smr2.average_rating)::numeric, 2)
            FROM study_materials smr2
            WHERE smr2.uploader_id = u.id AND smr2.status = 'approved' AND smr2.rating_count > 0
        ), 0) AS average_rating,
        ((SELECT COUNT(*) FROM resource_ratings rr2
         INNER JOIN study_materials sm5 ON sm5.id = rr2.resource_id
         WHERE sm5.uploader_id = u.id AND sm5.status = 'approved'))::int AS total_ratings_received,
        (COALESCE((
            SELECT SUM(COALESCE(rh2.helpful_count, 0))
            FROM resource_reviews rh2
            WHERE rh2.user_id = u.id
        ), 0)::int) AS total_helpful_votes_received
    FROM users u
)
SELECT
    us.id,
    us.name,
    us.email,
    us.reputation_score,
    us.total_approved_uploads,
    us.average_rating,
    us.total_ratings_received,
    us.total_helpful_votes_received,
    CASE
        WHEN us.reputation_score >= 5000 AND us.total_approved_uploads >= 50 AND us.average_rating >= 4.5 THEN 'platinum'
        WHEN us.reputation_score >= 1500 AND us.total_approved_uploads >= 30 AND us.average_rating >= 4.0 THEN 'gold'
        WHEN us.reputation_score >= 500 AND us.total_approved_uploads >= 15 AND us.average_rating >= 3.5 THEN 'silver'
        WHEN us.reputation_score >= 100 AND us.total_approved_uploads >= 5 AND us.average_rating >= 3.0 THEN 'bronze'
        ELSE 'none'
    END AS quality_badge
FROM user_scores us
WHERE us.total_approved_uploads > 0
ORDER BY us.reputation_score DESC, us.average_rating DESC, us.name ASC
LIMIT 100;