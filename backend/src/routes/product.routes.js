import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { pterodactylService } from '../services/pterodactyl.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// Get all products (public or with optional auth for coin balance)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, enabled, limit = 20, page = 1 } = req.query;

    const products = await db.product.findMany({
      where: {
        ...(category && { category }),
        ...(enabled && { enabled: enabled === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.product.count({
      where: {
        ...(category && { category }),
        ...(enabled && { enabled: enabled === 'true' }),
      },
    });

    res.json({
      success: true,
      data: {
        products,
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

// Get single product
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await db.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// Get product categories
router.get('/categories/list', async (req, res, next) => {
  try {
    const categories = [
      { id: 'minecraft', name: 'Minecraft Hosting', description: 'High-performance Minecraft servers' },
      { id: 'vps', name: 'VPS Hosting', description: 'Virtual Private Servers' },
      { id: 'game', name: 'Game Servers', description: 'Dedicated game servers' },
      { id: 'bot', name: 'Bot Hosting', description: 'Discord & Telegram bot hosting' },
      { id: 'web', name: 'Web Hosting', description: 'Website hosting solutions' },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

// Get the configurable options (software/version etc.) for a product.
// Sources options from the product's eggConfig (admin-defined) or reads them
// live from the Pterodactyl egg variable options.
router.get('/:id/config', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await db.product.findUnique({ where: { id } });
    if (!product) throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');

    const eggId = product.egg;
    const panel = await db.pterodactylPanel.findFirst({ where: { enabled: true } });
    let liveConfig = null;
    if (panel && eggId) {
      try {
        liveConfig = await pterodactylService.getEggConfig(panel.url, panel.appApiKey, eggId);
      } catch {
        liveConfig = null;
      }
    }

    // Admin-defined config takes priority and can label/lock options.
    // Shape: [{ env, label, options: [], multiple?, buildEnv?, buildMap? }]
    const adminConfig = Array.isArray(product.eggConfig) ? product.eggConfig : [];

    const data = adminConfig.length
      ? adminConfig.map((c) => ({
          env: c.env,
          label: c.label || c.env,
          options: c.options || [],
          password: !!c.password,
          placeholder: c.placeholder || '',
          buildEnv: c.buildEnv || null,
          buildMap: c.buildMap || null,
        }))
      : (liveConfig?.variables || []).map((v) => ({
          env: v.env,
          label: v.name || v.env,
          options: v.options || [],
          defaultValue: v.defaultValue,
          required: v.required,
        }));

    res.json({ success: true, data: { nestId: liveConfig?.nestId, eggId: liveConfig?.eggId, fields: data } });
  } catch (error) {
    next(error);
  }
});

export default router;