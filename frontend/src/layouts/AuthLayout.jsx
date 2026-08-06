import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSettingsStore from '../store/settingsStore';
import BackgroundLayer from '../components/BackgroundLayer';

const AuthLayout = ({ children }) => {
  const branding = useSettingsStore((s) => s.branding);
  const logo = branding?.logo;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-family)',
      }}
    >
      <BackgroundLayer />

      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem',
          position: 'relative',
          zIndex: 1,
          background: 'var(--bg-card, var(--glass-bg))',
          backdropFilter: 'blur(var(--glass-blur))',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {logo ? (
              <img src={logo} alt={branding?.panelName} style={{ width: '64px', height: '64px', margin: '0 auto 1rem', borderRadius: '16px', objectFit: 'contain' }} />
            ) : (
              <motion.div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 1rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.75rem',
                  color: '#fff',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {(branding?.panelName || 'S').charAt(0).toUpperCase()}
              </motion.div>
            )}
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
              <span className="gradient-text">{branding?.panelName || 'SHP'}</span>
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {branding?.fullName || 'SubhanHostPanel'}
            </p>
          </div>
        </Link>

        {children}

        <div style={{ marginTop: '2rem', textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {branding?.footerText || `© ${new Date().getFullYear()} ${branding?.fullName || 'SubhanHostPanel'}. All rights reserved.`}
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
