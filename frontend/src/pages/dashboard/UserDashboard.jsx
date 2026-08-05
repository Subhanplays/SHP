import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaServer,
  FaShoppingCart,
  FaCreditCard,
  FaCoins,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';
import { userAPI } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <motion.div
    className="glass-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      padding: '1.5rem',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    }}
  >
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-sm)',
        background: `${color}20`,
        border: `1px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon style={{ color, fontSize: '1.25rem' }} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</p>
      <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>{value}</h3>
    </div>
    {trend && (
      <div style={{ color: trend > 0 ? '#10b981' : '#ef4444' }}>
        {trend > 0 ? <FaArrowUp /> : <FaArrowDown />}
      </div>
    )}
  </motion.div>
);

const UserDashboard = () => {
  const { user, getCoins } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await userAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Message */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
          Welcome back, <span className="gradient-text">{user?.username}</span>!
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>
          Here's what's happening with your services today.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          icon={FaServer}
          label="Active Servers"
          value={dashboardData?.activeServers || 0}
          color="#6366f1"
        />
        <StatCard
          icon={FaCoins}
          label="SHP Coins"
          value={getCoins().toLocaleString()}
          color="#fbbf24"
        />
        <StatCard
          icon={FaShoppingCart}
          label="Pending Orders"
          value={dashboardData?.pendingOrders || 0}
          color="#f59e0b"
        />
        <StatCard
          icon={FaCreditCard}
          label="Total Spent"
          value={`$${(dashboardData?.totalSpent || 0).toFixed(2)}`}
          color="#10b981"
        />
      </div>

      {/* Recent Activity & Expiring Servers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Recent Orders */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Recent Orders</h3>
            <Link to="/orders" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.875rem' }}>
              View All
            </Link>
          </div>

          {dashboardData?.recentOrders?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dashboardData.recentOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'var(--glass-bg)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      background: order.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {order.status === 'completed' ? (
                      <FaCheckCircle style={{ color: '#10b981' }} />
                    ) : (
                      <FaClock style={{ color: '#f59e0b' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>
                      {order.items?.[0]?.product?.name || 'Order'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ${order.totalAmount} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`status-badge status-${order.status}`}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <FaShoppingCart style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
              <p>No recent orders</p>
              <Link to="/products" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                Browse Products
              </Link>
            </div>
          )}
        </div>

        {/* Expiring Servers */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              <FaExclamationCircle style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
              Expiring Soon
            </h3>
            <Link to="/servers" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.875rem' }}>
              View All
            </Link>
          </div>

          {dashboardData?.expiringServers > 0 ? (
            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <p style={{ margin: 0, color: '#f59e0b', fontWeight: 600 }}>
                {dashboardData.expiringServers} server(s) expiring in the next 7 days
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Renew now to avoid service interruption.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <FaCheckCircle style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5, color: '#10b981' }} />
              <p>No servers expiring soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;