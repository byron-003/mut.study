import { query } from '../config/database.js';

/**
 * Reputation System Calculator
 * Calculates user reputation scores and assigns quality badges
 */

// Point values for different activities
const POINTS = {
  UPLOAD_APPROVED: 50,
  RATING_RECEIVED_5_STAR: 10,
  RATING_RECEIVED_4_STAR: 7,
  RATING_RECEIVED_3_STAR: 5,
  RATING_RECEIVED_2_STAR: 2,
  RATING_RECEIVED_1_STAR: 1,
  REVIEW_WRITTEN: 5,
  REVIEW_HELPFUL_VOTE: 3,
  RESOURCE_DOWNLOADED: 1
};

// Badge thresholds
const BADGE_THRESHOLDS = {
  BRONZE: { score: 100, uploads: 5, avgRating: 3.0 },
  SILVER: { score: 500, uploads: 15, avgRating: 3.5 },
  GOLD: { score: 1500, uploads: 30, avgRating: 4.0 },
  PLATINUM: { score: 5000, uploads: 50, avgRating: 4.5 }
};

/**
 * Calculate reputation score for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Calculated reputation data
 */
export const calculateUserReputation = async (userId) => {
  try {
    // Get all user's approved uploads
    const uploadsResult = await query(
      `SELECT COUNT(*) as count 
       FROM study_materials 
       WHERE uploader_id = $1 AND status = 'approved'`,
      [userId]
    );
    const totalApprovedUploads = parseInt(uploadsResult.rows[0].count);

    // Get average rating across all user's approved resources
    const ratingsResult = await query(
      `SELECT 
        COALESCE(AVG(sm.average_rating), 0) as avg_rating,
        COALESCE(SUM(sm.rating_count), 0) as total_ratings
       FROM study_materials sm
       WHERE sm.uploader_id = $1 
         AND sm.status = 'approved'
         AND sm.rating_count > 0`,
      [userId]
    );
    const averageRating = parseFloat(ratingsResult.rows[0].avg_rating) || 0;
    const totalRatingsReceived = parseInt(ratingsResult.rows[0].total_ratings);

    // Get total downloads received
    const downloadsResult = await query(
      `SELECT COALESCE(SUM(download_count), 0) as total_downloads
       FROM study_materials
       WHERE uploader_id = $1 AND status = 'approved'`,
      [userId]
    );
    const totalDownloads = parseInt(downloadsResult.rows[0].total_downloads);

    // Get reviews written count
    const reviewsWrittenResult = await query(
      `SELECT COUNT(*) as count 
       FROM resource_reviews 
       WHERE user_id = $1`,
      [userId]
    );
    const reviewsWritten = parseInt(reviewsWrittenResult.rows[0].count);

    // Get helpful votes received on reviews
    const helpfulVotesResult = await query(
      `SELECT COALESCE(SUM(rr.helpful_count), 0) as total_helpful
       FROM resource_reviews rr
       WHERE rr.user_id = $1`,
      [userId]
    );
    const helpfulVotesReceived = parseInt(helpfulVotesResult.rows[0].total_helpful);

    // Calculate reputation score
    let reputationScore = 0;

    // Points from approved uploads
    reputationScore += totalApprovedUploads * POINTS.UPLOAD_APPROVED;

    // Points from ratings received (weighted by star value)
    const ratingsBreakdownResult = await query(
      `SELECT 
        rr.rating,
        COUNT(*) as count
       FROM resource_ratings rr
       INNER JOIN study_materials sm ON sm.id = rr.resource_id
       WHERE sm.uploader_id = $1 AND sm.status = 'approved'
       GROUP BY rr.rating`,
      [userId]
    );

    ratingsBreakdownResult.rows.forEach(row => {
      const rating = parseInt(row.rating);
      const count = parseInt(row.count);
      
      switch(rating) {
        case 5: reputationScore += count * POINTS.RATING_RECEIVED_5_STAR; break;
        case 4: reputationScore += count * POINTS.RATING_RECEIVED_4_STAR; break;
        case 3: reputationScore += count * POINTS.RATING_RECEIVED_3_STAR; break;
        case 2: reputationScore += count * POINTS.RATING_RECEIVED_2_STAR; break;
        case 1: reputationScore += count * POINTS.RATING_RECEIVED_1_STAR; break;
      }
    });

    // Points from reviews written
    reputationScore += reviewsWritten * POINTS.REVIEW_WRITTEN;

    // Points from helpful votes received
    reputationScore += helpfulVotesReceived * POINTS.REVIEW_HELPFUL_VOTE;

    // Points from downloads (capped to avoid spam)
    reputationScore += Math.min(totalDownloads, 1000) * POINTS.RESOURCE_DOWNLOADED;

    // Determine quality badge
    const qualityBadge = determineQualityBadge(
      reputationScore, 
      totalApprovedUploads, 
      averageRating
    );

    return {
      userId,
      reputationScore,
      totalUploads: totalApprovedUploads,
      totalApprovedUploads,
      totalDownloadsReceived: totalDownloads,
      totalRatingsReceived,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviewsWritten: reviewsWritten,
      totalHelpfulVotesReceived: helpfulVotesReceived,
      qualityBadge
    };
  } catch (error) {
    console.error('Error calculating reputation:', error);
    throw error;
  }
};

