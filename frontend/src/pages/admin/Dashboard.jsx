import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaDollarSign, FaCoins, FaServer, FaShoppingCart, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { adminAPI, userAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime, timeAgo } from '../../utils/format';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [dashRes, ordersRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getOrders({ limit: 8 }),
      ]);
      setStats(dashRes.data.data);
      setRecentOrders(ordersRes.data.data.orders || []);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Overview of your hosting business." />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard icon={FaUsers} label="Total Users" value={(stats?.totalUsers || 0).toLocaleString()} color="#6366f1" sub="Registered accounts" />
            <StatCard icon={FaDollarSign} label="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} color="#10b981" sub="All time" />
            <StatCard icon={FaCoins} label="Coins Created" value={(stats?.totalCoinsCreated || 0).toLocaleString()} color="#fbbf24" sub={`${(stats?.totalCoinsSpent || 0).toLocaleString()} spent`} />
            <StatCard icon={FaServer} label="Total Servers" value={(stats?.totalServers || 0).toLocaleString()} color="#8b5cf6" sub={`${stats?.activeServers || 0} active · ${stats?.suspendedServers || 0} suspended`} />
            <StatCard icon={FaShoppingCart} label="Total Orders" value={(stats?.totalOrders || 0).toLocaleString()} color="#06b6d4" sub="All time" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Recent Orders</h3>
                <Link to="/admin/orders" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.85rem' }}>View All</Link>
              </div>
              {recentOrders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No orders yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {recentOrders.map((o) => (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.items?.[0]?.product?.name || 'Order'} <span style={{ color: 'var(--text-muted)' }}>by {o.user?.username}</span>
                        </p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(o.createdAt)} · {o.totalAmount > 0 ? formatCurrency(o.totalAmount) : `${o.coinAmount?.toLocaleString()} coins`}</p>
                      </div>
                      <Badge status={o.status}>{o.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card">
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700 }}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <QuickLink to="/admin/users" icon={FaUsers} color="#6366f1" label="Manage Users" />
                <QuickLink to="/admin/products" icon={FaShoppingCart} color="#10b981" label="Add Product" />
                <QuickLink to="/admin/orders" icon={FaCheckCircle} color="#06b6d4" label="View Orders" />
                <QuickLink to="/admin/settings" icon={FaServer} color="#8b5cf6" label="Panel Settings" />
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaExclamationCircle style={{ color: '#f59e0b' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Coin economy: <strong style={{ color: '#fbbf24' }}>{stats?.totalCoinsCreated?.toLocaleString()}</strong> created vs{' '}
                  <strong style={{ color: '#ef4444' }}>{stats?.totalCoinsSpent?.toLocaleString()}</strong> spent.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const QuickLink = ({ to, icon: Icon, color, label }) => (
  <Link to={to} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', padding: '1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', textDecoration: 'none', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}>
    <Icon style={{ color, fontSize: '1.5rem' }} />
    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
  </Link>
);

export default AdminDashboard;
