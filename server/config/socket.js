import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from './database.js';

let io;

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user details
      const userResult = await query(
        'SELECT id, first_name, last_name, email, role, program_id FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = userResult.rows[0];
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.email} (ID: ${socket.user.id})`);

    // Join user-specific room
    socket.join(`user:${socket.user.id}`);

    // Join program-specific room if user has a program
    if (socket.user.program_id) {
      socket.join(`program:${socket.user.program_id}`);
      console.log(`📚 User joined program room: ${socket.user.program_id}`);
    }

    // Join role-specific room
    socket.join(`role:${socket.user.role}`);

    // Handle manual room joins (for courses, forums, etc.)
    socket.on('join:course', (courseId) => {
      socket.join(`course:${courseId}`);
      console.log(`📖 User joined course room: ${courseId}`);
    });

    socket.on('leave:course', (courseId) => {
      socket.leave(`course:${courseId}`);
      console.log(`📖 User left course room: ${courseId}`);
    });

    socket.on('join:forum', () => {
      socket.join('forum');
      console.log(`💬 User joined forum room`);
    });

    socket.on('leave:forum', () => {
      socket.leave('forum');
      console.log(`💬 User left forum room`);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.email}`);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Emit event to specific user
 */
export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit event to specific program
 */
export const emitToProgram = (programId, event, data) => {
  if (!io) return;
  io.to(`program:${programId}`).emit(event, data);
};

/**
 * Emit event to specific course
 */
export const emitToCourse = (courseId, event, data) => {
  if (!io) return;
  io.to(`course:${courseId}`).emit(event, data);
};

/**
 * Emit event to all users with specific role
 */
export const emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
};

/**
 * Emit event to forum
 */
export const emitToForum = (event, data) => {
  if (!io) return;
  io.to('forum').emit(event, data);
};

/**
 * Emit event to all connected users
 */
export const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

/**
 * Get connected user count
 */
export const getConnectedUserCount = () => {
  if (!io) return 0;
  return io.sockets.sockets.size;
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId) => {
  if (!io) return false;
  const sockets = io.sockets.sockets;
  for (let [, socket] of sockets) {
    if (socket.user && socket.user.id === userId) {
      return true;
    }
  }
  return false;
};
