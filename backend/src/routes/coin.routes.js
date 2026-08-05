import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// Get current coin balance
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { coins: true },
    });

    res.json({
      success: true,
      data: {
        balance: user.coins,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get coin transaction history
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const { type, limit = 20, page = 1 } = req.query;

    const transactions = await prisma.coinTransaction.findMany({
      where: {
        userId: req.userId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await prisma.coinTransaction.count({
      where: {
        userId: req.userId,
        ...(type && { type }),
      },
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;