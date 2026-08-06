import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color, sub, onClick }) => (
  <motion.div
    className="glass-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      padding: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      cursor: onClick ? 'pointer' : 'default',
    }}
    whileHover={{ y: -4 }}
    onClick={onClick}
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
        flexShrink: 0,
      }}
    >
      <Icon style={{ color, fontSize: '1.25rem' }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</p>
      <h3 style={{ margin: '0.1rem 0 0', fontSize: '1.35rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </h3>
      {sub && <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  </motion.div>
);

export default StatCard;
