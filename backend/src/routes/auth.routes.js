import { Router } from 'express';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import querystring from 'querystring';
import { authenticate } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';
import { signToken, signPasswordResetToken, verifyToken } from '../utils/jwt.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email.js';
import { generateReferralCode } from '../utils/referral.js';
import { createLog } from '../utils/logs.js';

const router = Router();

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};

const REDIRECT = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/social`;

// Give signup reward to a new user (respects settings)
const grantSignupReward = async (userId) => {
  const settings = await db.settings.findUnique({ where: { key: 'coins' } });
  const rewardEnabled = settings?.value?.enabled !== false;
  const rewardAmount = parseInt(settings?.value?.signupReward) || 1000;
  if (rewardEnabled && rewardAmount > 0) {
    await db.user.update({ where: { id: userId }, data: { coins: rewardAmount } });
    await db.coinTransaction.create({
      data: {
        userId,
        amount: rewardAmount,
        balance: rewardAmount,
        type: 'signup',
        description: 'Signup reward',
      },
    });
  }
};

// Register a new account
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, referralCode } = req.body;

    if (!username || !email || !password) {
      throw new ApiError(400, 'Username, email and password are required', 'MISSING_FIELDS');
    }
    if (String(password).length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters', 'WEAK_PASSWORD');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      throw new ApiError(400, 'Invalid email address', 'INVALID_EMAIL');
    }

    const lowerEmail = String(email).toLowerCase();
    const existing = await db.user.findUnique({ where: { email: lowerEmail } });
    if (existing) {
      throw new ApiError(400, 'An account with this email already exists', 'EMAIL_TAKEN');
    }

    // Resolve referrer
    let referrerId = null;
    if (referralCode) {
      const referrer = await db.user.findUnique({ where: { referralCode: String(referralCode).trim() } });
      if (referrer && referrer.id) referrerId = referrer.id;
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await db.user.create({
      data: {
        username: String(username),
        email: lowerEmail,
        password: hashedPassword,
        role: 'user',
        coins: 0,
        referralCode: generateReferralCode(username),
        ...(referrerId ? { referrerId } : {}),
      },
    });

    if (referrerId) {
      await db.referral.create({ data: { referrerId, referredId: user.id, rewarded: false } });
    }

    await grantSignupReward(user.id);
    const updatedUser = await db.user.findUnique({ where: { id: user.id } });

    const token = signToken(updatedUser);
    await sendWelcomeEmail(updatedUser);
    await createLog({ action: 'auth.register', userId: user.id, details: { referralCode }, req });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { token, user: sanitizeUser(updatedUser) },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required', 'MISSING_FIELDS');
    }

    const user = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(String(password), user.password || '');
    if (!valid) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const token = signToken(user);
    await createLog({ action: 'auth.login', userId: user.id, req });

    res.json({ success: true, data: { token, user: sanitizeUser(user) } });
  } catch (error) {
    next(error);
  }
});

// Forgot password (sends a reset link by email)
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, 'Email is required', 'MISSING_EMAIL');
    }

    const user = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });

    if (user) {
      const resetToken = signPasswordResetToken(user.id);
      await sendPasswordResetEmail(user.email, resetToken);
    }

    res.json({
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
});

// Reset password with a reset token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new ApiError(400, 'Token and new password are required', 'MISSING_FIELDS');
    }
    if (String(password).length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters', 'WEAK_PASSWORD');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      throw new ApiError(400, 'Invalid or expired reset token', 'INVALID_TOKEN');
    }

    if (decoded.type !== 'password_reset' || !decoded.id) {
      throw new ApiError(400, 'Invalid or expired reset token', 'INVALID_TOKEN');
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    await db.user.update({ where: { id: decoded.id }, data: { password: hashedPassword } });
    await createLog({ action: 'auth.password_reset', userId: decoded.id, req });

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.userId },
      include: {
        _count: { select: { servers: true, orders: true } },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        discordId: user.discordId,
        referralCode: user.referralCode,
        role: user.role,
        coins: user.coins,
        createdAt: user.createdAt,
        serversCount: user._count.servers,
        ordersCount: user._count.orders,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { username, avatar } = req.body;

    const updatedUser = await db.user.update({
      where: { id: req.userId },
      data: {
        ...(username && { username }),
        ...(avatar !== undefined && { avatar }),
      },
    });
    await createLog({ action: 'auth.profile_update', userId: req.userId, details: { username }, req });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Link Discord account
router.post('/link-discord', authenticate, async (req, res, next) => {
  try {
    const { discordId, discordAvatar } = req.body;

    if (!discordId) {
      throw new ApiError(400, 'Discord ID is required', 'MISSING_DISCORD_ID');
    }

    const updatedUser = await db.user.update({
      where: { id: req.userId },
      data: {
        discordId,
        ...(discordAvatar && { avatar: discordAvatar }),
      },
    });
    await createLog({ action: 'auth.discord_link', userId: req.userId, req });

    res.json({
      success: true,
      message: 'Discord account linked successfully',
      data: { discordId: updatedUser.discordId },
    });
  } catch (error) {
    next(error);
  }
});

// Unlink Discord account
router.delete('/unlink-discord', authenticate, async (req, res, next) => {
  try {
    await db.user.update({ where: { id: req.userId }, data: { discordId: null } });
    res.json({ success: true, message: 'Discord account unlinked successfully' });
  } catch (error) {
    next(error);
  }
});

// ---------- OAuth: Google ----------
const getGoogleOAuthUrl = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/google/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
};

router.get('/google/url', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(400).json({ success: false, message: 'Google OAuth is not configured' });
  }
  res.json({ success: true, data: { url: getGoogleOAuthUrl() } });
});

router.get('/google/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) throw new ApiError(400, 'No authorization code provided', 'NO_CODE');

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new ApiError(500, 'Google OAuth is not configured', 'OAUTH_NOT_CONFIGURED');
    }

    const redirectUri = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/google/callback`;

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token } = tokenRes.data;
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileRes.data;

    const email = String(profile.email || '').toLowerCase();
    let user = email ? await db.user.findUnique({ where: { email } }) : null;

    if (!user) {
      user = await db.user.create({
        data: {
          username: profile.name || profile.email?.split('@')[0] || 'user',
          email,
          avatar: profile.picture || null,
          password: null,
          role: 'user',
          coins: 0,
          referralCode: generateReferralCode(profile.name),
        },
      });
      await grantSignupReward(user.id);
      user = await db.user.findUnique({ where: { id: user.id } });
    } else if (profile.picture && !user.avatar) {
      await db.user.update({ where: { id: user.id }, data: { avatar: profile.picture } });
    }

    const token = signToken(user);
    await createLog({ action: 'auth.google_login', userId: user.id, req });

    res.redirect(`${REDIRECT}?token=${token}&user=${encodeURIComponent(JSON.stringify(sanitizeUser(user)))}`);
  } catch (error) {
    res.redirect(`${REDIRECT}?error=${encodeURIComponent(error.message || 'Google login failed')}`);
  }
});

