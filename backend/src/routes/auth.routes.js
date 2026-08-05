import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        _count: {
          select: {
            servers: true,
            orders: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        discordId: user.discordId,
        role: user.role,
        coins: user.coins,
        createdAt: user.createdAt,
        serversCount: user._count.servers,
        ordersCount: user._count.orders,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { username, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(username && { username }),
        ...(avatar !== undefined && { avatar }),
      },
    });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Link Discord account
router.post('/link-discord', authenticate, async (req, res, next) => {
  try {
    const { discordId, discordAvatar } = req.body;

    if (!discordId) {
      throw new ApiError(400, 'Discord ID is required', 'MISSING_DISCORD_ID');
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        discordId,
        ...(discordAvatar && { avatar: discordAvatar }),
      },
    });

    res.json({
      success: true,
      message: 'Discord account linked successfully',
      data: {
        discordId: updatedUser.discordId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Unlink Discord account
router.delete('/unlink-discord', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { discordId: null },
    });

    res.json({
      success: true,
      message: 'Discord account unlinked successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get user notifications
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.userId,
        ...(unreadOnly === 'true' && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.userId,
        read: false,
      },
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== req.userId) {
      throw new ApiError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        read: false,
      },
      data: { read: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

export default router;