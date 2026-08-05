import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout = ({ children }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background */}
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

      {/* Floating Orbs */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          right: '20%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Card */}
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
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <motion.div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.75rem',
              color: 'white',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            S
          </motion.div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
            <span className="gradient-text">SHP</span>
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            SubhanHostPanel
          </p>
        </div>

        {/* Content */}
        {children}

        {/* Footer Links */}
        <div
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--glass-border)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © 2024 SubhanHostPanel. All rights reserved.
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