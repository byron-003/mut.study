# Rating & Review System Integration Guide

This guide explains how to integrate the rating and review system into your resource displays.

## Components Available

### 1. **StarRating** - Interactive star rating selector
```jsx
import StarRating from './StarRating';

<StarRating 
  value={3} 
  onChange={(rating) => handleRatingChange(rating)}
  size="md"  // 'sm', 'md', 'lg'
  showValue={true}
  readonly={false}
/>
```

### 2. **RatingStats** - Display rating distribution
```jsx
import RatingStats from './RatingStats';

<RatingStats stats={{
  average_rating: 4.5,
  total_ratings: 120,
  five_star: 80,
  four_star: 25,
  three_star: 10,
  two_star: 3,
  one_star: 2
}} />
```

### 3. **ReviewForm** - Write/edit reviews
```jsx
import ReviewForm from './ReviewForm';

<ReviewForm 
  onSubmit={(text) => handleSubmit(text)}
  onCancel={() => setShowForm(false)}
  initialValue=""  // For editing
  isSubmitting={loading}
/>
```

### 4. **ReviewList** - Display reviews
```jsx
import ReviewList from './ReviewList';

<ReviewList 
  reviews={reviewsArray}
  onHelpful={(reviewId) => handleHelpful(reviewId)}
  onEdit={(review) => handleEdit(review)}
  onDelete={(reviewId) => handleDelete(reviewId)}
  onReport={(reviewId) => handleReport(reviewId)}
  loading={false}
/>
```

### 5. **ResourceRatingDisplay** - Compact display for cards
```jsx
import ResourceRatingDisplay from './ResourceRatingDisplay';

<ResourceRatingDisplay 
  averageRating={4.5}
  ratingCount={120}
  reviewCount={45}
  onClick={() => openRatingModal(resourceId)}
  size="sm"  // 'sm', 'md'
/>
```

### 6. **ResourceRatingReview** - Complete modal with all features
```jsx
import ResourceRatingReview from './ResourceRatingReview';

<ResourceRatingReview 
  resourceId={123}
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
/>
```

### 7. **QualityBadge** - Display contributor badges
```jsx
import QualityBadge from './QualityBadge';

<QualityBadge 
  badge="gold"  // 'none', 'bronze', 'silver', 'gold', 'platinum'
  size="md"
  showLabel={true}
  showTooltip={true}
/>
```

### 8. **Leaderboard** - Display top contributors
```jsx
import Leaderboard from './Leaderboard';

<Leaderboard 
  contributors={contributorsArray}
  loading={false}
  limit={10}
/>
```

## Integration Examples

### Example 1: Add Rating Display to Resource Cards

```jsx
// In DashboardPage.jsx or any resource list

import { useState } from 'react';
import ResourceRatingDisplay from '../components/ResourceRatingDisplay';
import ResourceRatingReview from '../components/ResourceRatingReview';

function ResourceCard({ resource }) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);

  const handleOpenRating = (resourceId) => {
    setSelectedResourceId(resourceId);
    setShowRatingModal(true);
  };

  return (
    <>
      <div className="resource-card">
        <h3>{resource.title}</h3>
        
        {/* Add rating display */}
        <ResourceRatingDisplay
          averageRating={resource.average_rating}
          ratingCount={resource.rating_count}
          reviewCount={resource.review_count}
          onClick={() => handleOpenRating(resource.id)}
          size="sm"
        />
        
        {/* Other resource info */}
      </div>

      {/* Rating & Review Modal */}
      <ResourceRatingReview
        resourceId={selectedResourceId}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />
    </>
  );
}
```

### Example 2: FileViewer Integration

```jsx
// In FileViewer.jsx - Add rating button to toolbar

import { useState } from 'react';
import { Star } from 'lucide-react';
import ResourceRatingReview from './ResourceRatingReview';

function FileViewer({ resource }) {
  const [showRatingModal, setShowRatingModal] = useState(false);

  return (
    <>
      <div className="file-viewer">
        {/* Toolbar */}
        <div className="toolbar">
          <button onClick={() => setShowRatingModal(true)}>
            <Star className="w-5 h-5" />
            Rate & Review
          </button>
        </div>

        {/* File content */}
      </div>

      <ResourceRatingReview
        resourceId={resource.id}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />
    </>
  );
}
```

### Example 3: Course Page with Top Rated Resources

