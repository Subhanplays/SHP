import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaServer,
  FaShoppingCart,
  FaBox,
  FaCreditCard,
  FaUser,
  FaBars,
  FaTimes,
  FaCoins,
  FaSignOutAlt,
  FaBell,
  FaCog,
} from 'react-icons/fa';
import useAuthStore from '../store/authStore';

const navItems = [
  { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
  { path: '/servers', icon: FaServer, label: 'My Servers' },
  { path: '/products', icon: FaBox, label: 'Products' },
  { path: '/orders', icon: FaShoppingCart, label: 'Orders' },
  { path: '/billing', icon: FaCreditCard, label: 'Billing' },
  { path: '/profile', icon: FaUser, label: 'Profile' },
];

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, getCoins } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        className="sidebar"
        initial={false}
        animate={{ x: sidebarOpen ? 0 : 0 }}
        style={{
          width: '260px',
          minHeight: '100vh',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--glass-border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(0)',
          '@media (max-width: 768px)': {
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          },
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem',
            }}
          >
            S
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>SHP</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              SubhanHostPanel
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                marginBottom: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                color: location.pathname === item.path ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: location.pathname === item.path ? 'var(--glass-bg)' : 'transparent',
                border: location.pathname === item.path ? '1px solid var(--glass-border)' : 'none',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon
                style={{
                  color: location.pathname === item.path ? 'var(--primary-color)' : 'var(--text-muted)',
                }}
              />
              <span style={{ fontWeight: location.pathname === item.path ? 600 : 400 }}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div
          style={{
            paddingTop: '1rem',
            borderTop: '1px solid var(--glass-border)',
          }}
        >
          {/* Coin Balance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
            }}
          >
            <FaCoins style={{ color: '#fbbf24' }} />
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>
              {getCoins().toLocaleString()} SHP Coins
            </span>
          </div>

          {/* User Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--glass-bg)',
            }}
          >
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=6366f1&color=fff`}
              alt={user?.username}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
              }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                {user?.username}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: '260px',
          minHeight: '100vh',
        }}
      >
        {/* Top Navbar */}
        <header
          style={{
            height: '64px',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--glass-border)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
            className="mobile-menu-toggle"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Page Title */}
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>

          {/* Right Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Notifications */}
            <button
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                padding: '0.625rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <FaBell />
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                }}
              />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main
          style={{
            padding: '2rem',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </main>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%) !important;
          }
          .sidebar.open {
            transform: translateX(0) !important;
          }
          .mobile-menu-toggle {
            display: block !important;
          }
          main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;