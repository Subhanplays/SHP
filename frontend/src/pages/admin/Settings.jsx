import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaPalette, FaFont, FaImage, FaCode, FaCoins, FaRocket, FaImages, FaCog, FaList, FaSave, FaUpload, FaTrash, FaEye,
} from 'react-icons/fa';
import useSettingsStore from '../../store/settingsStore';
import { mediaAPI, adminAPI, settingsAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/format';

const TABS = [
  { id: 'branding', label: 'Branding', icon: FaFont },
  { id: 'theme', label: 'Theme', icon: FaPalette },
  { id: 'background', label: 'Background', icon: FaImage },
  { id: 'css', label: 'Custom CSS', icon: FaCode },
  { id: 'coins', label: 'Coins', icon: FaCoins },
  { id: 'landing', label: 'Landing Page', icon: FaRocket },
  { id: 'media', label: 'Media Library', icon: FaImages },
  { id: 'general', label: 'General', icon: FaCog },
  { id: 'logs', label: 'Activity Logs', icon: FaList },
];

const Settings = () => {
  const [tab, setTab] = useState('branding');

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your panel, branding, theme and more." />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              fontSize: '0.85rem',
              background: tab === t.id ? 'var(--primary-color)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-secondary)',
              borderColor: tab === t.id ? 'var(--primary-color)' : 'var(--glass-border)',
            }}
          >
            <t.icon /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'branding' && <BrandingTab />}
      {tab === 'theme' && <ThemeTab />}
      {tab === 'background' && <BackgroundTab />}
      {tab === 'css' && <CssTab />}
      {tab === 'coins' && <CoinsTab />}
      {tab === 'landing' && <LandingTab />}
      {tab === 'media' && <MediaTab />}
      {tab === 'general' && <GeneralTab />}
      {tab === 'logs' && <LogsTab />}
    </div>
  );
};

/* ---------- Shared bits ---------- */

const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{label}</label>
    {children}
    {hint && <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</p>}
  </div>
);

const SaveButton = ({ saving, onClick, label = 'Save Changes' }) => (
  <motion.button className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
    <FaSave /> {saving ? 'Saving...' : label}
  </motion.button>
);

const Card = ({ children, title }) => (
  <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 900 }}>
    {title && <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>}
    {children}
  </motion.div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text', required }) => (
  <input type={type} value={value || ''} onChange={onChange} className="form-control" placeholder={placeholder} required={required} />
);

/* ---------- Branding ---------- */

const BrandingTab = () => {
  const branding = useSettingsStore((s) => s.branding);
  const updateBranding = useSettingsStore((s) => s.updateBranding);
  const [form, setForm] = useState(branding);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true);
    const res = await updateBranding(form);
    if (res.success) toast.success('Branding updated');
    else toast.error('Failed to update branding');
    setSaving(false);
  };

  return (
    <Card title="Branding">
      <Field label="Panel Name" hint="Shown in the sidebar and header.">
        <TextInput value={form.panelName} onChange={(e) => set('panelName', e.target.value)} />
      </Field>
      <Field label="Full Name" hint="Displayed under the logo.">
        <TextInput value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
      </Field>
      <Field label="Logo URL" hint="Recommended square image (png/svg).">
        <TextInput value={form.logo} onChange={(e) => set('logo', e.target.value)} placeholder="https://..." />
      </Field>
      <Field label="Favicon URL">
        <TextInput value={form.favicon} onChange={(e) => set('favicon', e.target.value)} placeholder="https://..." />
      </Field>
      <Field label="Browser Title" hint="Shown in the browser tab.">
        <TextInput value={form.browserTitle} onChange={(e) => set('browserTitle', e.target.value)} />
      </Field>
      <Field label="Footer Text">
        <TextInput value={form.footerText} onChange={(e) => set('footerText', e.target.value)} />
      </Field>
      <SaveButton saving={saving} onClick={save} />
    </Card>
  );
};

/* ---------- Theme ---------- */

const THEME_FONTS = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Playfair Display', 'JetBrains Mono', 'Space Grotesk'];

