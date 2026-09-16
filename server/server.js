import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import passwordResetRoutes from './routes/passwordResetRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import classRepRoutes from './routes/classRepRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import fileProxyRoutes from './routes/fileProxyRoutes.js';
import ratingReviewRoutes from './routes/ratingReviewRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { query } from './config/database.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initializeSocket, getConnectedUserCount } from './config/socket.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Auto-run database migrations on startup
async function runMigrations() {
  try {
    console.log('🔄 Checking for pending migrations...');
    
    // Check if system_settings table exists (migration 012)
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_settings'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📝 Running downloads setting migration...');
      const migrationPath = path.join(__dirname, 'migrations', '012_add_downloads_setting.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await query(migrationSQL);
      console.log('✅ Downloads setting migration completed!');
    }
    
    // Check if is_class_rep column exists (migration 013)
    const columnCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_class_rep'
      );
    `);
    
    if (!columnCheck.rows[0].exists) {
      console.log('📝 Running class rep role migration...');
      const migrationPath = path.join(__dirname, 'migrations', '013_add_class_rep_role.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await query(migrationSQL);
      console.log('✅ Class rep role migration completed!');
    }
    
    // Check if notifications table exists (migration 014)
    const notificationsTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);
    
    if (!notificationsTableCheck.rows[0].exists) {
      console.log('📝 Running notifications system migration...');
      const migrationPath = path.join(__dirname, 'migrations', '014_create_notifications.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await query(migrationSQL);
      console.log('✅ Notifications system migration completed!');
    }
    
    // Check if notification media columns exist (migration 015)
    const mediaColumnCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'media_url'
      );
    `);
    
    if (!mediaColumnCheck.rows[0].exists) {
      console.log('📝 Running notification media migration...');
      const migrationPath = path.join(__dirname, 'migrations', '015_add_notification_media.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await query(migrationSQL);
      console.log('✅ Notification media migration completed!');
    }
    
    // Check if notification link columns exist (migration 017)
    const linkColumnCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'link_url'
      );
    `);
    
    if (!linkColumnCheck.rows[0].exists) {
      console.log('📝 Running notification link migration...');
      const migrationPath = path.join(__dirname, 'migrations', '017_add_notification_link.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await query(migrationSQL);
      console.log('✅ Notification link migration completed!');
    }
    
    // Check if ratings and reviews tables exist (migration 016)
    const ratingsTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'resource_ratings'
      );
    `);
    
    if (!ratingsTableCheck.rows[0].exists) {
      console.log('📝 Running ratings and reviews system migration...');
      const migrationPath = path.join(__dirname, 'migrations', '016_create_ratings_reviews_postgres.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await query(migrationSQL);
      console.log('✅ Ratings and reviews system migration completed!');
    }
    
    // Check if advanced_features_enabled column exists (migration 018)
    const advancedFeaturesCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'advanced_features_enabled'
      );
    `);
    
    if (!advancedFeaturesCheck.rows[0].exists) {
      console.log('📝 Running user settings and AI summaries migration...');
      const migrationPath = path.join(__dirname, 'migrations', '018_add_user_settings_ai_summaries.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await query(migrationSQL);
      console.log('✅ User settings and AI summaries migration completed!');
    }
    
    console.log('✅ All migrations up to date');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Don't stop server if migration fails
  }
}

runMigrations();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(cors({
  origin: [
    'https://admin-mutstudy.onrender.com',
    'https://mut-study.onrender.com',
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Serve static files from client dist folder in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));
  console.log(`📦 Serving client from: ${clientDistPath}`);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/class-rep', classRepRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', ratingReviewRoutes); // Ratings, reviews, reputation endpoints
app.use('/api/files', fileProxyRoutes); // File viewing and download proxy

// Public settings endpoint
import { getDownloadsEnabled } from './controllers/adminController.js';
app.get('/api/settings/downloads-enabled', getDownloadsEnabled);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const result = await query('SELECT NOW() as time');
    
    res.json({ 
      status: 'ok', 
      message: 'MUT Study Hub API is running',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        serverTime: result.rows[0].time
      },
      websocket: {
        connected: true,
        activeConnections: getConnectedUserCount()
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message
      },
      websocket: {
        connected: true,
        activeConnections: getConnectedUserCount()
      }
    });
  }
});

// Serve client app for all non-API routes (in production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const clientIndexPath = path.join(__dirname, '../client/dist/index.html');
    res.sendFile(clientIndexPath);
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 MUT Study Hub API - Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
export { io };
