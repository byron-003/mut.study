# Redis Setup Guide for Production

## 🔴 What is Redis?

Redis is an **in-memory data store** that acts as a super-fast cache for your application. Think of it as a lightning-fast memory layer between your app and database.

### Why Use Redis?
- ⚡ **10-20x faster** than database queries
- 🔥 **70% reduction** in database load
- 💪 **Handles 10,000+ users** easily
- 📊 **Sub-millisecond** response times

### Do I Need Redis?
- **< 1,000 users**: Optional (nice to have)
- **1,000 - 5,000 users**: Recommended
- **5,000+ users**: **Required** for good performance

---

## 🚀 Quick Start (3 Options)

### Option 1: Free Cloud Redis (Recommended for Production)

#### Upstash Redis (Best Free Tier)
**Free Tier**: 10,000 commands/day, 256MB storage

1. **Sign up**: [upstash.com](https://upstash.com)
2. **Create database**:
   - Click "Create Database"
   - Choose region closest to your server
   - Select "Free" plan
   - Click "Create"

3. **Get connection URL**:
   - Copy the "Redis URL" (starts with `redis://`)
   - Example: `redis://default:abc123xyz@us1-modern-cat-12345.upstash.io:6379`

4. **Add to `.env`**:
   ```env
   REDIS_URL=redis://default:your_password@your-host.upstash.io:6379
   ```

5. **Test connection**:
   ```bash
   npm start
   # Should see: "🔴 Redis client connected" in logs
   ```

✅ **Done! Your cache is now active.**

---

### Option 2: Redis Cloud (Redis Labs)

**Free Tier**: 30MB storage, SSL/TLS included

1. **Sign up**: [redis.com/try-free](https://redis.com/try-free/)
2. **Create subscription**:
   - Choose "Free" plan
   - Select cloud provider (AWS/GCP/Azure)
   - Choose region closest to your server

3. **Create database**:
   - Click "New Database"
   - Name: `mut-study-hub-cache`
   - Keep defaults

4. **Get credentials**:
   - Go to "Configuration" tab
   - Copy "Public endpoint" (e.g., `redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345`)
   - Copy "Default user password"

5. **Add to `.env`**:
   ```env
   REDIS_URL=redis://default:your_password@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
   ```

---

### Option 3: Render Redis (If Your Server is on Render)

**Free Tier**: 25MB storage (good for 5,000 users)

1. **Log into Render Dashboard**
2. **Create Redis Instance**:
   - Click "New +" → "Redis"
   - Name: `mut-study-hub-redis`
   - Region: Same as your web service
   - Plan: Free
   - Click "Create Redis"

3. **Get Connection URL**:
   - Click on your Redis instance
   - Copy "Internal Redis URL" (for same region) or "External Redis URL"
   - Example: `redis://red-abc123:xyz789@oregon-redis.render.com:6379`

4. **Add to Render Environment Variables**:
   - Go to your web service dashboard
   - Click "Environment"
   - Add variable:
     ```
     REDIS_URL=redis://red-abc123:xyz789@oregon-redis.render.com:6379
     ```
   - Click "Save Changes"

5. **Redeploy**: Render will auto-redeploy with Redis enabled

---

## 🏠 Local Development Setup

### Windows (via WSL or Docker)

#### Using Docker (Easiest):
```bash
# Start Redis container
docker run -d --name redis-dev -p 6379:6379 redis:alpine

# Add to .env
REDIS_URL=redis://localhost:6379

# Test
docker exec -it redis-dev redis-cli ping
# Should return: PONG
```

#### Using WSL:
```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Add to .env
REDIS_URL=redis://localhost:6379
```

### Mac

```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Add to .env
REDIS_URL=redis://localhost:6379

# Test
redis-cli ping
# Should return: PONG
```

### Linux

```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Add to .env
REDIS_URL=redis://localhost:6379

# Test
redis-cli ping
# Should return: PONG
```

---

## ⚙️ Environment Variable Options

### Option 1: Single URL (Recommended)
```env
REDIS_URL=redis://default:password@host:6379
```

**Format**: `redis://[username]:[password]@[host]:[port]/[db]`

**Examples**:
- No password: `redis://localhost:6379`
- With password: `redis://default:mypass123@localhost:6379`
- Cloud: `redis://default:abc123@redis-12345.cloud.redislabs.com:12345`
- TLS: `rediss://default:abc123@secure-host.com:6379` (note: rediss with double 's')

### Option 2: Individual Settings
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_TLS=true
```

**Use when**: Your Redis provider gives individual credentials

---

## 🧪 Testing Your Redis Connection

### 1. Check Server Logs
```bash
npm start
# Look for these messages:
# ✅ "Redis client connected"
# ✅ "Redis client ready"
# ❌ "Redis error: ..." (if connection fails)
```

### 2. Test Caching
```bash
# Make a request to your API
curl http://localhost:5000/api/programs

# Check logs - should see cache activity
# "Cache miss: programs:list" (first request)
# "Cache hit: programs:list" (subsequent requests)
```

### 3. Monitor Redis
```bash
# If using Redis CLI
redis-cli
> MONITOR
# Shows all Redis commands in real-time

> INFO stats
# Shows hit rate and statistics

> KEYS *
# Shows all cached keys
```

---

## 📊 What Gets Cached?

The application automatically caches:

| Data Type | Cache Key | TTL | Use Case |
|-----------|-----------|-----|----------|
| **Programs List** | `programs:list` | 1 hour | Program dropdown/listing |
| **Program Details** | `program:123` | 1 hour | Individual program info |
| **Courses by Program** | `courses:program:456` | 30 min | Course listings |
| **Leaderboard** | `leaderboard:top100` | 5 min | Top users ranking |
| **User Stats** | `stats:user:789` | 10 min | Dashboard statistics |
| **Settings** | `settings:all` | 6 hours | System settings |
| **Search Results** | `search:term:filters` | 5 min | Search queries |

**TTL** = Time To Live (how long cache is valid before refresh)

---

## 🔧 Cache Implementation (For Developers)

### Using Cache in Your Controllers

```javascript
import { cache, cacheKeys, cacheTTL } from '../config/redis.js';

// Example: Cache programs list
export const getPrograms = async (req, res) => {
  try {
    // Try to get from cache first
    const cacheKey = cacheKeys.programs();
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      console.log('✅ Cache hit: programs');
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    // Cache miss - fetch from database
    console.log('❌ Cache miss: programs');
    const result = await query('SELECT * FROM programs ORDER BY name');
    const programs = result.rows;
    
    // Store in cache for 1 hour
    await cache.set(cacheKey, programs, cacheTTL.ONE_HOUR);
    
    res.json({
      success: true,
      data: programs,
      cached: false
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Invalidating Cache

```javascript
// When data is updated, clear the cache
export const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update database
    await query('UPDATE programs SET ... WHERE id = $1', [id]);
    
    // Clear related caches
    await cache.del(cacheKeys.programs());
    await cache.del(cacheKeys.program(id));
    await cache.delPattern('courses:program:*'); // Clear all course caches
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 🚨 Troubleshooting

### Redis Connection Failed

**Symptom**: "Redis error: connect ECONNREFUSED"

**Solutions**:
1. Check Redis is running:
   ```bash
   # Docker
   docker ps | grep redis
   
   # Local
   redis-cli ping
   ```

2. Check firewall/network:
   - Cloud Redis: Whitelist your server IP
   - Local: Check if port 6379 is open

3. Check credentials:
   ```bash
   # Test connection manually
   redis-cli -h hostname -p port -a password
   ```

### Cache Not Working

**Symptom**: No "Cache hit" messages in logs

**Solutions**:
1. Check Redis connection:
   ```bash
   curl http://localhost:5000/api/health
   # Look for Redis status in response
   ```

2. Check environment variables:
   ```bash
   # In your server
   console.log('REDIS_URL:', process.env.REDIS_URL ? 'Set' : 'Not set');
   ```

3. Check cache implementation:
   - Ensure controllers use `cache.get()` and `cache.set()`
   - Check logs for cache operations

### High Memory Usage

**Symptom**: Redis using too much memory

**Solutions**:
1. Check memory usage:
   ```bash
   redis-cli INFO memory
   ```

2. Clear old cache:
   ```bash
   redis-cli FLUSHDB
   ```

3. Reduce TTL values in `config/redis.js`

---

## 📈 Performance Monitoring

### Check Cache Hit Rate

```bash
# Connect to Redis
redis-cli

# Get stats
> INFO stats
# Look for:
# keyspace_hits: 10000
# keyspace_misses: 1000
# Hit rate = 10000/(10000+1000) = 90.9%
```

**Target**: 70%+ hit rate

### Monitor Cache Size

```bash
redis-cli
> INFO memory
# Look for:
# used_memory_human: 2.5M
# maxmemory_human: 256M
```

### View Cached Keys

```bash
redis-cli
> KEYS *
# Shows all keys
# Example output:
# 1) "programs:list"
# 2) "leaderboard:top100"
# 3) "stats:user:123"
```

---

## 💰 Cost Comparison

| Provider | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Upstash** | 10K cmds/day, 256MB | From $0.20/100K cmds | Serverless, pay-per-use |
| **Redis Cloud** | 30MB, Unlimited cmds | From $5/mo | Traditional hosting |
| **Render** | 25MB | From $7/mo | If already on Render |
| **AWS ElastiCache** | None | From $15/mo | Enterprise, AWS users |
| **DigitalOcean** | None | From $15/mo | Managed Redis |
| **Aiven** | 30-day trial | From $10/mo | Multi-cloud |

### Recommendation:
- **Development**: Docker (free, local)
- **Production (< 5K users)**: Upstash or Render free tier
- **Production (5K-10K users)**: Redis Cloud $5/mo or Upstash pay-as-you-go
- **Production (10K+ users)**: Redis Cloud $10-25/mo or managed hosting

---

## ✅ Production Checklist

Before going live with Redis:

- [ ] Redis instance created and accessible
- [ ] `REDIS_URL` set in production environment
- [ ] Connection tested (see "Redis client ready" in logs)
- [ ] Cache hit rate > 70% after 1 hour of traffic
- [ ] Memory usage < 80% of allocated
- [ ] Monitoring/alerts configured
- [ ] Backup strategy (if using paid tier)
- [ ] TLS/SSL enabled (for cloud providers)
- [ ] Access control configured (password, IP whitelist)

---

## 🎓 FAQ

**Q: Do I need Redis to run the application?**  
A: No! The app works fine without Redis, just with reduced performance. Redis is optional but highly recommended for production.

**Q: What happens if Redis goes down?**  
A: The app automatically falls back to direct database queries. You'll see "Cache get error" in logs but the app continues working.

**Q: How much Redis storage do I need?**  
A: 
- 1,000 users: ~10-25MB
- 5,000 users: ~25-50MB  
- 10,000 users: ~50-100MB

**Q: Can I use Redis for sessions?**  
A: Yes! The current implementation focuses on data caching, but you can extend it for session storage.

**Q: Should I use the same Redis for dev and prod?**  
A: No! Use separate instances:
- Dev: Local Docker
- Staging: Small cloud instance
- Production: Dedicated cloud instance

**Q: How do I clear the cache?**  
A:
```bash
# Clear all cache
redis-cli FLUSHDB

# Or restart Redis
docker restart redis-dev
```

---

## 🚀 Next Steps

1. **Choose your Redis provider** (recommend Upstash for free tier)
2. **Create Redis instance** (5 minutes)
3. **Add `REDIS_URL` to `.env`**
4. **Restart your server**
5. **Monitor cache hit rate**

Your app is now ready to handle 10,000+ users with blazing-fast performance! 🎉
