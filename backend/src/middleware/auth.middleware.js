import { verifyFirebaseToken } from '../config/firebase.js';
import { prisma } from '../config/database.js';
import { ApiError } from './error.middleware.js';

// Verify Firebase token and attach user to request
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access denied. No token provided.', 'NO_TOKEN');
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(token);
    
    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user) {
      // Auto-create user on first login
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          username: decodedToken.email.split('@')[0],
          avatar: decodedToken.picture || null,
        },
      });

      // Give signup bonus if enabled
      const settings = await prisma.settings.findUnique({
        where: { key: 'coins_signup_reward' },
      });
      
      if (settings && settings.value.enabled) {
        const rewardAmount = parseInt(settings.value.amount) || 1000;
        await prisma.user.update({
          where: { id: user.id },
          data: { coins: rewardAmount },
        });
        
        await prisma.coinTransaction.create({
          data: {
            userId: user.id,
            amount: rewardAmount,
            balance: rewardAmount,
            type: 'signup',
            description: 'Signup reward',
          },
        });
      }
    }

    req.user = user;
    req.userId = user.id;
    req.firebaseUid = decodedToken.uid;
    
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
      const decodedToken = await verifyFirebaseToken(token);
      
      const user = await prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
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