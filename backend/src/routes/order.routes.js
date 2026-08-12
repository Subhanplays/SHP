import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';
import { provisionOrder } from '../services/provision.js';
import { createLog } from '../utils/logs.js';
import { sendOrderConfirmationEmail } from '../utils/email.js';

const router = Router();

// Compute discounted amounts for a product given a coupon
const applyCoupon = (coupon, price, coinPrice) => {
  let newPrice = price;
  let newCoinPrice = coinPrice;
  if (coupon.type === 'percent') {
    const factor = Math.max(0, Math.min(100, Number(coupon.value) || 0)) / 100;
    newPrice = Math.max(0, price * (1 - factor));
    newCoinPrice = Math.max(0, Math.round(coinPrice * (1 - factor)));
  } else {
    const off = Number(coupon.value) || 0;
    newPrice = Math.max(0, price - off);
    newCoinPrice = Math.max(0, coinPrice - off);
  }
  return { newPrice, newCoinPrice };
};

// Validate a coupon code against a product
export const validateCoupon = async (code, productId, amount = 0) => {
  if (!code) return { coupon: null, discount: 0 };
  const coupon = await db.coupon.findUnique({ where: { code: String(code).toUpperCase() } });
  if (!coupon || !coupon.active) throw new ApiError(400, 'Invalid coupon code', 'INVALID_COUPON');
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new ApiError(400, 'Coupon has expired', 'COUPON_EXPIRED');
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new ApiError(400, 'Coupon usage limit reached', 'COUPON_MAXED');
  if (coupon.minPurchase && amount < coupon.minPurchase) throw new ApiError(400, `Minimum purchase of $${coupon.minPurchase} required for this coupon`, 'COUPON_MIN_PURCHASE');
  if (coupon.applicableProducts && coupon.applicableProducts.length > 0 && !coupon.applicableProducts.includes(productId)) {
    throw new ApiError(400, 'Coupon not applicable to this product', 'COUPON_NOT_APPLICABLE');
  }
  return coupon;
};

// Credit a referrer when a referred user completes their first purchase
const creditReferrer = async (order, user) => {
  if (!user.referrerId) return;
  const settings = await db.settings.findUnique({ where: { key: 'coins' } });
  const rewardEnabled = settings?.value?.enabled !== false;
  const rewardAmount = parseInt(settings?.value?.referralReward) || 500;
  if (!rewardEnabled || rewardAmount <= 0) return;

  const existingReferral = await db.referral.findFirst({
    where: { referredId: user.id, rewarded: true },
  });
  if (existingReferral) return;

  const referrer = await db.user.findUnique({ where: { id: user.referrerId } });
  if (!referrer) return;

  const newBalance = referrer.coins + rewardAmount;
  await db.user.update({ where: { id: referrer.id }, data: { coins: newBalance } });
  await db.coinTransaction.create({
    data: {
      userId: referrer.id,
      amount: rewardAmount,
      balance: newBalance,
      type: 'referral',
      description: `Referral reward for ${user.username}'s first purchase`,
      referenceId: order.id,
    },
  });

  const referral = await db.referral.findFirst({ where: { referredId: user.id } });
  if (referral) {
    await db.referral.update({ where: { id: referral.id }, data: { rewarded: true } });
  }

  await db.notification.create({
    data: {
      userId: referrer.id,
      title: 'Referral reward earned',
      message: `You earned ${rewardAmount} SHP Coins from ${user.username}'s purchase!`,
      type: 'coin',
    },
  });
};

// Finalize an order: create invoice, credit referrer, provision server
const finalizeOrder = async (orderId, options = {}) => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order) return;

  const invoice = await db.invoice.findFirst({ where: { orderId: order.id } });
  if (!invoice) {
    await db.invoice.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        amount: order.totalAmount,
        status: 'paid',
        dueDate: new Date(),
        paidAt: new Date(),
      },
    });
  }

  await creditReferrer(order, order.user);
  const result = await provisionOrder(order.id, options);
  if (!result.provisioned) {
    console.error(`[finalizeOrder] Provisioning failed for order ${orderId}: ${result.reason}`, result.errors);
  }
  return result;
};

