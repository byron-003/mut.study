import { AppError } from './errorHandler.js';

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'admin') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }

  next();
};

/**
 * Middleware to check if user is class representative
 */
export const requireClassRep = (req, res, next) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'class_rep' && req.user.role !== 'admin') {
    throw new AppError('Access denied. Class representative privileges required.', 403);
  }

  next();
};