// ---------- OAuth: Discord ----------
const getDiscordOAuthUrl = () => {
  const url = new URL('https://discord.com/api/oauth2/authorize');
  url.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/discord/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify email');
  return url.toString();
};

router.get('/discord/url', (req, res) => {
  if (!process.env.DISCORD_CLIENT_ID) {
    return res.status(400).json({ success: false, message: 'Discord OAuth is not configured' });
  }
  res.json({ success: true, data: { url: getDiscordOAuthUrl() } });
});

router.get('/discord/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) throw new ApiError(400, 'No authorization code provided', 'NO_CODE');

    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
      throw new ApiError(500, 'Discord OAuth is not configured', 'OAUTH_NOT_CONFIGURED');
    }

    const redirectUri = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/discord/callback`;

    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', querystring.stringify({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token } = tokenRes.data;
    const profileRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileRes.data;

    const discordId = String(profile.id);
    const email = profile.email ? String(profile.email).toLowerCase() : `${discordId}@discord.local`;
    const avatar = profile.avatar
      ? `https://cdn.discordapp.com/avatars/${discordId}/${profile.avatar}.png?size=256`
      : null;

    let user = await db.user.findUnique({ where: { discordId } });
    if (!user && profile.email) {
      user = await db.user.findUnique({ where: { email } });
    }

    if (!user) {
      user = await db.user.create({
        data: {
          username: profile.username || 'discord-user',
          email,
          avatar,
          discordId,
          password: null,
          role: 'user',
          coins: 0,
          referralCode: generateReferralCode(profile.username),
        },
      });
      await grantSignupReward(user.id);
      user = await db.user.findUnique({ where: { id: user.id } });
    } else {
      await db.user.update({
        where: { id: user.id },
        data: { discordId, ...(avatar ? { avatar } : {}) },
      });
    }

    const token = signToken(user);
    await createLog({ action: 'auth.discord_login', userId: user.id, req });

    res.redirect(`${REDIRECT}?token=${token}&user=${encodeURIComponent(JSON.stringify(sanitizeUser(user)))}`);
  } catch (error) {
    res.redirect(`${REDIRECT}?error=${encodeURIComponent(error.message || 'Discord login failed')}`);
  }
});

// Get user notifications
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;

    const notifications = await db.notification.findMany({
      where: {
        userId: req.userId,
        ...(unreadOnly === 'true' && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    const unreadCount = await db.notification.count({ where: { userId: req.userId, read: false } });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== req.userId) {
      throw new ApiError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    await db.notification.update({ where: { id }, data: { read: true } });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    await db.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