// Create a new order
router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { productId, paymentMethod, couponCode, options } = req.body;

    if (!productId) {
      throw new ApiError(400, 'Product ID is required', 'MISSING_PRODUCT_ID');
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product || !product.enabled) {
      throw new ApiError(404, 'Product not found or disabled', 'PRODUCT_NOT_FOUND');
    }

    // Apply coupon discount
    const coupon = await validateCoupon(couponCode, product.id, product.price);
    const { newPrice, newCoinPrice } = coupon
      ? applyCoupon(coupon, product.price, product.coinPrice)
      : { newPrice: product.price, newCoinPrice: product.coinPrice };

    const user = await db.user.findUnique({ where: { id: req.userId } });

    // Check coins balance if paying with coins
    if (paymentMethod === 'coins' && user.coins < newCoinPrice) {
      throw new ApiError(400, 'Insufficient SHP Coins balance', 'INSUFFICIENT_COINS');
    }

    const isImmediate = paymentMethod === 'coins';

    const order = await db.order.create({
      data: {
        userId: req.userId,
        totalAmount: newPrice,
        coinAmount: isImmediate ? newCoinPrice : 0,
        status: isImmediate ? 'completed' : 'pending',
        paymentMethod,
        couponCode: coupon?.code || null,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            price: newPrice,
            coinPrice: newCoinPrice,
          },
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    if (coupon) {
      await db.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Deduct coins for coin payments
    if (isImmediate) {
      const updatedUser = await db.user.update({
        where: { id: req.userId },
        data: { coins: { decrement: newCoinPrice } },
      });
      await db.coinTransaction.create({
        data: {
          userId: req.userId,
          amount: -newCoinPrice,
          balance: updatedUser.coins,
          type: 'purchase',
          description: `Purchased ${product.name}`,
          referenceId: order.id,
        },
      });
    }

    await createLog({
      action: isImmediate ? 'order.completed' : 'order.created',
      userId: req.userId,
      details: { orderId: order.id, product: product.name, method: paymentMethod },
      req,
    });

    if (isImmediate) {
      let provisionResult = { provisioned: false, reason: 'not_run' };
      try {
        provisionResult = await finalizeOrder(order.id, options || {});
      } catch (err) {
        console.error(`[order.create] finalizeOrder failed: ${err.message}`);
        provisionResult = { provisioned: false, reason: err.message, errors: [err.message] };
      }
      return res.json({
        success: true,
        message: provisionResult.provisioned
          ? 'Order completed. Your server is being provisioned.'
          : 'Order completed but server provisioning failed. An admin has been notified.',
        data: order,
        provisionResult: provisionResult,
      });
    }

    res.json({
      success: true,
      message: 'Order created. Please complete payment.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's orders
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const orders = await db.order.findMany({
      where: {
        userId: req.userId,
        ...(status && { status }),
      },
      include: {
        items: { include: { product: true } },
        servers: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.order.count({ where: { userId: req.userId, ...(status && { status }) } });

    res.json({
      success: true,
      data: { orders, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } },
    });
  } catch (error) {
    next(error);
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await db.order.findFirst({
      where: { id, userId: req.userId },
      include: { items: { include: { product: true } }, servers: true, invoices: true, payments: true },
    });

    if (!order) throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// Cancel pending order
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await db.order.findFirst({ where: { id, userId: req.userId, status: 'pending' } });
    if (!order) throw new ApiError(404, 'Order not found or cannot be cancelled', 'ORDER_NOT_FOUND');

    await db.order.update({ where: { id }, data: { status: 'cancelled' } });
    await createLog({ action: 'order.cancelled', userId: req.userId, details: { orderId: id }, req });

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    next(error);
  }
});

// Repay a pending order via a payment method (used to resume a pending money order)
router.post('/:id/pay', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const order = await db.order.findFirst({ where: { id, userId: req.userId, status: 'pending' } });
    if (!order) throw new ApiError(404, 'Order not found or already paid', 'ORDER_NOT_FOUND');

    await db.order.update({ where: { id }, data: { paymentMethod } });

    res.json({ success: true, message: 'Payment method updated. Proceed to checkout.', data: order });
  } catch (error) {
    next(error);
  }
});

export { finalizeOrder };
export default router;
