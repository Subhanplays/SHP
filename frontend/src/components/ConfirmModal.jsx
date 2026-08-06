import { Modal, Button } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ConfirmModal = ({ show, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = true, onConfirm, onCancel, loading }) => (
  <Modal show={show} onHide={onCancel} centered backdrop="static">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
      }}
    >
      <Modal.Body style={{ padding: '2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FaExclamationTriangle style={{ color: danger ? '#ef4444' : 'var(--primary-color)', fontSize: '1.5rem' }} />
        </div>
        <h5 style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>{title}</h5>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{message}</p>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid var(--glass-border)', justifyContent: 'center', padding: '1rem' }}>
        <Button
          variant="outline-light"
          onClick={onCancel}
          disabled={loading}
          style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
        >
          {cancelText}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Working...' : confirmText}
        </Button>
      </Modal.Footer>
    </motion.div>
  </Modal>
);

export default ConfirmModal;