```jsx
// In CoursePage.jsx

import { useState, useEffect } from 'react';
import { getTopRatedResources } from '../services/ratingReviewAPI';
import ResourceRatingDisplay from '../components/ResourceRatingDisplay';

function CoursePage() {
  const [topRated, setTopRated] = useState([]);

  useEffect(() => {
    loadTopRatedResources();
  }, []);

  const loadTopRatedResources = async () => {
    try {
      const response = await getTopRatedResources({ limit: 5, category: 'notes' });
      setTopRated(response.data);
    } catch (error) {
      console.error('Error loading top rated:', error);
    }
  };

  return (
    <div>
      <h2>Top Rated Resources</h2>
      {topRated.map(resource => (
        <div key={resource.id} className="resource-item">
          <h4>{resource.title}</h4>
          <ResourceRatingDisplay
            averageRating={resource.average_rating}
            ratingCount={resource.rating_count}
            reviewCount={resource.review_count}
            size="md"
          />
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Profile Page with User Reputation

```jsx
// In ProfilePage.jsx

import { useState, useEffect } from 'react';
import { getUserReputation } from '../services/ratingReviewAPI';
import QualityBadge from '../components/QualityBadge';

function ProfilePage({ userId }) {
  const [reputation, setReputation] = useState(null);

  useEffect(() => {
    loadReputation();
  }, [userId]);

  const loadReputation = async () => {
    try {
      const response = await getUserReputation(userId);
      setReputation(response.data.reputation);
    } catch (error) {
      console.error('Error loading reputation:', error);
    }
  };

  if (!reputation) return <div>Loading...</div>;

  return (
    <div className="profile">
      <div className="reputation-section">
        <QualityBadge 
          badge={reputation.quality_badge} 
          size="lg"
        />
        
        <div className="stats">
          <div>Reputation Score: {reputation.reputation_score}</div>
          <div>Average Rating: {reputation.average_rating}</div>
          <div>Uploads: {reputation.total_approved_uploads}</div>
          <div>Reviews Written: {reputation.total_reviews_written}</div>
        </div>
      </div>
    </div>
  );
}
```

### Example 5: Leaderboard Page

```jsx
// In LeaderboardPage.jsx

import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/ratingReviewAPI';
import Leaderboard from '../components/Leaderboard';

function LeaderboardPage() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await getLeaderboard({ limit: 20 });
      setContributors(response.data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard-page">
      <h1>Top Contributors</h1>
      <Leaderboard 
        contributors={contributors}
        loading={loading}
        limit={20}
      />
    </div>
  );
}
```

## API Service Usage

```javascript
import {
  addOrUpdateRating,
  getResourceRatings,
  deleteRating,
  addReview,
  getResourceReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
  getUserReputation,
  getLeaderboard,
  getTopRatedResources
} from '../services/ratingReviewAPI';

// Example: Submit a rating
const handleRating = async (resourceId, rating) => {
  try {
    const response = await addOrUpdateRating(resourceId, rating);
    console.log('Rating submitted:', response);
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};

// Example: Load reviews with pagination
const loadReviews = async (resourceId, page = 0) => {
  try {
    const response = await getResourceReviews(resourceId, {
      sort: 'helpful',
      limit: 10,
      offset: page * 10
    });
    console.log('Reviews:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Database Migration

Before using the rating/review system, run the database migration:

```bash
cd server
node migrations/run_ratings_reviews_migration.js
```

This will create all necessary tables:
- `resource_ratings`
- `resource_reviews`
- `review_helpful_votes`
- `user_reputation`
- `reputation_activities`

And add columns to `study_materials`:
- `rating_count`
- `average_rating`
- `review_count`

## Features

✅ **5-Star Rating System** - Users can rate resources 1-5 stars
✅ **Text Reviews** - Users can write detailed reviews
✅ **Helpful Votes** - Mark reviews as helpful
✅ **Review Reporting** - Report inappropriate reviews
✅ **User Reputation** - Track contributor quality
✅ **Quality Badges** - Bronze, Silver, Gold, Platinum
✅ **Leaderboard** - Display top contributors
✅ **Auto Stats** - Automatic calculation via database triggers
✅ **Dark Mode** - All components support dark mode

## Best Practices

1. **Always check authentication** before showing rating/review actions
2. **Load ratings asynchronously** to avoid blocking UI
3. **Show loading states** for better UX
4. **Handle errors gracefully** with user-friendly messages
5. **Use ResourceRatingDisplay** on cards for compact view
6. **Use ResourceRatingReview modal** for full experience
7. **Cache ratings data** to reduce API calls
8. **Update local state** after actions for instant feedback

## Troubleshooting

**Issue: Ratings not updating**
- Check if migration has been run
- Verify database triggers are active
- Check browser console for API errors

**Issue: Reviews not showing**
- Ensure resource is approved (status='approved')
- Check if reviews are flagged
- Verify API endpoint is correct

**Issue: Authentication errors**
- Check if token is in localStorage
- Verify token hasn't expired
- Ensure headers are set correctly in API calls
