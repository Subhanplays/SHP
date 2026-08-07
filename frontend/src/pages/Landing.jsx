import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBolt, FaShieldAlt, FaHeadset, FaServer, FaCoins, FaCheck, FaStar, FaChevronDown, FaGithub, FaDiscord, FaTwitter } from 'react-icons/fa';
import useSettingsStore from '../store/settingsStore';
import { productAPI } from '../api/axios';
import BackgroundLayer from '../components/BackgroundLayer';

const ICON_MAP = {
  bolt: FaBolt,
  shield: FaShieldAlt,
  support: FaHeadset,
  server: FaServer,
  coins: FaCoins,
};

const Landing = () => {
  const branding = useSettingsStore((s) => s.branding);
  const landing = useSettingsStore((s) => s.landing);
  const theme = useSettingsStore((s) => s.theme);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getAll({ limit: 50 })
      .then((res) => setProducts(res.data.data.products || []))
      .finally(() => setLoading(false));
  }, []);

  const l = landing || {};
  const hero = l.hero || {};
  const features = l.features || [];
  const reviews = l.reviews || [];
  const faq = l.faq || [];

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-family)' }}>
      <BackgroundLayer />

      {/* Navbar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
          background: 'rgba(15,15,26,0.7)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {branding?.logo ? (
              <img src={branding.logo} alt={branding.panelName} style={{ height: 40, borderRadius: 8, objectFit: 'contain' }} />
            ) : (
              <div
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700,
                }}
              >
                {(branding?.panelName || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <strong style={{ fontSize: '1.1rem' }}>{branding?.panelName || 'SHP'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem' }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => scrollTo('features')}>Features</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => scrollTo('pricing')}>Pricing</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => scrollTo('faq')}>FAQ</span>
            <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign in</Link>
            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '0.55rem 1.25rem' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15 }}>
          <span className="gradient-text">{hero.title || 'Game Hosting Done Right'}</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ maxWidth: 640, margin: '1.25rem auto 0', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          {hero.subtitle || 'Premium Minecraft, VPS and game servers powered by SHP.'}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: '2.25rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={hero.buttonUrl || '/register'} className="btn-primary" style={{ textDecoration: 'none', padding: '0.9rem 2.25rem', fontSize: '1rem' }}>
            {hero.buttonText || 'Get Started'}
          </Link>
          <button className="btn-outline" onClick={() => scrollTo('pricing')} style={{ padding: '0.9rem 2.25rem', fontSize: '1rem' }}>
            View Pricing
          </button>
        </motion.div>
        {hero.image && (
          <motion.img initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} src={hero.image} alt="Hero" style={{ marginTop: '3rem', maxWidth: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} />
        )}
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '2.5rem' }}>
            Why choose <span className="gradient-text">{branding?.panelName || 'SHP'}</span>?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {(features.length ? features : [
              { icon: 'bolt', title: 'Instant Setup', description: 'Servers are provisioned automatically within seconds of payment.' },
              { icon: 'shield', title: 'DDoS Protection', description: 'Every server is protected by enterprise-grade DDoS mitigation.' },
              { icon: 'support', title: '24/7 Support', description: 'Our team is always available to help you.' },
            ]).map((f, i) => {
              const Icon = ICON_MAP[f.icon] || FaBolt;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ width: 56, height: 56, margin: '0 auto 1rem', borderRadius: 14, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Simple, transparent pricing</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Pay with your card or SHP Coins.</p>
          {loading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {products.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FaServer style={{ color: 'var(--primary-color)' }} />
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{p.name}</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minHeight: 60 }}>{p.description}</p>
                    <div style={{ fontSize: '0.85rem', display: 'grid', gap: '0.35rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                      <span>{p.ram} MB RAM</span>
                      <span>{p.cpu}% CPU</span>
                      <span>{p.disk} MB Disk</span>
                      {p.databases > 0 && <span>{p.databases} Database(s)</span>}
                      {p.backups > 0 && <span>{p.backups} Backup(s)</span>}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                      ${p.price}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{p.billingCycle === 'yearly' ? 'year' : 'mo'}</span>
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>
                      <FaCoins /> {p.coinPrice?.toLocaleString()} coins
                    </p>
                    <Link to={`/products/${p.id}`} className="btn-primary" style={{ textDecoration: 'none', width: '100%', textAlign: 'center', display: 'block', padding: '0.75rem' }}>
                      Order Now
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" style={{ padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '2.5rem' }}>Loved by thousands</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {(reviews.length ? reviews : [
              { name: 'Alex Johnson', role: 'Minecraft Owner', content: 'Best hosting panel I have ever used. Setup took less than a minute!', rating: 5 },
              { name: 'Sarah Chen', role: 'Bot Developer', content: 'Amazing uptime and the coin system makes it super easy to manage billing.', rating: 5 },
            ]).map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card">
                <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.75rem' }}>
                  {Array.from({ length: r.rating || 5 }).map((_, j) => (
                    <FaStar key={j} style={{ color: '#fbbf24', fontSize: '0.85rem' }} />
                  ))}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>"{r.content}"</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{r.name}</p>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{r.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '2.5rem' }}>Frequently asked questions</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {(faq.length ? faq : [
              { q: 'How fast is setup?', a: 'Servers are provisioned automatically as soon as payment is confirmed, usually within a minute.' },
              { q: 'What payment methods do you accept?', a: 'We accept SHP Coins, cards (Stripe), PayPal and crypto.' },
            ]).map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '3rem 1.5rem 4rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: 800, margin: '0 auto', padding: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Ready to launch your server?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Join {branding?.fullName || 'SubhanHostPanel'} today and get free SHP Coins on signup.
          </p>
          <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '0.9rem 2.5rem', fontSize: '1rem' }}>
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p style={{ margin: '0 0 1rem' }}>{branding?.footerText || `© ${new Date().getFullYear()} ${branding?.fullName || 'SubhanHostPanel'}. All rights reserved.`}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <FaDiscord style={{ cursor: 'pointer' }} />
          <FaTwitter style={{ cursor: 'pointer' }} />
          <FaGithub style={{ cursor: 'pointer' }} />
        </div>
      </footer>
    </div>
  );
};

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)', padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}>
        {q}
        <FaChevronDown style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
      </button>
      {open && <p style={{ padding: '0 1.5rem 1.25rem', margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{a}</p>}
    </motion.div>
  );
};

export default Landing;
