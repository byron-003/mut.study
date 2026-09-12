import { query } from '../config/database.js';
import { updateUserReputation, getBadgeRequirements } from '../utils/reputationCalculator.js';

// =============================================
// RATING ENDPOINTS
// =============================================

/**
 * @route   POST /api/ratings
 * @desc    Add or update a rating for a resource
 * @access  Private (authenticated users)
 */
export const addOrUpdateRating = async (req, res) => {
  const { resourceId, rating } = req.body;
  const userId = req.user.id;

  try {
    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if resource exists and is approved
    const resourceResult = await query(
      'SELECT id, status FROM study_materials WHERE id = $1',
      [resourceId]
    );

    if (resourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (resourceResult.rows[0].status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate approved resources'
      });
    }

    // Check if user already rated this resource
    const existingRating = await query(
      'SELECT id FROM resource_ratings WHERE user_id = $1 AND resource_id = $2',
      [userId, resourceId]
    );

    if (existingRating.rows.length > 0) {
      // Update existing rating
      await query(
        'UPDATE resource_ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [rating, existingRating.rows[0].id]
      );

      res.json({
        success: true,
        message: 'Rating updated successfully',
        data: { id: existingRating.rows[0].id, rating }
      });
    } else {
      // Insert new rating
      const result = await query(
        'INSERT INTO resource_ratings (resource_id, user_id, rating) VALUES ($1, $2, $3) RETURNING id',
        [resourceId, userId, rating]
      );

      // Log reputation activity
      await query(
        `INSERT INTO reputation_activities (user_id, activity_type, points_earned, resource_id, description)
         SELECT uploader_id, 'rating_received', 5, $1, CONCAT('Received ', $2, '-star rating')
         FROM study_materials WHERE id = $1`,
        [resourceId, rating]
      );

      res.status(201).json({
        success: true,
        message: 'Rating added successfully',
        data: { id: result.rows[0].id, rating }
      });
    }
  } catch (error) {
    console.error('Error adding/updating rating:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/ratings/resource/:resourceId
 * @desc    Get all ratings for a resource (with stats)
 * @access  Public
 */
export const getResourceRatings = async (req, res) => {
  const { resourceId } = req.params;

  try {
    // Get rating statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*)::integer as total_ratings,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END)::integer as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END)::integer as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END)::integer as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END)::integer as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END)::integer as one_star
       FROM resource_ratings
       WHERE resource_id = $1`,
      [resourceId]
    );

    // Get user's rating if authenticated
    let userRating = null;
    if (req.user) {
      const userRatingResult = await query(
        'SELECT rating FROM resource_ratings WHERE resource_id = $1 AND user_id = $2',
        [resourceId, req.user.id]
      );
      userRating = userRatingResult.rows.length > 0 ? userRatingResult.rows[0].rating : null;
    }

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        userRating
      }
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/ratings/:resourceId
 * @desc    Delete user's rating for a resource
 * @access  Private
 */
export const deleteRating = async (req, res) => {
  const { resourceId } = req.params;
  const userId = req.user.id;

  try {
    const result = await query(
      'DELETE FROM resource_ratings WHERE resource_id = $1 AND user_id = $2',
      [resourceId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// =============================================
// REVIEW ENDPOINTS
// =============================================

/**
 * @route   POST /api/reviews
 * @desc    Add a review for a resource
 * @access  Private
 */
export const addReview = async (req, res) => {
  const { resourceId, reviewText } = req.body;
  const userId = req.user.id;

  try {
    // Validate review text
    if (!reviewText || reviewText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Review must be at least 10 characters long'
      });
    }

    if (reviewText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review must not exceed 1000 characters'
      });
    }

    // Check if resource exists and is approved
    const resourceResult = await query(
      'SELECT id, status FROM study_materials WHERE id = $1',
      [resourceId]
    );

    if (resourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (resourceResult.rows[0].status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Can only review approved resources'
      });
    }

    // Insert review
    const result = await query(
      'INSERT INTO resource_reviews (resource_id, user_id, review_text) VALUES ($1, $2, $3) RETURNING id',
      [resourceId, userId, reviewText.trim()]
    );

    // Get the created review with user info
    const reviewResult = await query(
      `SELECT 
        rr.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.profile_picture
       FROM resource_reviews rr
       JOIN users u ON rr.user_id = u.id
       WHERE rr.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: reviewResult.rows[0]
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/reviews/resource/:resourceId
 * @desc    Get all reviews for a resource
 * @access  Public
 */
export const getResourceReviews = async (req, res) => {
  const { resourceId } = req.params;
  const { sort = 'recent', limit = 10, offset = 0 } = req.query;

  try {
    // Determine sort order
    let orderBy = 'rr.created_at DESC'; // default: recent
    if (sort === 'helpful') {
      orderBy = 'rr.helpful_count DESC, rr.created_at DESC';
    } else if (sort === 'oldest') {
      orderBy = 'rr.created_at ASC';
    }

    // Get reviews with user info and helpful status
    const queryText = `
      SELECT 
        rr.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.profile_picture,
        ${req.user ? '(SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = rr.id AND user_id = $4)::integer as user_found_helpful' : '0 as user_found_helpful'}
      FROM resource_reviews rr
      JOIN users u ON rr.user_id = u.id
      WHERE rr.resource_id = $1 AND rr.is_flagged = FALSE
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
    `;

    const params = req.user 
      ? [resourceId, parseInt(limit), parseInt(offset), req.user.id]
      : [resourceId, parseInt(limit), parseInt(offset)];

    const reviewsResult = await query(queryText, params);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*)::integer as total FROM resource_reviews WHERE resource_id = $1 AND is_flagged = FALSE',
      [resourceId]
    );

    res.json({
      success: true,
      data: {
        reviews: reviewsResult.rows,
        total: countResult.rows[0].total,
        hasMore: countResult.rows[0].total > parseInt(offset) + reviewsResult.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Update a review
 * @access  Private (review author only)
 */
export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { reviewText } = req.body;
  const userId = req.user.id;

  try {
    // Validate review text
    if (!reviewText || reviewText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Review must be at least 10 characters long'
      });
    }

    if (reviewText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review must not exceed 1000 characters'
      });
    }

    // Check if review exists and belongs to user
    const reviewResult = await query(
      'SELECT id, user_id FROM resource_reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (reviewResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }

    // Update review
    await query(
      'UPDATE resource_reviews SET review_text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [reviewText.trim(), reviewId]
    );

    res.json({
      success: true,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (review author or admin)
 */
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    // Check if review exists
    const reviewResult = await query(
      'SELECT id, user_id FROM resource_reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check authorization
    if (reviewResult.rows[0].user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    // Delete review
    await query('DELETE FROM resource_reviews WHERE id = $1', [reviewId]);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/reviews/:reviewId/helpful
 * @desc    Mark a review as helpful
 * @access  Private
 */
export const markReviewHelpful = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  try {
    // Check if review exists
    const reviewResult = await query(
      'SELECT id FROM resource_reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked as helpful
    const existingVote = await query(
      'SELECT id FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (existingVote.rows.length > 0) {
      // Remove helpful vote (toggle)
      await query(
        'DELETE FROM review_helpful_votes WHERE review_id = $1 AND user_id = $2',
        [reviewId, userId]
      );

      res.json({
        success: true,
        message: 'Helpful vote removed',
        action: 'removed'
      });
    } else {
      // Add helpful vote
      await query(
        'INSERT INTO review_helpful_votes (review_id, user_id) VALUES ($1, $2)',
        [reviewId, userId]
      );

      res.json({
        success: true,
        message: 'Marked as helpful',
        action: 'added'
      });
    }
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/reviews/:reviewId/report
 * @desc    Report a review for inappropriate content
 * @access  Private
 */
export const reportReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    // Check if review exists
    const reviewResult = await query(
      'SELECT id, reported_count FROM resource_reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Increment report count
    const newReportCount = reviewResult.rows[0].reported_count + 1;
    const shouldFlag = newReportCount >= 3; // Auto-flag after 3 reports

    await query(
      'UPDATE resource_reviews SET reported_count = $1, is_flagged = $2 WHERE id = $3',
      [newReportCount, shouldFlag, reviewId]
    );

    res.json({
      success: true,
      message: 'Review reported successfully',
      flagged: shouldFlag
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// =============================================
// REPUTATION & LEADERBOARD ENDPOINTS
// =============================================

/**
 * @route   GET /api/reputation/user/:userId
 * @desc    Get user's reputation details
 * @access  Public
 */
export const getUserReputation = async (req, res) => {
  const { userId } = req.params;

  try {
    const reputationResult = await query(
      `SELECT 
        ur.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.profile_picture
       FROM user_reputation ur
       JOIN users u ON ur.user_id = u.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    if (reputationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User reputation not found'
      });
    }

    // Get recent activities
    const activitiesResult = await query(
      `SELECT * FROM reputation_activities
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        reputation: reputationResult.rows[0],
        recentActivities: activitiesResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching reputation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/reputation/leaderboard
 * @desc    Get top contributors leaderboard
 * @access  Public
 */
export const getLeaderboard = async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  try {
    const result = await query(
      `SELECT * FROM v_top_contributors
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/resources/top-rated
 * @desc    Get top-rated resources
 * @access  Public
 */
export const getTopRatedResources = async (req, res) => {
  const { limit = 10, category } = req.query;

  try {
    let queryText = 'SELECT * FROM v_top_rated_resources';
    const params = [];

    if (category) {
      queryText += ' WHERE category = $1';
      params.push(category);
    }

    queryText += ` LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching top-rated resources:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


/**
 * @route   POST /api/reputation/recalculate/:userId
 * @desc    Manually recalculate reputation for a user (admin or self)
 * @access  Private
 */
export const recalculateReputation = async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    // Check authorization
    if (parseInt(userId) !== requesterId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to recalculate this user\'s reputation'
      });
    }

    // Recalculate reputation
    const reputationData = await updateUserReputation(userId);

    res.json({
      success: true,
      message: 'Reputation recalculated successfully',
      data: reputationData
    });
  } catch (error) {
    console.error('Error recalculating reputation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/reputation/badge-requirements
 * @desc    Get badge requirements and point values
 * @access  Public
 */
export const getBadgeInfo = async (req, res) => {
  try {
    const requirements = getBadgeRequirements();
    
    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('Error fetching badge requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
