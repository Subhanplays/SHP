import { db } from '../config/database.js';

// Record an activity log entry (non-blocking, never throws)
export const createLog = async ({ action, userId = null, details = null, req = null }) => {
  try {
    await db.log.create({
      data: {
        action,
        userId,
        details,
        ipAddress: req?.ip || req?.connection?.remoteAddress || null,
        userAgent: req?.get?.('User-Agent') || null,
      },
    });
  } catch (error) {
    console.error('Failed to create log:', error);
  }
};
