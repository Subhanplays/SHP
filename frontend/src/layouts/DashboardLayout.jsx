import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaServer, FaShoppingCart, FaBox, FaCreditCard, FaUser, FaBars, FaTimes, FaCoins, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import BackgroundLayer from '../components/BackgroundLayer';
import Notifications from '../components/Notifications';

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
  const branding = useSettingsStore((s) => s.branding);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const toggleDarkMode = useSettingsStore((s) => s.toggleDarkMode);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const pageTitle = navItems.find((i) => location.pathname.startsWith(i.path))?.label || 'Dashboard';
  const logo = branding?.logo;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-family)' }}>
      <BackgroundLayer />

      {sidebarOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={sidebarOpen ? 'app-sidebar open' : 'app-sidebar'}
        style={{
          width: 'var(--sidebar-width, 260px)',
          minHeight: '100vh',
          background: 'var(--bg-sidebar, var(--bg-secondary))',
          borderRight: '1px solid var(--glass-border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000,
          transition: 'transform var(--transition-normal)',
        }}
      >
        <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {logo ? (
            <img src={logo} alt={branding?.panelName} style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'contain' }} />
          ) : (
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {(branding?.panelName || 'S').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{branding?.panelName || 'SHP'}</h4>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{branding?.fullName || 'SubhanHostPanel'}</p>
          </div>
        </Link>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.8rem 1rem',
                  marginBottom: '0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--glass-bg)' : 'transparent',
                  border: active ? '1px solid var(--glass-border)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                  fontSize: '0.9rem',
                }}
              >
                <item.icon style={{ color: active ? 'var(--primary-color)' : 'var(--text-muted)' }} />
                <span style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1rem',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
            }}
          >
            <FaCoins style={{ color: '#fbbf24' }} />
            <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.85rem' }}>{getCoins().toLocaleString()} SHP Coins</span>
          </div>

          {isAdmin && (
            <Link
              to="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.7rem',
                marginBottom: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Admin Panel
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)' }}>
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=${(branding?.panelName || 'S').charAt(0) === 'S' ? '6366f1' : '6366f1'}&color=fff`}
              alt={user?.username}
              style={{ width: '36px', height: '36px', borderRadius: '50%' }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{user?.username}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
              title="Sign out"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width, 260px)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: '64px',
            padding: '0 1.5rem',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="mobile-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', cursor: 'pointer' }}
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{pageTitle}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={toggleDarkMode}
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <Notifications />
          </div>
        </header>

        <main style={{ padding: '2rem', flex: 1 }}>{children}</main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .app-sidebar { transform: translateX(-100%); width: 260px !important; }
          .app-sidebar.open { transform: translateX(0); }
          .mobile-menu-toggle { display: block !important; }
          main { margin-left: 0 !important; padding: 1.25rem !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
