import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';
import { finalizeOrder } from './order.routes.js';
import { createLog } from '../utils/logs.js';
import { sendDiscordNotification } from '../utils/discord.js';

const router = Router();

const completePayment = async (payment) => {
  await db.payment.update({ where: { id: payment.id }, data: { status: 'completed' } });

  // Order payment
  const orderId = payment.gatewayData?.orderId;
  if (orderId) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (order && order.status === 'pending') {
      await db.order.update({ where: { id: orderId }, data: { status: 'completed', paymentId: payment.id } });
      await db.payment.update({ where: { id: payment.id }, data: { transactionId: payment.id } });
      await sendDiscordNotification('Order Paid', `Order **${orderId}** was paid ($${payment.amount}) via ${payment.method}.`, 0x10b981);
      await finalizeOrder(orderId);
      return { kind: 'order', orderId };
    }
  }

  return { kind: 'payment' };
};

// Create a checkout session (sandbox gateway - swap in Stripe/PayPal/Crypto)
router.post('/checkout', authenticate, async (req, res, next) => {
  try {
    const { amount, orderId, method = 'stripe', purpose } = req.body;

    if (!amount || amount <= 0) throw new ApiError(400, 'Invalid amount', 'INVALID_AMOUNT');

    const gatewayData = {};
    if (orderId) gatewayData.orderId = orderId;
    if (purpose) gatewayData.purpose = purpose;

    const payment = await db.payment.create({
      data: {
        userId: req.userId,
        amount: parseFloat(amount),
        method,
        status: 'pending',
        gatewayData,
      },
    });

    if (orderId) {
      await db.order.update({ where: { id: orderId }, data: { paymentId: payment.id, paymentMethod: method } });
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        clientSecret: `sandbox_${payment.id}`,
        gateway: method,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Confirm a payment succeeded (simulates the gateway redirect / confirmation page)
router.post('/complete', authenticate, async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) throw new ApiError(400, 'Payment ID is required', 'MISSING_PAYMENT_ID');

    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== req.userId) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }
    if (payment.status !== 'pending') {
      throw new ApiError(400, 'Payment is already processed', 'PAYMENT_PROCESSED');
    }

    const result = await completePayment(payment);
    await createLog({ action: 'payment.completed', userId: req.userId, details: { paymentId, result }, req });

    res.json({ success: true, message: 'Payment completed successfully', data: result });
  } catch (error) {
    next(error);
  }
});

// Get user's payments
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const payments = await db.payment.findMany({
      where: { userId: req.userId, ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.payment.count({ where: { userId: req.userId, ...(status && { status }) } });

    res.json({
      success: true,
      data: { payments, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    next(error);
  }
});

// Webhook for payment providers
router.post('/webhook', async (req, res, next) => {
  try {
    const { paymentId, event, status } = req.body;

    console.log('Payment webhook received:', event || status, paymentId);

    if (!paymentId) {
      return res.json({ received: true });
    }

    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (payment && payment.status === 'pending') {
      const result = await completePayment(payment);
      await createLog({ action: 'payment.webhook', userId: payment.userId, details: { paymentId, event, result } });
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;
