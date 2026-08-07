import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';
import { validateCoupon } from './order.routes.js';
import { createLog } from '../utils/logs.js';

const router = Router();

// Public: validate a coupon code against a product
router.get('/validate', async (req, res, next) => {
  try {
    const { code, productId, amount } = req.query;
    if (!code) throw new ApiError(400, 'Coupon code is required', 'MISSING_CODE');

    const coupon = await validateCoupon(code, productId, parseFloat(amount) || 0);
    res.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Public: list active coupons (lightweight)
router.get('/', async (req, res, next) => {
  try {
    const coupons = await db.coupon.findMany({
      where: { active: true },
      select: { code: true, type: true, value: true, minPurchase: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
});

// ---- Admin CRUD ----
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
});

router.post('/admin', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { code, type, value, maxUses, expiresAt, minPurchase, applicableProducts, active } = req.body;

    if (!code || !type || value === undefined) {
      throw new ApiError(400, 'Code, type and value are required', 'MISSING_FIELDS');
    }

    const upperCode = String(code).toUpperCase();
    const existing = await db.coupon.findUnique({ where: { code: upperCode } });
    if (existing) throw new ApiError(400, 'Coupon code already exists', 'COUPON_EXISTS');

    const coupon = await db.coupon.create({
      data: {
        code: upperCode,
        type,
        value,
        maxUses: maxUses || null,
        minPurchase: minPurchase || 0,
        expiresAt: expiresAt || null,
        applicableProducts: applicableProducts || [],
        active: active !== false,
      },
    });
    await createLog({ action: 'coupon.created', userId: req.userId, details: { code: upperCode }, req });

    res.json({ success: true, message: 'Coupon created', data: coupon });
  } catch (error) {
    next(error);
  }
});

router.put('/admin/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.code) data.code = String(data.code).toUpperCase();

    const coupon = await db.coupon.update({ where: { id }, data });
    await createLog({ action: 'coupon.updated', userId: req.userId, details: { id }, req });

    res.json({ success: true, message: 'Coupon updated', data: coupon });
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.coupon.delete({ where: { id } });
    await createLog({ action: 'coupon.deleted', userId: req.userId, details: { id }, req });

    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
