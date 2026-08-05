import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// Get all settings (public for branding, admin for others)
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;

    const settings = await prisma.settings.findMany({
      where: {
        ...(category && { category }),
      },
    });

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({
      success: true,
      data: settingsObj,
    });
  } catch (error) {
    next(error);
  }
});

// Get single setting
router.get('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;

    const setting = await prisma.settings.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: setting.value,
    });
  } catch (error) {
    next(error);
  }
});

// Update setting (admin only)
router.put('/:key', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, category } = req.body;

    const setting = await prisma.settings.upsert({
      where: { key },
      update: {
        value,
        ...(category && { category }),
      },
      create: {
        key,
        value,
        category,
      },
    });

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
});

// Update multiple settings
router.patch('/bulk', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const updates = req.body; // Array of { key, value, category }

    const results = await Promise.all(
      updates.map(async (update) => {
        return prisma.settings.upsert({
          where: { key: update.key },
          update: {
            value: update.value,
            ...(update.category && { category: update.category }),
          },
          create: {
            key: update.key,
            value: update.value,
            category: update.category,
          },
        });
      })
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;