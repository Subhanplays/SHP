import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// Create payment intent (for Stripe, etc.)
router.post('/create-intent', authenticate, async (req, res, next) => {
  try {
    const { amount, orderId, method = 'stripe' } = req.body;

    if (!amount || amount <= 0) {
      throw new ApiError(400, 'Invalid amount', 'INVALID_AMOUNT');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: req.userId,
        amount,
        method,
        status: 'pending',
        gatewayData: {
          orderId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        clientSecret: 'mock_client_secret', // In real implementation, this would come from Stripe
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get user's payments
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const payments = await prisma.payment.findMany({
      where: {
        userId: req.userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await prisma.payment.count({
      where: {
        userId: req.userId,
        ...(status && { status }),
      },
    });

    res.json({
      success: true,
      data: {
        payments,
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

// Webhook for payment providers
router.post('/webhook', async (req, res, next) => {
  try {
    const { event, type, data } = req.body;

    console.log('Payment webhook received:', type, event);

    // In a real implementation, you would:
    // 1. Verify webhook signature
    // 2. Handle different event types
    // 3. Update payment status
    // 4. Complete order if payment succeeded
    // 5. Create server if needed

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;