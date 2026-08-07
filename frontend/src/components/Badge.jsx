const statusColors = {
  running: '#10b981',
  active: '#10b981',
  completed: '#10b981',
  paid: '#10b981',
  online: '#10b981',
  success: '#10b981',
  suspended: '#f59e0b',
  expired: '#ef4444',
  failed: '#ef4444',
  deleted: '#6b6b7b',
  cancelled: '#6b6b7b',
  pending: '#3b82f6',
  installing: '#3b82f6',
  processing: '#3b82f6',
  offline: '#6b6b7b',
  stopped: '#6b6b7b',
  starting: '#3b82f6',
  stopping: '#3b82f6',
  error: '#ef4444',
  admin: '#ef4444',
  superadmin: '#ef4444',
  user: '#3b82f6',
  coins: '#fbbf24',
  percent: '#8b5cf6',
  fixed: '#06b6d4',
  stripe: '#8b5cf6',
  paypal: '#06b6d4',
  crypto: '#fbbf24',
};

const Badge = ({ status, children }) => {
  const color = statusColors[String(status).toLowerCase()] || '#a0a0b0';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.7rem',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {children || status}
    </span>
  );
};

export default Badge;
