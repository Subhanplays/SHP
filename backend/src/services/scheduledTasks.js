import { db } from '../config/database.js';
import { pterodactylService } from './pterodactyl.js';
import { sendEmail } from '../utils/email.js';
import { sendDiscordWebhook } from '../utils/discord.js';

// Run every minute
export const startScheduledTasks = () => {
  console.log('🕐 Starting scheduled tasks...');

  // Check expired servers every hour
  setInterval(checkExpiredServers, 60 * 60 * 1000);

  // Send expiry reminders every 6 hours
  setInterval(sendExpiryReminders, 6 * 60 * 60 * 1000);

  // Initial run
  setTimeout(checkExpiredServers, 5000);
  setTimeout(sendExpiryReminders, 10000);
};

// Check and handle expired servers
async function checkExpiredServers() {
  try {
    console.log('🔍 Checking for expired servers...');

    const now = new Date();

    // Get settings for grace period
    const gracePeriodSetting = await db.settings.findUnique({
      where: { key: 'grace_period_days' },
    });
    const gracePeriodDays = gracePeriodSetting?.value?.days || 7;

    // Find servers that expired more than grace period ago
    const gracePeriodAgo = new Date(now.getTime() - gracePeriodDays * 24 * 60 * 60 * 1000);

    const serversToDelete = await db.server.findMany({
      where: {
        expiresAt: {
          lt: gracePeriodAgo,
        },
        status: {
          in: ['running', 'suspended'],
        },
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    for (const server of serversToDelete) {
      try {
        // Delete from Pterodactyl
        if (server.pteroId && server.pteroPanelId) {
          const panel = await db.pterodactylPanel.findUnique({
            where: { id: server.pteroPanelId },
          });

          if (panel) {
            await pterodactylService.deleteServer(panel.url, panel.appApiKey, server.pteroId);
          }
        }

        // Mark as deleted
        await db.server.update({
          where: { id: server.id },
          data: {
            status: 'deleted',
            deletedAt: new Date(),
          },
        });

        // Notify user
        await sendEmail({
          to: server.user.email,
          subject: 'Server Deleted - Grace Period Expired',
          text: `Your server "${server.name}" has been deleted after the grace period expired.`,
        });

        console.log(`🗑️ Deleted expired server: ${server.id}`);
      } catch (error) {
        console.error(`Error deleting server ${server.id}:`, error);
      }
    }

    // Find servers that just expired (within the last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const serversToSuspend = await db.server.findMany({
      where: {
        expiresAt: {
          lt: now,
          gte: oneHourAgo,
        },
        status: 'running',
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    for (const server of serversToSuspend) {
      try {
        // Suspend on Pterodactyl
        if (server.pteroId && server.pteroPanelId) {
          const panel = await db.pterodactylPanel.findUnique({
            where: { id: server.pteroPanelId },
          });

          if (panel) {
            await pterodactylService.suspendServer(panel.url, panel.appApiKey, server.pteroId);
          }
        }

        // Update status
        await db.server.update({
          where: { id: server.id },
          data: {
            status: 'suspended',
            suspendedAt: new Date(),
          },
        });

        // Notify user
        await sendEmail({
          to: server.user.email,
          subject: 'Server Suspended - Expired',
          text: `Your server "${server.name}" has been suspended because it expired. Please renew to continue using it.`,
        });

        // Create notification
        await db.notification.create({
          data: {
            userId: server.userId,
            title: 'Server Suspended',
            message: `Your server "${server.name}" has been suspended due to expiration.`,
            type: 'server',
            actionUrl: `/servers/${server.id}`,
          },
        });

        console.log(`⏸️ Suspended expired server: ${server.id}`);
      } catch (error) {
        console.error(`Error suspending server ${server.id}:`, error);
      }
    }

    console.log(`✅ Expired server check complete. Deleted: ${serversToDelete.length}, Suspended: ${serversToSuspend.length}`);
  } catch (error) {
    console.error('Error in checkExpiredServers:', error);
  }
}

// Send expiry reminders
async function sendExpiryReminders() {
  try {
    console.log('🔔 Sending expiry reminders...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find servers expiring in the next week
    const expiringServers = await db.server.findMany({
      where: {
        expiresAt: {
          gte: now,
          lte: nextWeek,
        },
        status: 'running',
        deletedAt: null,
      },
      include: {
        user: true,
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

    let reminderCount = 0;

    for (const server of expiringServers) {
      const daysUntilExpiry = Math.ceil((server.expiresAt - now) / (24 * 60 * 60 * 1000));

      // Send reminder based on days until expiry
      if (daysUntilExpiry <= 1 || daysUntilExpiry === 3 || daysUntilExpiry === 7) {
        try {
          const productName = server.order?.items?.[0]?.product?.name || 'Server';

          await sendEmail({
            to: server.user.email,
            subject: `Server Expiring in ${daysUntilExpiry} Day${daysUntilExpiry > 1 ? 's' : ''}`,
            text: `Your ${productName} "${server.name}" will expire in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}. Renew now to avoid interruption.`,
          });

          // Create notification
          await db.notification.create({
            data: {
              userId: server.userId,
              title: `Server Expiring Soon`,
              message: `Your server "${server.name}" will expire in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}.`,
              type: 'server',
              actionUrl: `/servers/${server.id}`,
            },
          });

          reminderCount++;
        } catch (error) {
          console.error(`Error sending reminder for server ${server.id}:`, error);
        }
      }
    }

    console.log(`✅ Sent ${reminderCount} expiry reminders`);
  } catch (error) {
    console.error('Error in sendExpiryReminders:', error);
  }
}