import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// Create a new order
router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { productId, paymentMethod, couponCode } = req.body;

    if (!productId) {
      throw new ApiError(400, 'Product ID is required', 'MISSING_PRODUCT_ID');
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.enabled) {
      throw new ApiError(404, 'Product not found or disabled', 'PRODUCT_NOT_FOUND');
    }

    // Check if user has enough coins (if paying with coins)
    if (paymentMethod === 'coins') {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (user.coins < product.coinPrice) {
        throw new ApiError(400, 'Insufficient SHP Coins balance', 'INSUFFICIENT_COINS');
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: req.userId,
        totalAmount: product.price,
        coinAmount: paymentMethod === 'coins' ? product.coinPrice : 0,
        status: paymentMethod === 'coins' ? 'completed' : 'pending',
        paymentMethod,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            price: product.price,
            coinPrice: product.coinPrice,
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // If paid with coins, deduct coins
    if (paymentMethod === 'coins') {
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { coins: { decrement: product.coinPrice } },
      });

      await prisma.coinTransaction.create({
        data: {
          userId: req.userId,
          amount: -product.coinPrice,
          balance: user.coins,
          type: 'purchase',
          description: `Purchased ${product.name}`,
          referenceId: order.id,
        },
      });
    }

    // TODO: If order is completed, create server automatically
    if (order.status === 'completed') {
      // Server creation will be handled by a separate service
      res.json({
        success: true,
        message: 'Order created successfully. Server is being provisioned.',
        data: order,
      });
    } else {
      res.json({
        success: true,
        message: 'Order created. Please complete payment.',
        data: order,
      });
    }
  } catch (error) {
    next(error);
  }
});

// Get user's orders (also in user.routes.js, but this is for order-specific operations)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const orders = await prisma.order.findMany({
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

    const total = await prisma.order.count({
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

// Get single order
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
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

// Cancel pending order
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: req.userId,
        status: 'pending',
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found or cannot be cancelled', 'ORDER_NOT_FOUND');
    }

    await prisma.order.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;