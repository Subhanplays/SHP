import bcrypt from 'bcryptjs';
import { db } from '../src/config/database.js';

const seed = async () => {
  await db.$connect();
  console.log('Connected to database');

  const userCount = await db.user.count({ where: { role: { in: ['admin', 'superadmin'] } } });

  if (userCount === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'superadmin',
        coins: 100000,
      },
    });

    console.log(`Admin user created: ${email} / ${password}`);
  } else {
    console.log('Admin user already exists, skipping');
  }

  const defaults = {
    branding: {
      value: {
        panelName: 'Hosting Panel',
        fullName: 'White-Label Hosting Panel',
        logo: null,
        favicon: null,
        footerText: `© ${new Date().getFullYear()} White-Label Hosting Panel. All rights reserved.`,
        copyright: `© ${new Date().getFullYear()} White-Label Hosting Panel. All rights reserved.`,
        browserTitle: 'Hosting Panel',
      },
      category: 'branding',
    },
    theme: {
      value: {
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        backgroundColor: '#0f0f1a',
        cardBackground: 'rgba(26, 26, 46, 0.8)',
        borderRadius: '12px',
        fontFamily: 'Inter',
        sidebarBackground: '#1a1a2e',
        navbarStyle: 'glass',
        darkMode: true,
        animations: true,
      },
      category: 'theme',
    },
    coins: {
      value: {
        enabled: true,
        signupReward: 1000,
        referralReward: 500,
        dailyReward: 100,
        coinRate: 100,
      },
      category: 'coins',
    },
    coins_signup_reward: {
      value: { enabled: true, amount: 1000 },
      category: 'coins',
    },
    coins_daily_reward: {
      value: { enabled: true, amount: 100 },
      category: 'coins',
    },
    grace_period_days: {
      value: { days: 7 },
      category: 'general',
    },
    background: {
      value: {
        type: 'solid',
        color: '#0f0f1a',
        gradient: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        image: null,
        video: null,
        overlay: 0.5,
        blur: 0,
      },
      category: 'appearance',
    },
    custom_css: {
      value: '/* Add your custom CSS here */\n.card {\n  border-radius: 20px;\n}',
      category: 'appearance',
    },
    landing: {
      value: {
        enabled: true,
        hero: {
          title: 'Game Hosting Done Right',
          subtitle: 'Premium hosting for Minecraft, VPS, game servers, and bots.',
          buttonText: 'Get Started',
          buttonUrl: '/register',
          image: null,
        },
        features: [
          { icon: 'bolt', title: 'Instant Setup', description: 'Servers are provisioned automatically within seconds of payment.' },
          { icon: 'shield', title: 'DDoS Protection', description: 'Every server is protected by enterprise-grade DDoS mitigation.' },
          { icon: 'support', title: '24/7 Support', description: 'Your team can help customers whenever they need assistance.' },
        ],
        reviews: [
          { name: 'Alex Johnson', role: 'Minecraft Owner', content: 'Great performance and a clean dashboard.', rating: 5 },
          { name: 'Sarah Chen', role: 'Bot Developer', content: 'Fast setup and simple billing.', rating: 5 },
          { name: 'Mike Torres', role: 'VPS Admin', content: 'Everything is easy to manage from one place.', rating: 4 },
        ],
        faq: [
          { q: 'How fast is setup?', a: 'Servers are provisioned automatically as soon as payment is confirmed, usually within a minute.' },
          { q: 'What payment methods do you accept?', a: 'We accept coins, cards (Stripe), PayPal and crypto.' },
          { q: 'Can I upgrade my server later?', a: 'Yes, you can upgrade your resources at any time from your dashboard.' },
        ],
      },
      category: 'landing',
    },
    maintenance_mode: {
      value: { enabled: false, message: 'We are performing scheduled maintenance. Please check back soon.' },
      category: 'general',
    },
  };

  for (const [key, setting] of Object.entries(defaults)) {
    const existing = await db.settings.findUnique({ where: { key } });
    if (!existing) {
      await db.settings.create({ data: { key, value: setting.value, category: setting.category } });
      console.log(`Setting created: ${key}`);
    }
  }

  await db.$disconnect();
  console.log('Seeding complete');
};

seed().catch(async (error) => {
  console.error('Seeding failed:', error);
  await db.$disconnect();
  process.exit(1);
});
