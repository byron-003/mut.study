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
    
    // Check if system_settings table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_settings'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📝 Running downloads setting migration...');
      
      // Read and execute migration
      const migrationPath = path.join(__dirname, 'migrations', '012_add_downloads_setting.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await query(migrationSQL);
      
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('✅ All migrations up to date');
    }
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
