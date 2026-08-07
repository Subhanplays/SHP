import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaServer, FaBox, FaCoins, FaDatabase, FaArchive } from 'react-icons/fa';
import { productAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import useSettingsStore from '../../store/settingsStore';
import { formatCurrency } from '../../utils/format';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const coinsEnabled = useSettingsStore((s) => s.coins?.enabled);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([productAPI.getCategories(), productAPI.getAll({ limit: 100, enabled: true })]);
      setCategories(catRes.data.data || []);
      setProducts(prodRes.data.data.products || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeCategory === 'all' ? products : products.filter((p) => p.category === activeCategory);

  return (
    <div>
      <PageHeader title="Products" subtitle="Choose a hosting plan and get your server running in minutes." />

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveCategory('all')}
          className="btn-outline"
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.85rem',
            background: activeCategory === 'all' ? 'var(--primary-color)' : 'transparent',
            color: activeCategory === 'all' ? '#fff' : 'var(--text-secondary)',
            borderColor: activeCategory === 'all' ? 'var(--primary-color)' : 'var(--glass-border)',
          }}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className="btn-outline"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              background: activeCategory === c.id ? 'var(--primary-color)' : 'transparent',
              color: activeCategory === c.id ? '#fff' : 'var(--text-secondary)',
              borderColor: activeCategory === c.id ? 'var(--primary-color)' : 'var(--glass-border)',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FaBox} title="No products found" message="Check back soon for new hosting plans." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaServer style={{ color: 'var(--primary-color)', fontSize: '1.25rem' }} />
                </div>
                <Badge status={p.category}>{p.category}</Badge>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{p.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 1rem', flex: 1, minHeight: 40 }}>
                {p.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                <span><FaDatabase style={{ marginRight: '0.35rem', color: 'var(--text-muted)' }} />{p.ram} MB RAM</span>
                <span><FaServer style={{ marginRight: '0.35rem', color: 'var(--text-muted)' }} />{p.cpu}% CPU</span>
                <span><FaArchive style={{ marginRight: '0.35rem', color: 'var(--text-muted)' }} />{p.disk} MB Disk</span>
                {coinsEnabled && p.coinPrice > 0 && (
                  <span><FaCoins style={{ marginRight: '0.35rem', color: '#fbbf24' }} />{p.coinPrice.toLocaleString()} coins</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                    {formatCurrency(p.price)}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{p.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                  </p>
                </div>
                <Link to={`/products/${p.id}`} className="btn-primary" style={{ textDecoration: 'none', padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}>
                  Order
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
