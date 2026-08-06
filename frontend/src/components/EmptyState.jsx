import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, message, action }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{
      textAlign: 'center',
      padding: '3rem 1.5rem',
      color: 'var(--text-muted)',
    }}
  >
    {Icon && <Icon style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }} />}
    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</h3>
    {message && <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem' }}>{message}</p>}
    {action}
  </motion.div>
);

export default EmptyState;
