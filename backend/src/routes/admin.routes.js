import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { pterodactylService } from '../services/pterodactyl.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Dashboard stats
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalRevenue,
      totalCoinsCreated,
      totalCoinsSpent,
      totalServers,
      totalOrders,
      activeServers,
      suspendedServers,
    ] = await Promise.all([
      db.user.count(),
      db.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
      db.coinTransaction.aggregate({
        where: { amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      db.coinTransaction.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      db.server.count(),
      db.order.count(),
      db.server.count({ where: { status: 'running', deletedAt: null } }),
      db.server.count({ where: { status: 'suspended' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalCoinsCreated: totalCoinsCreated._sum.amount || 0,
        totalCoinsSpent: Math.abs(totalCoinsSpent._sum.amount || 0),
        totalServers,
        totalOrders,
        activeServers,
        suspendedServers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Users management
router.get('/users', async (req, res, next) => {
  try {
    const { search, role, limit = 20, page = 1 } = req.query;

    const users = await db.user.findMany({
      where: {
        ...(search && {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(role && { role }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        discordId: true,
        role: true,
        coins: true,
        createdAt: true,
        _count: {
          select: {
            servers: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.user.count({
      where: {
        ...(search && {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(role && { role }),
      },
    });

    res.json({
      success: true,
      data: {
        users,
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

// Get single user
router.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        servers: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        coinTransactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const { password, ...safeUser } = user;

    res.json({
      success: true,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, role, coins } = req.body;

    const user = await db.user.update({
      where: { id },
      data: {
        ...(username && { username }),
        ...(role && { role }),
      },
    });

    // If coins provided, adjust balance
    if (coins !== undefined) {
      const currentUser = await db.user.findUnique({ where: { id } });
      const diff = coins - currentUser.coins;

      if (diff !== 0) {
        await db.user.update({
          where: { id },
          data: { coins },
        });

        await db.coinTransaction.create({
          data: {
            userId: id,
            amount: diff,
            balance: coins,
            type: 'admin',
            description: diff > 0 ? `Admin added ${diff} coins` : `Admin removed ${Math.abs(diff)} coins`,
          },
        });
      }
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Give/remove coins
router.post('/users/:id/coins', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, reason, type = 'admin' } = req.body;

    if (!amount || amount === 0) {
      throw new ApiError(400, 'Amount is required', 'MISSING_AMOUNT');
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const newBalance = user.coins + amount;

    if (newBalance < 0) {
      throw new ApiError(400, 'Cannot reduce coins below zero', 'INSUFFICIENT_COINS');
    }

    await db.user.update({
      where: { id },
      data: { coins: newBalance },
    });

    await db.coinTransaction.create({
      data: {
        userId: id,
        amount,
        balance: newBalance,
        type,
        description: reason || 'Admin action',
      },
    });

    res.json({
      success: true,
      message: `Successfully ${amount > 0 ? 'added' : 'removed'} ${Math.abs(amount)} coins`,
      data: {
        newBalance,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Products management
router.get('/products', async (req, res, next) => {
  try {
    const { category, enabled, limit = 50, page = 1 } = req.query;

    const products = await db.product.findMany({
      where: {
        ...(category && { category }),
        ...(enabled !== undefined && { enabled: enabled === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.product.count({
      where: {
        ...(category && { category }),
        ...(enabled !== undefined && { enabled: enabled === 'true' }),
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

// Create product
router.post('/products', async (req, res, next) => {
  try {
    const productData = req.body;

    const product = await db.product.create({
      data: productData,
    });

    res.json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    const product = await db.product.update({
      where: { id },
      data: productData,
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

// Delete product
router.delete('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.product.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Orders management
router.get('/orders', async (req, res, next) => {
  try {
    const { status, paymentMethod, limit = 20, page = 1 } = req.query;

    const orders = await db.order.findMany({
      where: {
        ...(status && { status }),
        ...(paymentMethod && { paymentMethod }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        servers: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.order.count({
      where: {
        ...(status && { status }),
        ...(paymentMethod && { paymentMethod }),
      },
    });

    res.json({
      success: true,
      data: {
        orders,
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

// Servers management
router.get('/servers', async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const servers = await db.server.findMany({
      where: {
        ...(status && { status }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.server.count({
      where: {
        ...(status && { status }),
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

// Suspend server
router.post('/servers/:id/suspend', async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await db.server.findUnique({
      where: { id },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    // Suspend on Pterodactyl
    if (server.pteroId && server.pteroPanelId) {
      const panel = await db.pterodactylPanel.findUnique({
        where: { id: server.pteroPanelId },
      });

      if (panel) {
        await pterodactylService.suspendServer(panel.url, panel.appApiKey, server.pteroId);
      }
    }

    await db.server.update({
      where: { id },
      data: {
        status: 'suspended',
        suspendedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Server suspended successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Unsuspend server
router.post('/servers/:id/unsuspend', async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await db.server.findUnique({
      where: { id },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    // Unsuspend on Pterodactyl
    if (server.pteroId && server.pteroPanelId) {
      const panel = await db.pterodactylPanel.findUnique({
        where: { id: server.pteroPanelId },
      });

      if (panel) {
        await pterodactylService.unsuspendServer(panel.url, panel.appApiKey, server.pteroId);
      }
    }

    await db.server.update({
      where: { id },
      data: {
        status: 'running',
        suspendedAt: null,
      },
    });

    res.json({
      success: true,
      message: 'Server unsuspended successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Delete server
router.delete('/servers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await db.server.findUnique({
      where: { id },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    // Delete from Pterodactyl
    if (server.pteroId && server.pteroPanelId) {
      const panel = await db.pterodactylPanel.findUnique({
        where: { id: server.pteroPanelId },
      });

      if (panel) {
        await pterodactylService.deleteServer(panel.url, panel.appApiKey, server.pteroId);
      }
    }

    await db.server.update({
      where: { id },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Server deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Retry provisioning for a pending/failed server
router.post('/servers/:id/provision', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { retryProvision } = await import('../services/provision.js');
    const result = await retryProvision(id);

    if (!result.provisioned) {
      throw new ApiError(400, `Provisioning failed: ${result.reason || 'Unknown error'}`, 'PROVISION_FAILED');
    }

    res.json({
      success: true,
      message: 'Server provisioned successfully',
      data: result.server,
    });
  } catch (error) {
    next(error);
  }
});

// All coin transactions (for coin management / history)
router.get('/coins/transactions', async (req, res, next) => {
  try {
    const { search, type, limit = 50, page = 1 } = req.query;

    let where = {};
    if (type) where.type = type;

    const transactions = await db.coinTransaction.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    // Apply in-memory search filter
    let filtered = transactions;
    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter(
        (t) => t.user?.username?.toLowerCase().includes(s) || t.user?.email?.toLowerCase().includes(s) || String(t.description || '').toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data: {
        transactions: filtered,
        pagination: { total: filtered.length, page: parseInt(page), limit: parseInt(limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Activity logs
router.get('/logs', async (req, res, next) => {
  try {
    const { action, userId, limit = 50, page = 1 } = req.query;

    const logs = await db.log.findMany({
      where: {
        ...(action && { action }),
        ...(userId && { userId }),
      },
      include: {
        user: { select: { id: true, username: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.log.count({ where: { ...(action && { action }), ...(userId && { userId }) } });

    res.json({
      success: true,
      data: {
        logs,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Pterodactyl panels management
router.get('/pterodactyl', async (req, res, next) => {
  try {
    const panels = await db.pterodactylPanel.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        enabled: true,
        lastChecked: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            servers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: panels,
    });
  } catch (error) {
    next(error);
  }
});

// Add Pterodactyl panel
router.post('/pterodactyl', async (req, res, next) => {
  try {
    const { name, url, appApiKey, clientApiKey, nodeId, eggId, locationId, enabled } = req.body;

    // Test connection first
    const testUrl = pterodactylService.normalizeUrl(url);
    const testResult = await pterodactylService.testConnection(testUrl, appApiKey);
    
    if (!testResult.success) {
      throw new ApiError(400, `Cannot connect to panel: ${testResult.error}`, 'CONNECTION_FAILED');
    }

    const panel = await db.pterodactylPanel.create({
      data: {
        name,
        url: testUrl,
        appApiKey,
        clientApiKey,
        nodeId,
        eggId,
        locationId,
        enabled: enabled !== false,
        lastChecked: new Date(),
        status: 'online',
      },
    });

    res.json({
      success: true,
      message: 'Pterodactyl panel added successfully',
      data: panel,
    });
  } catch (error) {
    next(error);
  }
});

// Delete Pterodactyl panel
router.delete('/pterodactyl/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.pterodactylPanel.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Panel deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Test a Pterodactyl connection (without saving)
router.post('/pterodactyl/test', async (req, res, next) => {
  try {
    const { url, appApiKey } = req.body;
    if (!url || !appApiKey) {
      throw new ApiError(400, 'Panel URL and Application API Key are required', 'MISSING_FIELDS');
    }

    const result = await pterodactylService.testConnection(url, appApiKey);

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Connection successful' : `Connection failed: ${result.error}`,
    });
  } catch (error) {
    next(error);
  }
});

// List free allocations across all panels (for the product form / port picker)
router.get('/pterodactyl/allocations', async (req, res, next) => {
  try {
    const panels = await db.pterodactylPanel.findMany({ where: { enabled: true } });
    const result = [];
    for (const panel of panels) {
      try {
        const free = await pterodactylService.getFreeAllocations(panel.url, panel.appApiKey);
        result.push({
          panelId: panel.id,
          panelName: panel.name,
          panelUrl: panel.url,
          count: free.length,
          allocations: free,
        });
      } catch (e) {
        result.push({ panelId: panel.id, panelName: panel.name, count: 0, allocations: [], error: e.message });
      }
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Update Pterodactyl panel
router.put('/pterodactyl/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, url, appApiKey, clientApiKey, nodeId, eggId, locationId, enabled } = req.body;

    const panel = await db.pterodactylPanel.findUnique({ where: { id } });
    if (!panel) throw new ApiError(404, 'Panel not found', 'PANEL_NOT_FOUND');

    const data = {};
    if (name !== undefined) data.name = name;
    if (url !== undefined) data.url = url;
    if (appApiKey) data.appApiKey = appApiKey;
    if (clientApiKey) data.clientApiKey = clientApiKey;
    if (nodeId !== undefined) data.nodeId = nodeId;
    if (eggId !== undefined) data.eggId = eggId;
    if (locationId !== undefined) data.locationId = locationId;
    if (enabled !== undefined) data.enabled = enabled === true || enabled === 'true';

    // Re-test connection if keys/url changed
    if (data.url || data.appApiKey) {
      if (data.url) data.url = pterodactylService.normalizeUrl(data.url);
      const testUrl = data.url || panel.url;
      const testKey = data.appApiKey || panel.appApiKey;
      const test = await pterodactylService.testConnection(testUrl, testKey);
      data.status = test.success ? 'online' : 'offline';
      data.lastChecked = new Date();
    }

    const updated = await db.pterodactylPanel.update({ where: { id }, data });

    res.json({
      success: true,
      message: 'Panel updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;