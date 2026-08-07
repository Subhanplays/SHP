import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCoins, FaServer, FaShoppingCart, FaUser } from 'react-icons/fa';
import { adminAPI } from '../../api/axios';
import Badge from '../../components/Badge';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '../../utils/format';

const UserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('user');
  const [coinAmount, setCoinAmount] = useState(100);
  const [coinReason, setCoinReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUser(id);
      setUser(res.data.data);
      setUsername(res.data.data.username);
      setRole(res.data.data.role);
    } catch (error) {
      toast.error('User not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateUser(id, { username, role });
      toast.success('User updated');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGiveCoins = async () => {
    if (!coinAmount) return;
    setSaving(true);
    try {
      const res = await adminAPI.giveCoins(id, { amount: parseInt(coinAmount), reason: coinReason });
      toast.success(res.data.message || 'Coins updated');
      setCoinAmount(100);
      setCoinReason('');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to update coins');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h3>User not found</h3>
        <Link to="/admin/users" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>Back to Users</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/users" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <FaArrowLeft /> Back to Users
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff`} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--primary-color)' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{user.username}</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user.email} · Joined {formatDateTime(user.createdAt)}</p>
        </div>
        <Badge status={user.role}>{user.role}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Edit user */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaUser style={{ color: 'var(--primary-color)' }} /> Edit User
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="form-control" />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="form-control">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <motion.button className="btn-primary" style={{ width: '100%' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </motion.div>

        {/* Coins */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCoins style={{ color: '#fbbf24' }} /> Coin Balance
          </h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{user.coins?.toLocaleString()}</p>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Adjust balance (positive adds, negative deducts)</p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Amount</label>
            <input type="number" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} className="form-control" />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Reason</label>
            <input value={coinReason} onChange={(e) => setCoinReason(e.target.value)} className="form-control" placeholder="e.g. Support refund" />
          </div>
          <motion.button className="btn-primary" style={{ width: '100%' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGiveCoins} disabled={saving || !coinAmount}>
            {saving ? 'Updating...' : 'Apply Coins'}
          </motion.button>
        </motion.div>
      </div>

      {/* Servers */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaServer style={{ color: 'var(--primary-color)' }} /> Servers
        </h3>
        {user.servers?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No servers.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {user.servers.map((s) => (
              <Link key={s.id} to={`/admin/servers`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', textDecoration: 'none', color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.ram} MB · {s.cpu}%</span>
                  <Badge status={s.status}>{s.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Orders */}
        <div className="glass-card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaShoppingCart style={{ color: 'var(--primary-color)' }} /> Recent Orders
          </h3>
          {user.orders?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No orders.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {user.orders.map((o) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{o.items?.[0]?.product?.name || 'Order'}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDateTime(o.createdAt)} · {o.totalAmount > 0 ? formatCurrency(o.totalAmount) : `${o.coinAmount?.toLocaleString()} coins`}</p>
                  </div>
                  <Badge status={o.status}>{o.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coin transactions */}
        <div className="glass-card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCoins style={{ color: '#fbbf24' }} /> Coin History
          </h3>
          {user.coinTransactions?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No coin transactions.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {user.coinTransactions.map((tx) => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{tx.description || tx.type}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDateTime(tx.createdAt)}</p>
                  </div>
                  <span style={{ fontWeight: 700, color: tx.amount >= 0 ? '#10b981' : '#ef4444' }}>
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
