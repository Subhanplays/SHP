import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGamepad, FaPlus, FaTrash, FaEdit, FaLink, FaServer } from 'react-icons/fa';
import { adminAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/format';

const EMPTY_PANEL = { name: '', url: '', appApiKey: '', clientApiKey: '', nodeId: '', eggId: '', locationId: '', enabled: true };

const Pterodactyl = () => {
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PANEL);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPterodactylPanels();
      setPanels(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load panels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleTest = async () => {
    if (!form.url || !form.appApiKey) {
      toast.error('Enter a URL and App API key to test');
      return;
    }
    setTesting(true);
    try {
      const res = await adminAPI.testPterodactyl({ url: form.url, appApiKey: form.appApiKey });
      if (res.data?.success) {
        toast.success('Connection successful');
      } else {
        toast.error(res.data?.message || res.data?.data?.error || 'Connection failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Connection failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        nodeId: form.nodeId ? parseInt(form.nodeId) : undefined,
        eggId: form.eggId ? parseInt(form.eggId) : undefined,
        locationId: form.locationId ? parseInt(form.locationId) : undefined,
        enabled: form.enabled === true || form.enabled === 'true',
      };
      if (editing) {
        await adminAPI.updatePterodactylPanel(editing.id, payload);
        toast.success('Panel updated');
      } else {
        await adminAPI.addPterodactylPanel(payload);
        toast.success('Panel added');
      }
      setShowForm(false);
      setForm(EMPTY_PANEL);
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
      await adminAPI.deletePterodactylPanel(deleteTarget.id);
      toast.success('Panel deleted');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (panel) => {
    setEditing(panel);
    setForm({
      name: panel.name,
      url: panel.url,
      appApiKey: '',
      clientApiKey: '',
      nodeId: panel.nodeId || '',
      eggId: panel.eggId || '',
      locationId: panel.locationId || '',
      enabled: panel.enabled !== false,
    });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Pterodactyl"
        subtitle="Connect your Pterodactyl panel for automatic server provisioning."
        actions={
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY_PANEL); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus /> {showForm && !editing ? 'Close' : 'Add Panel'}
          </button>
        }
      />

      {showForm && (
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
            {editing ? `Edit Panel: ${editing.name}` : 'Add Pterodactyl Panel'}
          </h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Name *</label>
                <input name="name" value={form.name} onChange={handleChange} className="form-control" placeholder="Main Panel" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Panel URL *</label>
                <input name="url" value={form.url} onChange={handleChange} className="form-control" placeholder="https://panel.example.com" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>App API Key *</label>
                <input name="appApiKey" value={form.appApiKey} onChange={handleChange} className="form-control" type="password" placeholder="ptla_..." required={!editing} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Client API Key</label>
                <input name="clientApiKey" value={form.clientApiKey} onChange={handleChange} className="form-control" type="password" placeholder="ptlc_..." />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Node ID</label>
                <input name="nodeId" value={form.nodeId} onChange={handleChange} className="form-control" type="number" placeholder="1" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Egg ID</label>
                <input name="eggId" value={form.eggId} onChange={handleChange} className="form-control" type="number" placeholder="15" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Location ID</label>
                <input name="locationId" value={form.locationId} onChange={handleChange} className="form-control" type="number" placeholder="1" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingTop: '1.5rem' }}>
                <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} style={{ accentColor: 'var(--primary-color)', width: 18, height: 18 }} />
                <label style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>Enabled (creates servers on this panel)</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <motion.button type="submit" className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update Panel' : 'Add Panel'}
              </motion.button>
              <button type="button" className="btn-outline" onClick={handleTest} disabled={testing} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaLink /> {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button type="button" className="btn-outline" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_PANEL); }}>Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : panels.length === 0 ? (
        <EmptyState
          icon={FaGamepad}
          title="No panels connected"
          message="Add your Pterodactyl panel to enable automatic server provisioning."
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>Add Panel</button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {panels.map((p) => (
            <div key={p.id} className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaServer style={{ color: '#8b5cf6' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.url}</p>
                  </div>
                </div>
                <Badge status={p.status}>{p.status || 'unknown'}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                <span>{p._count?.servers || 0} servers · added {formatDateTime(p.createdAt)} · <span style={{ color: p.enabled ? '#10b981' : '#ef4444', fontWeight: 600 }}>{p.enabled ? 'Enabled' : 'Disabled'}</span></span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn-outline" onClick={() => startEdit(p)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} title="Edit">
                    <FaEdit />
                  </button>
                  <button className="btn-outline" onClick={() => setDeleteTarget(p)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ef4444' }} title="Delete">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete this panel?"
        message={`"${deleteTarget?.name}" will be removed. Existing servers are not affected.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Pterodactyl;
