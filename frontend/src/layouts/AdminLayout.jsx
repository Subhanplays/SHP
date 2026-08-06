import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt, FaUsers, FaBox, FaShoppingCart, FaServer, FaCog, FaGamepad, FaBars, FaTimes, FaSignOutAlt, FaCoins, FaMoon, FaSun, FaTags,
} from 'react-icons/fa';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import BackgroundLayer from '../components/BackgroundLayer';
import Notifications from '../components/Notifications';

const navItems = [
  { path: '/admin', icon: FaTachometerAlt, label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: FaUsers, label: 'Users' },
  { path: '/admin/coins', icon: FaCoins, label: 'Coins' },
  { path: '/admin/products', icon: FaBox, label: 'Products' },
  { path: '/admin/coupons', icon: FaTags, label: 'Coupons' },
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
  const branding = useSettingsStore((s) => s.branding);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const toggleDarkMode = useSettingsStore((s) => s.toggleDarkMode);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const pageTitle = navItems.find((i) => (i.exact ? location.pathname === i.path : location.pathname.startsWith(i.path)))?.label || 'Admin';
  const logo = branding?.logo;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-family)' }}>
      <BackgroundLayer />

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={sidebarOpen ? 'app-sidebar open' : 'app-sidebar'}
        style={{
          width: 'var(--sidebar-width, 260px)',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
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
        <Link to="/admin" style={{ textDecoration: 'none', color: 'inherit', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {logo ? (
            <img src={logo} alt={branding?.panelName} style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'contain' }} />
          ) : (
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                color: '#fff',
              }}
            >
              {(branding?.panelName || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{branding?.panelName || 'SHP'} Admin</h4>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Administration Panel</p>
          </div>
        </Link>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const active = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
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
                  color: active ? '#fff' : 'var(--text-secondary)',
                  background: active ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  border: active ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                  fontSize: '0.9rem',
                }}
              >
                <item.icon style={{ color: active ? '#ef4444' : 'var(--text-muted)' }} />
                <span style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.7rem',
              marginBottom: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            View Client Panel
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)' }}>
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=ef4444&color=fff`}
              alt={user?.username}
              style={{ width: '36px', height: '36px', borderRadius: '50%' }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{user?.username}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Administrator</p>
            </div>
            <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
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

export default AdminLayout;