/**
 * Determine quality badge based on reputation metrics
 * @param {number} score - Reputation score
 * @param {number} uploads - Number of approved uploads
 * @param {number} avgRating - Average rating
 * @returns {string} Badge level
 */
const determineQualityBadge = (score, uploads, avgRating) => {
  // Check from highest to lowest
  if (
    score >= BADGE_THRESHOLDS.PLATINUM.score &&
    uploads >= BADGE_THRESHOLDS.PLATINUM.uploads &&
    avgRating >= BADGE_THRESHOLDS.PLATINUM.avgRating
  ) {
    return 'platinum';
  }

  if (
    score >= BADGE_THRESHOLDS.GOLD.score &&
    uploads >= BADGE_THRESHOLDS.GOLD.uploads &&
    avgRating >= BADGE_THRESHOLDS.GOLD.avgRating
  ) {
    return 'gold';
  }

  if (
    score >= BADGE_THRESHOLDS.SILVER.score &&
    uploads >= BADGE_THRESHOLDS.SILVER.uploads &&
    avgRating >= BADGE_THRESHOLDS.SILVER.avgRating
  ) {
    return 'silver';
  }

  if (
    score >= BADGE_THRESHOLDS.BRONZE.score &&
    uploads >= BADGE_THRESHOLDS.BRONZE.uploads &&
    avgRating >= BADGE_THRESHOLDS.BRONZE.avgRating
  ) {
    return 'bronze';
  }

  return 'none';
};

/**
 * Update reputation for a specific user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated reputation data
 */
export const updateUserReputation = async (userId) => {
  try {
    // Calculate new reputation
    const reputationData = await calculateUserReputation(userId);

    // Update or insert reputation record
    await query(
      `INSERT INTO user_reputation (
        user_id, reputation_score, total_uploads, total_approved_uploads,
        total_downloads_received, total_ratings_received, average_rating,
        total_reviews_written, total_helpful_votes_received, quality_badge
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        reputation_score = $2,
        total_uploads = $3,
        total_approved_uploads = $4,
        total_downloads_received = $5,
        total_ratings_received = $6,
        average_rating = $7,
        total_reviews_written = $8,
        total_helpful_votes_received = $9,
        quality_badge = $10,
        last_calculated = CURRENT_TIMESTAMP`,
      [
        userId,
        reputationData.reputationScore,
        reputationData.totalUploads,
        reputationData.totalApprovedUploads,
        reputationData.totalDownloadsReceived,
        reputationData.totalRatingsReceived,
        reputationData.averageRating,
        reputationData.totalReviewsWritten,
        reputationData.totalHelpfulVotesReceived,
        reputationData.qualityBadge
      ]
    );

    return reputationData;
  } catch (error) {
    console.error('Error updating user reputation:', error);
    throw error;
  }
};

/**
 * Recalculate reputation for all users
 * Use this for periodic updates or maintenance
 * @returns {Promise<number>} Number of users updated
 */
export const recalculateAllReputations = async () => {
  try {
    // Get all users who have uploaded resources
    const usersResult = await query(
      `SELECT DISTINCT uploader_id as user_id 
       FROM study_materials 
       WHERE uploader_id IS NOT NULL`
    );

    let updatedCount = 0;

    for (const row of usersResult.rows) {
      try {
        await updateUserReputation(row.user_id);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating reputation for user ${row.user_id}:`, error);
      }
    }

    console.log(`✅ Recalculated reputation for ${updatedCount} users`);
    return updatedCount;
  } catch (error) {
    console.error('Error recalculating all reputations:', error);
    throw error;
  }
};

/**
 * Get badge requirements for display
 * @returns {Object} Badge thresholds and point values
 */
export const getBadgeRequirements = () => {
  return {
    badges: BADGE_THRESHOLDS,
    points: POINTS
  };
};

export default {
  calculateUserReputation,
  updateUserReputation,
  recalculateAllReputations,
  getBadgeRequirements,
  POINTS,
  BADGE_THRESHOLDS
};
