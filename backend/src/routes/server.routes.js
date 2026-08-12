import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { pterodactylService } from '../services/pterodactyl.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// Get user's servers
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const servers = await db.server.findMany({
      where: {
        userId: req.userId,
        ...(status && { status }),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.server.count({
      where: {
        userId: req.userId,
        ...(status && { status }),
        deletedAt: null,
      },
    });

    res.json({
      success: true,
      data: {
        servers,
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

// Get single server details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await db.server.findFirst({
      where: {
        id,
        userId: req.userId,
        deletedAt: null,
      },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    // Get server info from Pterodactyl if available
    let pteroInfo = null;
    if (server.pteroId && server.pteroPanelId) {
      try {
        const panel = await db.pterodactylPanel.findUnique({
          where: { id: server.pteroPanelId },
        });
        
        if (panel) {
          pteroInfo = await pterodactylService.getServerInfo(panel.url, panel.appApiKey, server.pteroId);
        }
      } catch (err) {
        console.error('Failed to fetch Pterodactyl server info:', err);
      }
    }

    res.json({
      success: true,
      data: {
        ...server,
        pteroInfo,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Start server
router.post('/:id/start', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await db.server.findFirst({
      where: {
        id,
        userId: req.userId,
        deletedAt: null,
      },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    if (server.status === 'suspended' || server.status === 'expired') {
      throw new ApiError(400, 'Server is suspended or expired', 'SERVER_SUSPENDED');
    }

    if (!server.pteroId || !server.pteroPanelId) {
      throw new ApiError(400, 'Server not connected to Pterodactyl', 'PTERO_NOT_CONFIGURED');
    }

    const panel = await db.pterodactylPanel.findUnique({
      where: { id: server.pteroPanelId },
    });

    if (!panel) {
      throw new ApiError(404, 'Pterodactyl panel not found', 'PANEL_NOT_FOUND');
    }

    await pterodactylService.sendPowerAction(
      panel.url,
      panel.appApiKey,
      server.pteroId,
      'start'
    );

    await db.server.update({
      where: { id },
      data: { status: 'running' },
    });

    res.json({
      success: true,
      message: 'Server started successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Stop server
router.post('/:id/stop', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await db.server.findFirst({
      where: {
        id,
        userId: req.userId,
        deletedAt: null,
      },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    if (!server.pteroId || !server.pteroPanelId) {
      throw new ApiError(400, 'Server not connected to Pterodactyl', 'PTERO_NOT_CONFIGURED');
    }

    const panel = await db.pterodactylPanel.findUnique({
      where: { id: server.pteroPanelId },
    });

    if (!panel) {
      throw new ApiError(404, 'Pterodactyl panel not found', 'PANEL_NOT_FOUND');
    }

    await pterodactylService.sendPowerAction(
      panel.url,
      panel.appApiKey,
      server.pteroId,
      'stop'
    );

    res.json({
      success: true,
      message: 'Server stop command sent',
    });
  } catch (error) {
    next(error);
  }
});

// Restart server
router.post('/:id/restart', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await db.server.findFirst({
      where: {
        id,
        userId: req.userId,
        deletedAt: null,
      },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    if (!server.pteroId || !server.pteroPanelId) {
      throw new ApiError(400, 'Server not connected to Pterodactyl', 'PTERO_NOT_CONFIGURED');
    }

    const panel = await db.pterodactylPanel.findUnique({
      where: { id: server.pteroPanelId },
    });

    if (!panel) {
      throw new ApiError(404, 'Pterodactyl panel not found', 'PANEL_NOT_FOUND');
    }

    await pterodactylService.sendPowerAction(
      panel.url,
      panel.appApiKey,
      server.pteroId,
      'restart'
    );

    res.json({
      success: true,
      message: 'Server restart command sent',
    });
  } catch (error) {
    next(error);
  }
});

// Change a server's primary port to another free allocation
router.post('/:id/change-port', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { allocationId } = req.body;

    const server = await db.server.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
    });
    if (!server) throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    if (!server.pteroId || !server.pteroPanelId) throw new ApiError(400, 'Server not connected to Pterodactyl', 'PTERO_NOT_CONFIGURED');

    const panel = await db.pterodactylPanel.findUnique({ where: { id: server.pteroPanelId } });
    if (!panel) throw new ApiError(404, 'Pterodactyl panel not found', 'PANEL_NOT_FOUND');

    if (!allocationId) {
      const free = await pterodactylService.getFreeAllocations(panel.url, panel.appApiKey);
      if (!free.length) throw new ApiError(400, 'No free ports available on this panel', 'NO_FREE_PORTS');
      res.json({
        success: true,
        data: free,
        message: `${free.length} free port(s) available. Send again with an allocationId to pick one.`,
      });
      return;
    }

    // Verify the target allocation is actually free before assigning it
    const freeList = await pterodactylService.getFreeAllocations(panel.url, panel.appApiKey);
    const target = freeList.find((a) => String(a.allocationId) === String(allocationId));
    if (!target) throw new ApiError(400, 'That port is not free or doesn\'t exist', 'PORT_NOT_FREE');

    // Get current primary allocation so we keep it as additional (frees the old one is wrong—
    // instead we reassign only if it's the default). Get server's current allocations.
    const current = await pterodactylService.getServerAllocations(panel.url, panel.appApiKey, server.pteroId);
    const currentDefault = current?.attributes?.default;
    const currentAdds = current?.attributes?.additional?.map((a) => a.id) || [];

    // We want to release the old default port so it becomes free again. The new
    // default is set via `default`; `additional` keeps the remaining allocations
    // (excluding both the old default and the new one).
    const keep = currentAdds.filter((cid) => String(cid) !== String(currentDefault) && String(cid) !== String(allocationId));

    await pterodactylService.setPrimaryAllocation(
      panel.url,
      panel.appApiKey,
      server.pteroId,
      Number(allocationId),
      keep
    );

    res.json({ success: true, message: `Port changed to ${target.ip}:${target.port}` });
  } catch (error) {
    next(error);
  }
});

// Renew server
router.post('/:id/renew', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const server = await db.server.findFirst({
      where: {
        id,
        userId: req.userId,
        deletedAt: null,
      },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    // Get the original product price
    if (!server.orderId) {
      throw new ApiError(400, 'No order associated with this server', 'NO_ORDER');
    }

    const order = await db.order.findUnique({
      where: { id: server.orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || order.items.length === 0) {
      throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    const product = order.items[0].product;
    const price = product.price;
    const coinPrice = product.coinPrice;

    // Check if user has enough coins (if paying with coins)
    if (paymentMethod === 'coins') {
      const currentUser = await db.user.findUnique({
        where: { id: req.userId },
      });

      if (currentUser.coins < coinPrice) {
        throw new ApiError(400, 'Insufficient SHP Coins balance', 'INSUFFICIENT_COINS');
      }

      // Deduct coins
      const updatedUser = await db.user.update({
        where: { id: req.userId },
        data: { coins: { decrement: coinPrice } },
      });

      await db.coinTransaction.create({
        data: {
          userId: req.userId,
          amount: -coinPrice,
          balance: updatedUser.coins,
          type: 'renewal',
          description: `Renewed ${server.name}`,
          referenceId: server.id,
        },
      });
    }

    // Extend expiry date based on billing cycle
    const now = new Date();
    let expiryDate = server.expiresAt || now;
    
    if (expiryDate < now) {
      expiryDate = now;
    }

    switch (product.billingCycle) {
      case 'monthly':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'quarterly':
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case 'yearly':
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      case 'lifetime':
        expiryDate.setFullYear(expiryDate.getFullYear() + 10);
        break;
    }

    await db.server.update({
      where: { id },
      data: {
        expiresAt: expiryDate,
        status: 'running',
      },
    });

    res.json({
      success: true,
      message: 'Server renewed successfully',
      data: {
        newExpiryDate: expiryDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;