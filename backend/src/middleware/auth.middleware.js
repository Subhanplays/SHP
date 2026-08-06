import { verifyToken } from '../utils/jwt.js';
import { db } from '../config/database.js';
import { ApiError } from './error.middleware.js';

// Verify JWT and attach user to request
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access denied. No token provided.', 'NO_TOKEN');
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired token', 'INVALID_TOKEN');
    }

    // Load user from database
    const user = await db.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new ApiError(401, 'User not found', 'USER_NOT_FOUND');
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(401, 'Invalid or expired token', 'INVALID_TOKEN'));
    }
  }
};

// Check if user is admin
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required', 'NO_USER');
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      throw new ApiError(403, 'Admin access required', 'FORBIDDEN');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is superadmin
export const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required', 'NO_USER');
    }

    if (req.user.role !== 'superadmin') {
      throw new ApiError(403, 'Super admin access required', 'FORBIDDEN');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decoded = verifyToken(token);

      const user = await db.user.findUnique({
        where: { id: decoded.id },
      });

      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
