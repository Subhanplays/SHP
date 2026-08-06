import bcrypt from 'bcryptjs';
import { db } from '../src/config/database.js';

const seed = async () => {
  await db.$connect();
  console.log('🗄️  Connected to SQLite database');

  // 1. Create admin user if none exists
  const userCount = await db.user.count({ where: { role: { in: ['admin', 'superadmin'] } } });

  if (userCount === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@shp.com';
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

    console.log(`✅ Admin user created: ${email} / ${password}`);
  } else {
    console.log('ℹ️  Admin user already exists, skipping');
  }

  // 2. Create default settings if missing
  const defaults = {
    branding: {
      value: {
        panelName: 'SHP',
        fullName: 'SubhanHostPanel',
        logo: null,
        favicon: null,
        footerText: '© 2026 SubhanHostPanel. All rights reserved.',
        copyright: '© 2026 SubhanHostPanel. All rights reserved.',
        browserTitle: 'SHP - SubhanHostPanel',
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
          subtitle: 'Premium Minecraft, VPS and game servers powered by SHP.',
          buttonText: 'Get Started',
          buttonUrl: '/register',
          image: null,
        },
        features: [
          { icon: 'bolt', title: 'Instant Setup', description: 'Servers are provisioned automatically within seconds of payment.' },
          { icon: 'shield', title: 'DDoS Protection', description: 'Every server is protected by enterprise-grade DDoS mitigation.' },
          { icon: 'support', title: '24/7 Support', description: 'Our team is always available to help you get the most out of your servers.' },
        ],
        reviews: [
          { name: 'Alex Johnson', role: 'Minecraft Owner', content: 'Best hosting panel I have ever used. Setup took less than a minute!', rating: 5 },
          { name: 'Sarah Chen', role: 'Bot Developer', content: 'Amazing uptime and the coin system makes it super easy to manage billing.', rating: 5 },
          { name: 'Mike Torres', role: 'VPS Admin', content: 'Blazing fast servers and a gorgeous panel. Highly recommended.', rating: 4 },
        ],
        faq: [
          { q: 'How fast is setup?', a: 'Servers are provisioned automatically as soon as payment is confirmed, usually within a minute.' },
          { q: 'What payment methods do you accept?', a: 'We accept SHP Coins, cards (Stripe), PayPal and crypto.' },
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
      await db.settings.create({
        data: { key, value: setting.value, category: setting.category },
      });
      console.log(`✅ Setting created: ${key}`);
    } else {
      // Merge new default keys into existing values (preserves admin values)
      const merged = {
        ...(existing.value && typeof existing.value === 'object' ? existing.value : {}),
        ...setting.value,
      };
      const mergedString = JSON.stringify(merged) !== JSON.stringify(existing.value);
      if (mergedString) {
        await db.settings.update({ where: { key }, data: { value: merged, category: setting.category } });
        console.log(`🔄 Setting updated: ${key}`);
      }
    }
  }

  // 3. Seed a demo product if there are none
  const productCount = await db.product.count();
  if (productCount === 0) {
    await db.product.create({
      data: {
        name: 'Minecraft Starter',
        description: '4GB RAM Minecraft server with DDoS protection and instant setup.',
        category: 'minecraft',
        price: 5,
        coinPrice: 5000,
        billingCycle: 'monthly',
        ram: 4096,
        cpu: 200,
        disk: 40000,
        databases: 1,
        backups: 3,
        node: null,
        egg: null,
        allocation: null,
        enabled: true,
      },
    });
    await db.product.create({
      data: {
        name: 'VPS Basic',
        description: '4 vCPU, 8GB RAM KVM VPS with full root access.',
        category: 'vps',
        price: 10,
        coinPrice: 10000,
        billingCycle: 'monthly',
        ram: 8192,
        cpu: 400,
        disk: 80000,
        databases: 0,
        backups: 2,
        node: null,
        egg: null,
        allocation: null,
        enabled: true,
      },
    });
    await db.product.create({
      data: {
        name: 'Bot Hosting Standard',
        description: 'Perfect for Discord bots. 2GB RAM, runs 24/7.',
        category: 'bot',
        price: 3,
        coinPrice: 3000,
        billingCycle: 'monthly',
        ram: 2048,
        cpu: 100,
        disk: 10000,
        databases: 0,
        backups: 1,
        node: null,
        egg: null,
        allocation: null,
        enabled: true,
      },
    });
    console.log('✅ Demo products created');
  }

  await db.$disconnect();
  console.log('🎉 Seeding complete');
};

seed().catch(async (error) => {
  console.error('Seeding failed:', error);
  await db.$disconnect();
  process.exit(1);
});
