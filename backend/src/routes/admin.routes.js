import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
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
      prisma.user.count(),
      prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.coinTransaction.aggregate({
        where: { amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      prisma.coinTransaction.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      prisma.server.count(),
      prisma.order.count(),
      prisma.server.count({ where: { status: 'running', deletedAt: null } }),
      prisma.server.count({ where: { status: 'suspended' } }),
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

    const users = await prisma.user.findMany({
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
        firebaseUid: true,
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

    const total = await prisma.user.count({
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

    const user = await prisma.user.findUnique({
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

    res.json({
      success: true,
      data: user,
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

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(username && { username }),
        ...(role && { role }),
      },
    });

    // If coins provided, adjust balance
    if (coins !== undefined) {
      const currentUser = await prisma.user.findUnique({ where: { id } });
      const diff = coins - currentUser.coins;

      if (diff !== 0) {
        await prisma.user.update({
          where: { id },
          data: { coins },
        });

        await prisma.coinTransaction.create({
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

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const newBalance = user.coins + amount;

    if (newBalance < 0) {
      throw new ApiError(400, 'Cannot reduce coins below zero', 'INSUFFICIENT_COINS');
    }

    await prisma.user.update({
      where: { id },
      data: { coins: newBalance },
    });

    await prisma.coinTransaction.create({
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

    const products = await prisma.product.findMany({
      where: {
        ...(category && { category }),
        ...(enabled !== undefined && { enabled: enabled === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await prisma.product.count({
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

    const product = await prisma.product.create({
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

    const product = await prisma.product.update({
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

    await prisma.product.delete({
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

    const orders = await prisma.order.findMany({
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

    const total = await prisma.order.count({
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

    const servers = await prisma.server.findMany({
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

    const total = await prisma.server.count({
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

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    // Suspend on Pterodactyl
    if (server.pteroId && server.pteroPanelId) {
      const panel = await prisma.pterodactylPanel.findUnique({
        where: { id: server.pteroPanelId },
      });

      if (panel) {
        await pterodactylService.suspendServer(panel.url, panel.appApiKey, server.pteroId);
      }
    }

    await prisma.server.update({
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

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    // Unsuspend on Pterodactyl
    if (server.pteroId && server.pteroPanelId) {
      const panel = await prisma.pterodactylPanel.findUnique({
        where: { id: server.pteroPanelId },
      });

      if (panel) {
        await pterodactylService.unsuspendServer(panel.url, panel.appApiKey, server.pteroId);
      }
    }

    await prisma.server.update({
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

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    // Delete from Pterodactyl
    if (server.pteroId && server.pteroPanelId) {
      const panel = await prisma.pterodactylPanel.findUnique({
        where: { id: server.pteroPanelId },
      });

      if (panel) {
        await pterodactylService.deleteServer(panel.url, panel.appApiKey, server.pteroId);
      }
    }

    await prisma.server.update({
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

// Pterodactyl panels management
router.get('/pterodactyl', async (req, res, next) => {
  try {
    const panels = await prisma.pterodactylPanel.findMany({
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
    const { name, url, appApiKey, clientApiKey, nodeId, eggId, locationId } = req.body;

    // Test connection first
    const testResult = await pterodactylService.testConnection(url, appApiKey);
    
    if (!testResult.success) {
      throw new ApiError(400, `Cannot connect to panel: ${testResult.error}`, 'CONNECTION_FAILED');
    }

    const panel = await prisma.pterodactylPanel.create({
      data: {
        name,
        url,
        appApiKey,
        clientApiKey,
        nodeId,
        eggId,
        locationId,
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

    await prisma.pterodactylPanel.delete({
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

export default router;