const ThemeTab = () => {
  const theme = useSettingsStore((s) => s.theme);
  const updateTheme = useSettingsStore((s) => s.updateTheme);
  const [form, setForm] = useState(theme);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true);
    const res = await updateTheme(form);
    if (res.success) toast.success('Theme updated');
    else toast.error('Failed to update theme');
    setSaving(false);
  };

  return (
    <Card title="Theme">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div>
          <Field label="Primary Color">
            <input type="color" value={form.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} style={{ width: '100%', height: 44, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer' }} />
          </Field>
        </div>
        <div>
          <Field label="Secondary Color">
            <input type="color" value={form.secondaryColor} onChange={(e) => set('secondaryColor', e.target.value)} style={{ width: '100%', height: 44, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer' }} />
          </Field>
        </div>
        <div>
          <Field label="Sidebar Background">
            <input type="color" value={form.sidebarBackground} onChange={(e) => set('sidebarBackground', e.target.value)} style={{ width: '100%', height: 44, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer' }} />
          </Field>
        </div>
        <div>
          <Field label="Font Family">
            <select className="form-control" value={form.fontFamily} onChange={(e) => set('fontFamily', e.target.value)}>
              {THEME_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        </div>
        <div>
          <Field label="Border Radius" hint="e.g. 12px, 8px, 16px">
            <TextInput value={form.borderRadius} onChange={(e) => set('borderRadius', e.target.value)} />
          </Field>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1.5rem' }}>
        <input type="checkbox" checked={form.darkMode !== false} onChange={(e) => set('darkMode', e.target.checked)} style={{ accentColor: 'var(--primary-color)', width: 18, height: 18 }} />
        <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Dark mode (default)</label>
      </div>
      <SaveButton saving={saving} onClick={save} />
    </Card>
  );
};

/* ---------- Background ---------- */

const BackgroundTab = () => {
  const background = useSettingsStore((s) => s.background);
  const updateBackground = useSettingsStore((s) => s.updateBackground);
  const [form, setForm] = useState(background);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true);
    const res = await updateBackground(form);
    if (res.success) toast.success('Background updated');
    else toast.error('Failed to update background');
    setSaving(false);
  };

  return (
    <Card title="Background Builder">
      <Field label="Type">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['solid', 'gradient', 'image', 'video'].map((t) => (
            <button
              key={t}
              onClick={() => set('type', t)}
              className="btn-outline"
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                background: form.type === t ? 'var(--primary-color)' : 'transparent',
                color: form.type === t ? '#fff' : 'var(--text-secondary)',
                borderColor: form.type === t ? 'var(--primary-color)' : 'var(--glass-border)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>

      {(form.type === 'solid' || form.type === 'gradient') && (
        <Field label={form.type === 'solid' ? 'Color' : 'Gradient CSS'}>
          {form.type === 'solid' ? (
            <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} style={{ width: 100, height: 44, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer' }} />
          ) : (
            <TextInput value={form.gradient} onChange={(e) => set('gradient', e.target.value)} placeholder="linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)" />
          )}
        </Field>
      )}

      {(form.type === 'image' || form.type === 'video') && (
        <Field label={form.type === 'image' ? 'Image URL' : 'Video URL'}>
          <TextInput
            value={form.type === 'image' ? form.image : form.video}
            onChange={(e) => set(form.type, e.target.value)}
            placeholder={form.type === 'image' ? 'https://example.com/bg.jpg' : 'https://example.com/bg.mp4'}
          />
        </Field>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Field label={`Overlay: ${Math.round((form.overlay || 0) * 100)}%`}>
          <input type="range" min="0" max="1" step="0.05" value={form.overlay || 0} onChange={(e) => set('overlay', parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
        </Field>
        <Field label={`Blur: ${form.blur || 0}px`}>
          <input type="range" min="0" max="20" value={form.blur || 0} onChange={(e) => set('blur', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
        </Field>
      </div>

      <SaveButton saving={saving} onClick={save} />
    </Card>
  );
};

/* ---------- Custom CSS ---------- */

const CssTab = () => {
  const customCss = useSettingsStore((s) => s.customCss);
  const updateCustomCss = useSettingsStore((s) => s.updateCustomCss);
  const [css, setCss] = useState(customCss);
  const [saving, setSaving] = useState(false);

  useEffect(() => setCss(customCss), [customCss]);

  const save = async () => {
    setSaving(true);
    const res = await updateCustomCss(css);
    if (res.success) toast.success('Custom CSS saved');
    else toast.error('Failed to save CSS');
    setSaving(false);
  };

  return (
    <Card title="Custom CSS" >
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Add custom CSS that applies globally to the panel and landing page.
      </p>
      <textarea
        value={css}
        onChange={(e) => setCss(e.target.value)}
        rows={18}
        className="form-control"
        placeholder="/* Write custom CSS here */\nbody { background: #000; }"
        style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
      />
      <div style={{ marginTop: '1.25rem' }}>
        <SaveButton saving={saving} onClick={save} />
      </div>
    </Card>
  );
};

/* ---------- Coins ---------- */

const CoinsTab = () => {
  const coins = useSettingsStore((s) => s.coins);
  const updateCoinSettings = useSettingsStore((s) => s.updateCoinSettings);
  const [form, setForm] = useState(coins);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(coins), [coins]);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true);
    const res = await updateCoinSettings({
      ...form,
      signupReward: parseInt(form.signupReward) || 0,
      referralReward: parseInt(form.referralReward) || 0,
      dailyReward: parseInt(form.dailyReward) || 0,
      coinRate: parseFloat(form.coinRate) || 100,
    });
    if (res.success) toast.success('Coin settings saved');
    else toast.error('Failed to save');
    setSaving(false);
  };

  return (
    <Card title="Coin Economy">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input type="checkbox" checked={form.enabled !== false} onChange={(e) => set('enabled', e.target.checked)} style={{ accentColor: 'var(--primary-color)', width: 18, height: 18 }} />
        <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Enable SHP Coins system</label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Field label="Signup Bonus">
          <input type="number" value={form.signupReward} onChange={(e) => set('signupReward', e.target.value)} className="form-control" />
        </Field>
        <Field label="Referral Reward">
          <input type="number" value={form.referralReward} onChange={(e) => set('referralReward', e.target.value)} className="form-control" />
        </Field>
        <Field label="Daily Reward">
          <input type="number" value={form.dailyReward} onChange={(e) => set('dailyReward', e.target.value)} className="form-control" />
        </Field>
        <Field label="Coins per $1" hint="Coin purchase rate.">
          <input type="number" value={form.coinRate} onChange={(e) => set('coinRate', e.target.value)} className="form-control" />
        </Field>
      </div>
      <SaveButton saving={saving} onClick={save} />
    </Card>
  );
};

/* ---------- Landing Page ---------- */

const LandingTab = () => {
  const landing = useSettingsStore((s) => s.landing);
  const updateLanding = useSettingsStore((s) => s.updateLanding);
  const [form, setForm] = useState(landing || { hero: {}, features: [], reviews: [], faq: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (landing) setForm(landing);
  }, [landing]);

  const set = (k, v) => setForm({ ...form, [k]: v });
  const setHero = (k, v) => set('hero', { ...(form.hero || {}), [k]: v });
  const setArr = (key, idx, field, value) => {
    const arr = [...(form[key] || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    set(key, arr);
  };
  const addArr = (key, empty) => set(key, [...(form[key] || []), empty]);
  const removeArr = (key, idx) => set(key, (form[key] || []).filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    const res = await updateLanding(form);
    if (res.success) toast.success('Landing page saved');
    else toast.error('Failed to save landing page');
    setSaving(false);
  };

  return (
    <Card title="Landing Page Builder">
      <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>Hero Section</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <Field label="Title">
          <TextInput value={form.hero?.title} onChange={(e) => setHero('title', e.target.value)} />
        </Field>
        <Field label="Subtitle">
          <TextInput value={form.hero?.subtitle} onChange={(e) => setHero('subtitle', e.target.value)} />
        </Field>
        <Field label="Button Text">
          <TextInput value={form.hero?.buttonText} onChange={(e) => setHero('buttonText', e.target.value)} />
        </Field>
        <Field label="Button URL">
          <TextInput value={form.hero?.buttonUrl} onChange={(e) => setHero('buttonUrl', e.target.value)} />
        </Field>
        <Field label="Hero Image URL" hint="Optional large image below the hero text.">
          <TextInput value={form.hero?.image} onChange={(e) => setHero('image', e.target.value)} placeholder="https://..." />
        </Field>
      </div>

      <h4 style={{ margin: '2rem 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>Features</h4>
      {(form.features || []).map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <input value={f.icon || ''} onChange={(e) => setArr('features', i, 'icon', e.target.value)} className="form-control" placeholder="icon (bolt/shield/support/server/coins)" style={{ maxWidth: 180 }} />
          <input value={f.title || ''} onChange={(e) => setArr('features', i, 'title', e.target.value)} className="form-control" placeholder="Title" />
          <input value={f.description || ''} onChange={(e) => setArr('features', i, 'description', e.target.value)} className="form-control" placeholder="Description" />
          <button className="btn-outline" onClick={() => removeArr('features', i)} style={{ color: '#ef4444', whiteSpace: 'nowrap' }}><FaTrash /></button>
        </div>
      ))}
      <button className="btn-outline" onClick={() => addArr('features', { icon: 'bolt', title: '', description: '' })}>+ Add Feature</button>

      <h4 style={{ margin: '2rem 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>Reviews</h4>
      {(form.reviews || []).map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <input value={r.name || ''} onChange={(e) => setArr('reviews', i, 'name', e.target.value)} className="form-control" placeholder="Name" style={{ maxWidth: 160 }} />
          <input value={r.role || ''} onChange={(e) => setArr('reviews', i, 'role', e.target.value)} className="form-control" placeholder="Role" style={{ maxWidth: 160 }} />
          <input value={r.rating || 5} onChange={(e) => setArr('reviews', i, 'rating', parseInt(e.target.value) || 5)} className="form-control" placeholder="Rating (1-5)" style={{ maxWidth: 120 }} />
          <input value={r.content || ''} onChange={(e) => setArr('reviews', i, 'content', e.target.value)} className="form-control" placeholder="Review text" />
          <button className="btn-outline" onClick={() => removeArr('reviews', i)} style={{ color: '#ef4444' }}><FaTrash /></button>
        </div>
      ))}
      <button className="btn-outline" onClick={() => addArr('reviews', { name: '', role: '', content: '', rating: 5 })}>+ Add Review</button>

      <h4 style={{ margin: '2rem 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>FAQ</h4>
      {(form.faq || []).map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <input value={f.q || ''} onChange={(e) => setArr('faq', i, 'q', e.target.value)} className="form-control" placeholder="Question" />
          <input value={f.a || ''} onChange={(e) => setArr('faq', i, 'a', e.target.value)} className="form-control" placeholder="Answer" />
          <button className="btn-outline" onClick={() => removeArr('faq', i)} style={{ color: '#ef4444', whiteSpace: 'nowrap' }}><FaTrash /></button>
        </div>
      ))}
      <button className="btn-outline" onClick={() => addArr('faq', { q: '', a: '' })}>+ Add FAQ</button>

      <div style={{ marginTop: '2rem' }}>
        <SaveButton saving={saving} onClick={save} label="Save Landing Page" />
        <button className="btn-outline" style={{ marginLeft: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => window.open('/', '_blank')}>
          <FaEye /> Preview
        </button>
      </div>
    </Card>
  );
};

/* ---------- Media ---------- */

const MediaTab = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await mediaAPI.getAll({ limit: 100 });
      setMedia(res.data.data.media || []);
    } catch (error) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await mediaAPI.upload(file);
      toast.success('Uploaded successfully');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mediaAPI.remove(deleteTarget.id);
      toast.success('File deleted');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card title="Media Library" >
      <label className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
        <FaUpload /> {uploading ? 'Uploading...' : 'Upload File'}
        <input type="file" accept="image/*,video/mp4,video/webm" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
      </label>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : media.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No files uploaded yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {media.map((m) => (
            <div key={m.id} className="glass-card" style={{ padding: '0.75rem' }}>
              {m.type === 'video' ? (
                <video src={m.url} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: '#000' }} muted />
              ) : (
                <img src={m.url} alt={m.originalName} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
              )}
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.originalName}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(m.size / 1024).toFixed(0)} KB</span>
                <button className="btn-outline" onClick={() => setDeleteTarget(m)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', color: '#ef4444' }}><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete this file?"
        message={`"${deleteTarget?.originalName}" will be permanently removed.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
};

/* ---------- General ---------- */

const GeneralTab = () => {
  const [form, setForm] = useState({ maintenance: false, gracePeriodDays: 7 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsAPI.getAll().then((res) => {
      const s = res.data.data || {};
      setForm({
        maintenance: s.maintenance_mode?.enabled === true,
        gracePeriodDays: s.grace_period_days?.days || s.grace_period_days?.value || 7,
      });
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateBulk([
        { key: 'maintenance_mode', value: { enabled: form.maintenance }, category: 'general' },
        { key: 'grace_period_days', value: { days: parseInt(form.gracePeriodDays) || 7 }, category: 'general' },
      ]);
      toast.success('General settings saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="General Settings">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input type="checkbox" checked={form.maintenance} onChange={(e) => setForm({ ...form, maintenance: e.target.checked })} style={{ accentColor: 'var(--primary-color)', width: 18, height: 18 }} />
        <div>
          <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Maintenance mode</label>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Show a maintenance screen to visitors.</p>
        </div>
      </div>
      <Field label="Grace period (days)" hint="Days before an expired server is suspended.">
        <input type="number" value={form.gracePeriodDays} onChange={(e) => setForm({ ...form, gracePeriodDays: e.target.value })} className="form-control" style={{ maxWidth: 200 }} />
      </Field>
      <SaveButton saving={saving} onClick={save} />
    </Card>
  );
};

/* ---------- Logs ---------- */

const LogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getLogs({ limit: 100 })
      .then((res) => setLogs(res.data.data.logs || []))
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Activity Logs">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" />
        </div>
      ) : logs.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No activity logged yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {logs.map((l) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>{l.action}</p>
                {l.details && <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{JSON.stringify(l.details)}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>{l.user?.username || 'System'}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDateTime(l.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default Settings;
