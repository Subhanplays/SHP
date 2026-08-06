import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// Get user's servers
router.get('/servers', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const servers = await db.server.findMany({
      where: {
        userId: req.userId,
        ...(status && { status }),
        deletedAt: null,
      },
      include: {
        order: {
          select: {
            totalAmount: true,
            status: true,
          },
        },
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
router.get('/servers/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await db.server.findFirst({
      where: {
        id,
        userId: req.userId,
        deletedAt: null,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!server) {
      throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: server,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's orders
router.get('/orders', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const orders = await db.order.findMany({
      where: {
        userId: req.userId,
        ...(status && { status }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        servers: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.order.count({
      where: {
        userId: req.userId,
        ...(status && { status }),
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

// Get single order details
router.get('/orders/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await db.order.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        servers: true,
        invoices: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's invoices
router.get('/invoices', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const invoices = await db.invoice.findMany({
      where: {
        userId: req.userId,
        ...(status && { status }),
      },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: { dueDate: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.invoice.count({
      where: {
        userId: req.userId,
        ...(status && { status }),
      },
    });

    res.json({
      success: true,
      data: {
        invoices,
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

// Get user's coin transactions
router.get('/coins/transactions', authenticate, async (req, res, next) => {
  try {
    const { type, limit = 20, page = 1 } = req.query;

    const transactions = await db.coinTransaction.findMany({
      where: {
        userId: req.userId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.coinTransaction.count({
      where: {
        userId: req.userId,
        ...(type && { type }),
      },
    });

    res.json({
      success: true,
      data: {
        transactions,
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

// Get user's payments
router.get('/payments', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const payments = await db.payment.findMany({
      where: {
        userId: req.userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.payment.count({
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

// Get dashboard stats
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const [
      activeServers,
      expiringServers,
      pendingOrders,
      recentOrders,
      totalSpent
    ] = await Promise.all([
      db.server.count({
        where: {
          userId: req.userId,
          status: 'running',
          deletedAt: null,
        },
      }),
      db.server.count({
        where: {
          userId: req.userId,
          expiresAt: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          },
          status: 'running',
          deletedAt: null,
        },
      }),
      db.order.count({
        where: {
          userId: req.userId,
          status: 'pending',
        },
      }),
      db.order.findMany({
        where: {
          userId: req.userId,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          items: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
      }),
      db.payment.aggregate({
        where: {
          userId: req.userId,
          status: 'completed',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const user = await db.user.findUnique({
      where: { id: req.userId },
      select: { coins: true },
    });

    res.json({
      success: true,
      data: {
        activeServers,
        expiringServers,
        pendingOrders,
        recentOrders,
        totalSpent: totalSpent._sum.amount || 0,
        coinBalance: user.coins,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;