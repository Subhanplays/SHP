import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import { adminAPI, productAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'minecraft', name: 'Minecraft Hosting' },
  { id: 'vps', name: 'VPS Hosting' },
  { id: 'game', name: 'Game Servers' },
  { id: 'bot', name: 'Bot Hosting' },
  { id: 'web', name: 'Web Hosting' },
];

const CYCLES = ['weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'];

const EMPTY = {
  name: '',
  description: '',
  category: 'minecraft',
  price: 5,
  coinPrice: 1000,
  billingCycle: 'monthly',
  ram: 1024,
  cpu: 100,
  disk: 10240,
  databases: 1,
  backups: 1,
  node: 0,
  egg: null,
  allocation: 0,
  eggConfig: [],
  enabled: true,
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [freeInfo, setFreeInfo] = useState([]);

  useEffect(() => {
    adminAPI.getFreeAllocations()
      .then((res) => setFreeInfo(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      adminAPI.getProducts({ limit: 100 })
        .then((res) => {
          const p = res.data.data.products?.find((x) => x.id === id);
          if (p) setForm({ ...EMPTY, ...p });
          else toast.error('Product not found');
        })
        .catch(() => toast.error('Failed to load product'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await adminAPI.updateProduct(id, form);
        toast.success('Product updated');
      } else {
        await adminAPI.createProduct(form);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleConfig = (idx, field, value) => {
    const next = (form.eggConfig || []).map((c) => ({ ...c }));
    next[idx][field] = value;
    setForm({ ...form, eggConfig: next });
  };

  const addConfig = () => {
    setForm({ ...form, eggConfig: [...(form.eggConfig || []), { env: '', label: '', options: [], password: false, placeholder: '' }] });
  };

  const removeConfig = (idx) => {
    setForm({ ...form, eggConfig: (form.eggConfig || []).filter((_, i) => i !== idx) });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/products" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <FaArrowLeft /> Back to Products
      </Link>
      <PageHeader title={isEdit ? 'Edit Product' : 'New Product'} subtitle={isEdit ? `Editing ${form.name}` : 'Create a new hosting plan.'} />

      <form onSubmit={handleSubmit}>
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 900 }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.05rem', fontWeight: 700 }}>Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Product Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Minecraft Starter" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="form-control" rows={2} placeholder="Short description shown on product cards" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="form-control">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Billing Cycle</label>
              <select name="billingCycle" value={form.billingCycle} onChange={handleChange} className="form-control">
                {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Price (USD) *</label>
              <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} className="form-control" required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Coin Price</label>
              <input name="coinPrice" type="number" min="0" value={form.coinPrice} onChange={handleChange} className="form-control" />
            </div>
          </div>

          <h3 style={{ margin: '2rem 0 1.5rem', fontSize: '1.05rem', fontWeight: 700 }}>Resources</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>RAM (MB)</label>
              <input name="ram" type="number" min="0" value={form.ram} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>CPU (%)</label>
              <input name="cpu" type="number" min="0" value={form.cpu} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Disk (MB)</label>
              <input name="disk" type="number" min="0" value={form.disk} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Databases</label>
              <input name="databases" type="number" min="0" value={form.databases} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Backups</label>
              <input name="backups" type="number" min="0" value={form.backups} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Node ID</label>
              <input name="node" type="number" min="0" value={form.node} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Allocation</label>
              <input name="allocation" type="number" min="0" value={form.allocation} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Egg ID</label>
              <input name="egg" value={form.egg ?? ''} onChange={handleChange} className="form-control" placeholder="Pterodactyl egg id" />
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.08)', border: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Available ports</strong>
            {freeInfo.length === 0 ? (
              <span>No enabled panels with read access, or no free ports found.</span>
            ) : (
              freeInfo.map((p) => (
                <div key={p.panelId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0' }}>
                  <span>{p.panelName}</span>
                  <span style={{ fontWeight: 600 }}>{p.count} free</span>
                </div>
              ))
            )}
            <span style={{ display: 'block', marginTop: '0.35rem' }}>Leave Allocation empty to auto-pick any free port on purchase.</span>
          </div>

          <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.05rem', fontWeight: 700 }}>
            Software / Version Options <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>(shown at purchase)</span>
          </h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Define the drop-downs buyers see before ordering (e.g. Software: Paper/Bungee/Waterfall, then Version: 1.21.1). Leave empty to auto-read from the Pterodactyl egg variables.
          </p>
          {(form.eggConfig || []).map((cfg, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.6rem', marginBottom: '0.6rem', alignItems: 'center' }}>
              <input className="form-control" placeholder="Env var (e.g. VERSION)" value={cfg.env} onChange={(e) => handleConfig(idx, 'env', e.target.value)} />
              <input className="form-control" placeholder="Label (e.g. Software / Version)" value={cfg.label} onChange={(e) => handleConfig(idx, 'label', e.target.value)} />
              <button type="button" className="btn-outline" onClick={() => removeConfig(idx)} style={{ color: '#ef4444', padding: '0.5rem 0.7rem' }}>✕</button>
              <input className="form-control" placeholder="Options, comma-separated (e.g. Paper,Bungee,Waterfall)" value={(cfg.options || []).join(',')} onChange={(e) => handleConfig(idx, 'options', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} style={{ gridColumn: '1 / 3' }} />
            </div>
          ))}
          <button type="button" className="btn-outline" onClick={addConfig} style={{ marginTop: '0.25rem' }}>+ Add option field</button>

          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} style={{ accentColor: 'var(--primary-color)', width: 18, height: 18 }} />
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Enabled (visible in store)</label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
            <motion.button type="submit" className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </motion.button>
            <Link to="/admin/products" className="btn-outline" style={{ textDecoration: 'none' }}>Cancel</Link>
          </div>
        </motion.div>
      </form>
    </div>
  );
};

export default ProductForm;
