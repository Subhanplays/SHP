import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTags, FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { couponAPI, productAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDateTime, formatCurrency } from '../../utils/format';

const EMPTY_COUPON = { code: '', type: 'percent', value: 10, maxUses: '', expiresAt: '', minPurchase: 0, applicableProducts: [], active: true };

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_COUPON);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [coupRes, prodRes] = await Promise.all([couponAPI.getAll(), productAPI.getAll({ limit: 100 })]);
      setCoupons(coupRes.data.data || []);
      setProducts(prodRes.data.data.products || []);
    } catch (error) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const toggleProduct = (id) => {
    const current = form.applicableProducts || [];
    setForm({
      ...form,
      applicableProducts: current.includes(id) ? current.filter((p) => p !== id) : [...current, id],
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: parseFloat(form.value) || 0,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
        minPurchase: parseFloat(form.minPurchase) || 0,
        applicableProducts: form.applicableProducts || [],
        active: form.active !== false,
      };
      if (editing) {
        await couponAPI.update(editing.id, payload);
        toast.success('Coupon updated');
      } else {
        await couponAPI.create(payload);
        toast.success('Coupon created');
      }
      setShowForm(false);
      setForm(EMPTY_COUPON);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await couponAPI.remove(deleteTarget.id);
      toast.success('Coupon deleted');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (c) => {
    try {
      await couponAPI.update(c.id, { active: !c.active });
      toast.success(`Coupon ${c.active ? 'deactivated' : 'activated'}`);
      load();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const startEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      maxUses: c.maxUses || '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      minPurchase: c.minPurchase || 0,
      applicableProducts: c.applicableProducts || [],
      active: c.active,
    });
    setShowForm(true);
  };

  const formatDiscount = (c) => (c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value));

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Create discount codes for your customers."
        actions={
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY_COUPON); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus /> {showForm && !editing ? 'Close' : 'New Coupon'}
          </button>
        }
      />

      {showForm && (
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
            {editing ? `Edit Coupon: ${editing.code}` : 'Create Coupon'}
          </h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Code *</label>
                <input name="code" value={form.code} onChange={handleChange} className="form-control" placeholder="SUMMER20" style={{ textTransform: 'uppercase' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Type</label>
                <select name="type" value={form.type} onChange={handleChange} className="form-control">
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Value *</label>
                <input name="value" type="number" step="0.01" value={form.value} onChange={handleChange} className="form-control" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Max Uses</label>
                <input name="maxUses" type="number" value={form.maxUses} onChange={handleChange} className="form-control" placeholder="Unlimited" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Expires At</label>
                <input name="expiresAt" type="date" value={form.expiresAt} onChange={handleChange} className="form-control" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Min Purchase ($)</label>
                <input name="minPurchase" type="number" step="0.01" value={form.minPurchase} onChange={handleChange} className="form-control" />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Applicable products <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(empty = all products)</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {products.map((p) => {
                  const active = (form.applicableProducts || []).includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: `1px solid ${active ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                        background: active ? 'rgba(99,102,241,0.15)' : 'var(--glass-bg)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
              <input type="checkbox" name="active" checked={form.active !== false} onChange={handleChange} style={{ accentColor: 'var(--primary-color)', width: 18, height: 18 }} />
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Active (redeemable now)</label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <motion.button type="submit" className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaSave /> {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
              </motion.button>
              <button type="button" className="btn-outline" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_COUPON); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaTimes /> Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={FaTags}
          title="No coupons yet"
          message="Create your first coupon code to start offering discounts."
          action={<button className="btn-primary" onClick={() => setShowForm(true)}>New Coupon</button>}
        />
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Code</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Discount</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Uses</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Min Purchase</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Expires</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <Badge status="fixed" style={{ background: 'rgba(139,92,246,0.15)' }}>{c.code}</Badge>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>{formatDiscount(c)}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {c.maxUses ? `${c.usedCount || 0}/${c.maxUses}` : c.usedCount || 0}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.minPurchase ? formatCurrency(c.minPurchase) : '—'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.expiresAt ? formatDateTime(c.expiresAt) : 'Never'}</td>
                    <td style={{ padding: '1rem' }}><Badge status={c.active ? 'active' : 'deleted'}>{c.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button className="btn-outline" onClick={() => startEdit(c)} style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }} title="Edit"><FaEdit /></button>
                        <button className="btn-outline" onClick={() => handleToggle(c)} style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }} title={c.active ? 'Deactivate' : 'Activate'}>
                          {c.active ? <FaToggleOn style={{ color: '#10b981' }} /> : <FaToggleOff style={{ color: 'var(--text-muted)' }} />}
                        </button>
                        <button className="btn-outline" onClick={() => setDeleteTarget(c)} style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', color: '#ef4444' }} title="Delete"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete this coupon?"
        message={`"${deleteTarget?.code}" will be permanently removed.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Coupons;
