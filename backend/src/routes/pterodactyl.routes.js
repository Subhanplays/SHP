import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { pterodactylService } from '../services/pterodactyl.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

const getOwnedServer = async (id, userId) => {
  const server = await db.server.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      order: { include: { items: { include: { product: true } } } },
    },
  });
  if (!server) throw new ApiError(404, 'Server not found', 'SERVER_NOT_FOUND');
  return server;
};

const getPanel = async (server) => {
  if (!server.pteroId || !server.pteroPanelId) {
    throw new ApiError(400, 'Server not connected to Pterodactyl', 'PTERO_NOT_CONFIGURED');
  }
  const panel = await db.pterodactylPanel.findUnique({ where: { id: server.pteroPanelId } });
  if (!panel) throw new ApiError(404, 'Pterodactyl panel not found', 'PANEL_NOT_FOUND');
  return panel;
};

// Get server console access info (panel URL, server id, client API key for websocket)
router.get('/servers/:id/console', async (req, res, next) => {
  try {
    const { id } = req.params;
    const server = await getOwnedServer(id, req.userId);
    const panel = await getPanel(server);

    res.json({
      success: true,
      data: {
        panelUrl: panel.url,
        serverId: server.pteroId,
        clientApiKey: panel.clientApiKey || null,
        name: server.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get real-time resources for a server (from Pterodactyl application API)
router.get('/servers/:id/resources', async (req, res, next) => {
  try {
    const { id } = req.params;
    const server = await getOwnedServer(id, req.userId);
    const panel = await getPanel(server);

    const resources = await pterodactylService.getServerResources(panel.url, panel.appApiKey, server.pteroId);
    const attr = resources?.attributes || resources;

    res.json({
      success: true,
      data: {
        currentState: attr?.current_state,
        resources: attr?.resources,
        limits: attr?.limits,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Fetch the Pterodactyl server info (used to display status)
router.get('/servers/:id/info', async (req, res, next) => {
  try {
    const { id } = req.params;
    const server = await getOwnedServer(id, req.userId);
    const panel = await getPanel(server);

    const info = await pterodactylService.getServerState(panel.url, panel.appApiKey, server.pteroId);
    res.json({ success: true, data: info });
  } catch (error) {
    next(error);
  }
});

export default router;
