import axios from 'axios';

export const sendDiscordWebhook = async ({ webhookUrl, content, embeds = [] }) => {
  try {
    const url = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
    
    if (!url) {
      console.log('Discord webhook not configured');
      return;
    }

    await axios.post(url, {
      content,
      embeds,
    });

    console.log('📬 Discord webhook sent');
  } catch (error) {
    console.error('Discord webhook error:', error.message);
  }
};

export const sendDiscordNotification = async (title, description, color = 0x00ff00) => {
  await sendDiscordWebhook({
    embeds: [{
      title,
      description,
      color,
      timestamp: new Date().toISOString(),
    }],
  });
};

export const sendDiscordUserNotification = async (userId, message) => {
  // This would require a Discord bot, not just webhooks
  // For now, just log it
  console.log(`Discord DM to ${userId}: ${message}`);
};