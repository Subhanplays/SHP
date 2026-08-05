import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaHome,
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaServer,
  FaCog,
  FaBars,
  FaTimes,
  FaCoins,
  FaSignOutAlt,
  FaTachometerAlt,
  FaGamepad,
} from 'react-icons/fa';
import useAuthStore from '../store/authStore';

const navItems = [
  { path: '/admin', icon: FaTachometerAlt, label: 'Dashboard' },
  { path: '/admin/users', icon: FaUsers, label: 'Users' },
  { path: '/admin/products', icon: FaBox, label: 'Products' },
  { path: '/admin/orders', icon: FaShoppingCart, label: 'Orders' },
  { path: '/admin/servers', icon: FaServer, label: 'Servers' },
  { path: '/admin/pterodactyl', icon: FaGamepad, label: 'Pterodactyl' },
  { path: '/admin/settings', icon: FaCog, label: 'Settings' },
];

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
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
        style={{
          width: '260px',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
          borderRight: '1px solid var(--glass-border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem',
            }}
          >
            A
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>SHP Admin</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Administration Panel
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
                color: location.pathname === item.path ? '#fff' : 'var(--text-secondary)',
                background: location.pathname === item.path ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                border: location.pathname === item.path ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon
                style={{
                  color: location.pathname === item.path ? '#ef4444' : 'var(--text-muted)',
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
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=ef4444&color=fff`}
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
                Administrator
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
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            {navItems.find((item) => item.path === location.pathname)?.label || 'Admin Dashboard'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}></div>
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

      <style>{`
        @media (max-width: 768px) {
          aside {
            transform: translateX(-100%) !important;
          }
          aside.open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;