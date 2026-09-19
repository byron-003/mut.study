import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Client Configuration for Caching and Session Management
 * Provides 10-100x performance improvement for frequently accessed data
 */

let redisClient = null;
let isRedisAvailable = false;

// Only initialize Redis if configured
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    // Redis connection options
    const redisOptions = {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY errors
          return true;
        }
        return false;
      }
    };

    // Initialize Redis client
    if (process.env.REDIS_URL) {
      // Cloud Redis (e.g., Redis Cloud, Heroku Redis)
      redisClient = new Redis(process.env.REDIS_URL, redisOptions);
    } else {
      // Self-hosted Redis
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        ...redisOptions
      });
    }

    // Event handlers
    redisClient.on('connect', () => {
      console.log('🔴 Redis client connected');
      isRedisAvailable = true;
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis client ready');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      console.log('🔴 Redis connection closed');
      isRedisAvailable = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
      isRedisAvailable = false;
    });

  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    console.log('⚠️  Running without Redis cache (degraded performance)');
  }
} else {
  console.log('⚠️  Redis not configured. Set REDIS_URL or REDIS_HOST to enable caching.');
  console.log('💡 Application will work without Redis, but performance will be reduced.');
}

/**
 * Cache wrapper with fallback to database
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get(key) {
    if (!isRedisAvailable || !redisClient) return null;
    
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 5 minutes)
   */
  async set(key, value, ttl = 300) {
    if (!isRedisAvailable || !redisClient) return false;
    
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  },

  /**
   * Delete key from cache
   */
  async del(key) {
    if (!isRedisAvailable || !redisClient) return false;
    
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  },

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    if (!isRedisAvailable || !redisClient) return false;
    
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error.message);
      return false;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!isRedisAvailable || !redisClient) return false;
    
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error.message);
      return false;
    }
  },

  /**
   * Get or set pattern - get from cache or compute and cache
   */
  async getOrSet(key, fetchFn, ttl = 300) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch from source
    const value = await fetchFn();
    
    // Cache the result
    await this.set(key, value, ttl);
    
    return value;
  },

  /**
   * Increment counter
   */
  async incr(key, ttl = null) {
    if (!isRedisAvailable || !redisClient) return 1;
    
    try {
      const value = await redisClient.incr(key);
      if (ttl && value === 1) {
        // Set TTL on first increment
        await redisClient.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error('Cache incr error:', error.message);
      return 1;
    }
  },

  /**
   * Get Redis client for advanced operations
   */
  getClient() {
    return redisClient;
  },

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return isRedisAvailable;
  },

  /**
   * Close Redis connection
   */
  async close() {
    if (redisClient) {
      await redisClient.quit();
      console.log('Redis connection closed');
    }
  }
};

// Cache key builders for consistency
export const cacheKeys = {
  // User cache keys
  user: (id) => `user:${id}`,
  userByEmail: (email) => `user:email:${email}`,
  
  // Program cache keys
  program: (id) => `program:${id}`,
  programs: () => 'programs:list',
  programsDropdown: () => 'programs:dropdown',
  
  // Course cache keys
  course: (id) => `course:${id}`,
  coursesByProgram: (programId) => `courses:program:${programId}`,
  
  // Resource cache keys
  resource: (id) => `resource:${id}`,
  resourcesByProgram: (programId, page) => `resources:program:${programId}:page:${page}`,
  
  // Settings cache keys
  setting: (key) => `setting:${key}`,
  settings: () => 'settings:all',
  
  // Leaderboard cache
  leaderboard: (limit = 100) => `leaderboard:top${limit}`,
  
  // Notifications cache
  userNotifications: (userId, page) => `notifications:user:${userId}:page:${page}`,
  unreadCount: (userId) => `notifications:user:${userId}:unread`,
  
  // Stats cache
  dashboardStats: () => 'stats:dashboard',
  userStats: (userId) => `stats:user:${userId}`,
  
  // Search cache
  searchResults: (query, filters) => `search:${query}:${JSON.stringify(filters)}`
};

// Default TTL values (in seconds)
export const cacheTTL = {
  FIVE_MINUTES: 300,
  TEN_MINUTES: 600,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  SIX_HOURS: 21600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800
};

export default cache;
