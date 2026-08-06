import crypto from 'crypto';

// Generate a unique, human-friendly referral code
export const generateReferralCode = (username = '') => {
  const base = (username || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || 'user';
  const suffix = crypto.randomBytes(2).toString('hex');
  return `${base}${suffix}`;
};

// Compute the expiry date for a server based on a product billing cycle
export const computeExpiry = (billingCycle, from = new Date()) => {
  const d = new Date(from.getTime());
  switch (billingCycle) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'lifetime':
      d.setFullYear(d.getFullYear() + 10);
      break;
    case 'monthly':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d;
};
