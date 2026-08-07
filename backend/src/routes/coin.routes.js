import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';
import { createLog } from '../utils/logs.js';

const router = Router();

// Get current coin balance
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.userId }, select: { coins: true } });
    res.json({ success: true, data: { balance: user.coins } });
  } catch (error) {
    next(error);
  }
});

// Get coin transaction history
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const { type, limit = 20, page = 1 } = req.query;

    const transactions = await db.coinTransaction.findMany({
      where: { userId: req.userId, ...(type && { type }) },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.coinTransaction.count({ where: { userId: req.userId, ...(type && { type }) } });

    res.json({
      success: true,
      data: { transactions, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    next(error);
  }
});

// Claim the daily reward (once per 24 hours)
router.post('/daily-reward', authenticate, async (req, res, next) => {
  try {
    const settings = await db.settings.findUnique({ where: { key: 'coins_daily_reward' } });
    const enabled = settings?.value?.enabled !== false;
    const rewardAmount = parseInt(settings?.value?.amount) || 100;

    if (!enabled || rewardAmount <= 0) {
      throw new ApiError(400, 'Daily rewards are disabled', 'DAILY_REWARD_DISABLED');
    }

    const user = await db.user.findUnique({ where: { id: req.userId } });

    const now = new Date();
    const lastClaim = user.lastDailyReward ? new Date(user.lastDailyReward) : null;
    if (lastClaim) {
      const sinceLast = now.getTime() - lastClaim.getTime();
      if (sinceLast < 24 * 60 * 60 * 1000) {
        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - sinceLast) / (1000 * 60 * 60));
        throw new ApiError(400, `You can claim again in about ${hoursLeft} hour(s)`, 'DAILY_REWARD_COOLDOWN');
      }
    }

    const newBalance = user.coins + rewardAmount;
    await db.user.update({
      where: { id: req.userId },
      data: { coins: newBalance, lastDailyReward: now },
    });
    await db.coinTransaction.create({
      data: {
        userId: req.userId,
        amount: rewardAmount,
        balance: newBalance,
        type: 'daily',
        description: 'Daily login reward',
      },
    });
    await createLog({ action: 'coins.daily_reward', userId: req.userId, details: { amount: rewardAmount }, req });

    res.json({
      success: true,
      message: `You claimed ${rewardAmount} SHP Coins!`,
      data: { amount: rewardAmount, balance: newBalance },
    });
  } catch (error) {
    next(error);
  }
});

// Get referral info: code, link, referred users, and earned rewards
router.get('/referral', authenticate, async (req, res, next) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.userId } });

    const referrals = await db.referral.findMany({
      where: { referrerId: req.userId },
      include: {
        referred: { select: { id: true, username: true, email: true, avatar: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ref=${user.referralCode}`,
        referrals,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
