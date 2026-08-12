import { db } from '../config/database.js';
import { pterodactylService } from './pterodactyl.js';
import { sendOrderConfirmationEmail, sendServerDetailsEmail } from '../utils/email.js';
import { sendDiscordNotification } from '../utils/discord.js';
import { createLog } from '../utils/logs.js';
import { computeExpiry } from '../utils/referral.js';

const toSafeName = (name) =>
  String(name || 'server')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32);

// Provision a Pterodactyl server for a completed order.
// options: object of egg env variable -> value chosen at purchase (e.g. VERSION).
// Returns { provisioned: boolean, server, reason? }
export const provisionOrder = async (orderId, options = {}) => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: true } },
    },
  });

  if (!order) return { provisioned: false, reason: 'ORDER_NOT_FOUND' };

  // Skip if a server already exists for this order
  const existing = await db.server.findFirst({ where: { orderId } });
  if (existing) return { provisioned: true, server: existing, already: true };

  const user = order.user;
  const item = order.items?.[0];
  if (!item) return { provisioned: false, reason: 'NO_ITEMS' };
  const product = item.product;

  const panels = await db.pterodactylPanel.findMany({ where: { enabled: true } });
  if (panels.length === 0) {
    // No panel configured yet - create a pending record so admins can provision later
    const pendingServer = await db.server.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        name: `${user.username}'s ${product.name}`,
        status: 'pending',
        ram: product.ram,
        cpu: product.cpu,
        disk: product.disk,
        databases: product.databases,
        backups: product.backups,
        egg: product.egg,
        node: product.node,
        expiresAt: computeExpiry(product.billingCycle),
      },
    });
    await createLog({ action: 'provision.no_panel', userId: order.userId, details: { orderId, product: product.name } });
    return { provisioned: false, server: pendingServer, reason: 'NO_PANEL' };
  }

  const panel = panels[0];
  const errors = [];

  try {
    const panelUrl = panel.url;

    // 1. Find or create the Pterodactyl user
    let pteroUser = null;
    try {
      pteroUser = await pterodactylService.getUserByEmail(panelUrl, panel.appApiKey, user.email);
    } catch (e) {
      errors.push(`getUserByEmail: ${e.message}`);
    }
    if (!pteroUser) {
      try {
        const created = await pterodactylService.createUser(panelUrl, panel.appApiKey, {
          email: user.email,
          username: toSafeName(user.username),
          firstName: user.username,
          lastName: 'User',
        });
        pteroUser = created;
      } catch (e) {
        errors.push(`createUser: ${e.message}`);
      }
    }
    const pteroUserId = pteroUser?.id ?? pteroUser?.attributes?.id ?? pteroUser?.attributes?.attributes?.id;
    if (!pteroUserId) throw new Error(errors.join(' | ') || 'Could not resolve Pterodactyl user');

    // 3. Resolve the egg, nest and a usable allocation so Pterodactyl accepts the server request
    let dockerImage = 'ghcr.io/pterodactyl/yolks:java_17';
    let startup = 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}';
    let environment = { SERVER_JARFILE: 'server.jar', SERVER_MEMORY: product.ram || 2048 };
    let eggId = product.egg || panel.eggId || null;
    let nestId = null;
    let allocationId = product.allocation || null;
    let nodeId = panel.nodeId || product.node || null;

    // Apply the software/version/etc. options chosen at purchase. These take
    // priority over egg defaults so Pterodactyl's required vars are satisfied.
    for (const [key, value] of Object.entries(options || {})) {
      if (value !== undefined && value !== null && value !== '') {
        environment[key] = String(value);
      }
    }

    if (eggId) {
      try {
        const eggs = await pterodactylService.getEggs(panelUrl, panel.appApiKey);
        const egg = eggs?.data?.find((e) => String(e.id) === String(eggId) || String(e.attributes?.id) === String(eggId));
        if (egg) {
          const attr = egg.attributes || egg;
          nestId = attr.nest || attr.nest_id || attr.relationships?.nest?.attributes?.id || nestId;
          if (attr.docker_image) dockerImage = attr.docker_image;
          if (attr.startup) startup = attr.startup;
          const vars = attr.relationships?.variables?.data || [];
          for (const v of vars) {
            const a = v.attributes || v;
            const key = a.env_variable;
            if (!key) continue;
            // Required variables may have no default. Provide sensible fallbacks
            // so Pterodactyl's required-field validation never fails.
            if (a.default_value !== undefined && a.default_value !== null && a.default_value !== '') {
              environment[key] = a.default_value;
            } else if (a.rules && String(a.rules).includes('required')) {
              const fb = { BUILD_NUMBER: 'latest', MINECRAFT_VERSION: 'latest', VERSION: 'latest', SERVER_JARFILE: 'server.jar' }[key] || '';
              environment[key] = fb;
            }
          }
        } else {
          errors.push(`getEgg: egg ${eggId} not found - double-check the Egg ID on the panel/product`);
        }
      } catch (e) {
        errors.push(`getEgg: ${e.message}`);
      }
    }

    // Last-resort guarantee: if the egg lookup failed (e.g. API key lacks egg
    // read), still provide the known required vars so Pterodactyl accepts it.
    if (product.category === 'minecraft' || product.egg || panel.eggId) {
      if (!environment.BUILD_NUMBER) environment.BUILD_NUMBER = 'latest';
      if (!environment.MINECRAFT_VERSION) environment.MINECRAFT_VERSION = product.config?.minecraftVersion || 'latest';
      if (!environment.SERVER_JARFILE) environment.SERVER_JARFILE = 'server.jar';
    }

    // Resolve a free allocation. If none configured on the product, auto-pick
    // any free allocation from the panel and pin the node to that allocation's
    // node so Pterodactyl never rejects allocation.default.
    if (!allocationId) {
      try {
        const free = await pterodactylService.getFreeAllocations(panelUrl, panel.appApiKey);
        if (free.length > 0) {
          allocationId = free[0].allocationId;
          nodeId = free[0].nodeId;
        }
      } catch (e) {
        errors.push(`getFreeAllocations: ${e.message}`);
      }
    }

    if (!nestId) throw new Error('Missing Pterodactyl nest id for this product/panel - set a valid Egg ID on the panel (Admin → Pterodactyl) or on the product');

    // Build a candidate list of allocations to try, starting with the preferred
    // one (from the product or first free) and falling back to other free ones.
    const freeList = await pterodactylService
      .getFreeAllocations(panelUrl, panel.appApiKey)
      .catch((e) => {
        errors.push(`getFreeAllocations: ${e.message}`);
        return [];
      });

    const preferred = allocationId ? freeList.find((a) => String(a.allocationId) === String(allocationId)) || { allocationId, nodeId } : null;
    const candidates = [];
    if (preferred && !freeList.some((a) => String(a.allocationId) === String(preferred.allocationId))) {
      // preferred came from product config, keep it as a candidate even if the
      // free list is empty (permission issue) so we don't silently fail
      candidates.push(preferred);
    }
    for (const a of freeList) {
      if (!candidates.some((c) => String(c.allocationId) === String(a.allocationId))) {
        candidates.push(a);
      }
    }

    let created = null;
    let lastError = null;
    for (const cand of candidates) {
      try {
        created = await pterodactylService.createServer(panelUrl, panel.appApiKey, {
          name: toSafeName(`${user.username}-${product.name}`),
          userId: pteroUserId,
          nestId,
          eggId,
          dockerImage,
          startup,
          environment,
          memory: product.ram || 2048,
          cpu: product.cpu || 100,
          disk: product.disk || 10240,
          databases: product.databases || 0,
          backups: product.backups || 0,
          allocations: 1,
          allocationId: cand.allocationId,
        });
        nodeId = cand.nodeId || nodeId;
        break;
      } catch (e) {
        lastError = e;
        errors.push(`createServer (allocation ${cand.allocationId}): ${e.message}`);
      }
    }

    if (!created) {
      throw new Error(
        `Failed to create server on ${candidates.length} allocation(s): ${
          candidates.map((c) => c.allocationId).join(', ') || 'none'
        }. Last error: ${lastError?.message || 'unknown'}`
      );
    }

    const pteroServerId = created?.id ?? created?.attributes?.id ?? created?.attributes?.attributes?.id;
    if (!pteroServerId) throw new Error('Pterodactyl did not return a server id');

    // 4. Store the server in SHP
    const server = await db.server.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        pteroId: pteroServerId,
        pteroPanelId: panel.id,
        name: `${user.username}'s ${product.name}`,
        status: 'running',
        ram: product.ram,
        cpu: product.cpu,
        disk: product.disk,
        databases: product.databases,
        backups: product.backups,
        egg: product.egg,
        node: product.node,
        expiresAt: computeExpiry(product.billingCycle),
      },
    });

    // 5. Notifications
    await sendOrderConfirmationEmail(user, order);
    await sendServerDetailsEmail(user, server, panel);
    await sendDiscordNotification(
      'New Server Provisioned',
      `**${user.username}** ordered **${product.name}**\nServer: \`${server.name}\` (ID ${pteroServerId}) on ${panel.name}\nOrder: ${order.id}`,
      0x10b981
    );
    await db.notification.create({
      data: {
        userId: order.userId,
        title: 'Server provisioned',
        message: `Your ${product.name} server is ready.`,
        type: 'server',
        actionUrl: `/servers/${server.id}`,
      },
    });
    await createLog({ action: 'provision.success', userId: order.userId, details: { orderId, serverId: server.id, pteroId: pteroServerId } });

    return { provisioned: true, server };
  } catch (error) {
    // Mark provisioning as failed so admins can retry
    const failedServer = await db.server.findFirst({ where: { orderId } });
    if (failedServer) {
      await db.server.update({ where: { id: failedServer.id }, data: { status: 'failed' } });
    } else {
      await db.server.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          name: `${user.username}'s ${product.name}`,
          status: 'failed',
          ram: product.ram,
          cpu: product.cpu,
          disk: product.disk,
          databases: product.databases,
          backups: product.backups,
          egg: product.egg,
          node: product.node,
          expiresAt: computeExpiry(product.billingCycle),
        },
      });
    }
    await createLog({ action: 'provision.failed', userId: order.userId, details: { orderId, error: error.message, steps: errors } });
    return { provisioned: false, server: null, reason: error.message, errors };
  }
};

// Retry provisioning for a server that is pending/failed (admin action)
export const retryProvision = async (serverId) => {
  const server = await db.server.findUnique({ where: { id: serverId } });
  if (!server) return { provisioned: false, reason: 'SERVER_NOT_FOUND' };
  return provisionOrder(server.orderId);
};
