import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { pterodactylService } from '../services/pterodactyl.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's server console access info
router.get('/servers/:id/console', async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await prisma.server.findFirst({
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

    const panel = await prisma.pterodactylPanel.findUnique({
      where: { id: server.pteroPanelId },
    });

    if (!panel) {
      throw new ApiError(404, 'Pterodactyl panel not found', 'PANEL_NOT_FOUND');
    }

    // In a real implementation, you would generate a temporary token for the Pterodactyl client API
    // This is a simplified version
    res.json({
      success: true,
      data: {
        panelUrl: panel.url,
        serverId: server.pteroId,
        // In production, you'd provide a proper client token
        // For now, just indicate the server is accessible
        accessible: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;