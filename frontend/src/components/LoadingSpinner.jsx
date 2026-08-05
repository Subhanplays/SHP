import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 40, color = 'var(--primary-color)' }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <motion.div
        style={{
          width: size,
          height: size,
          border: `3px solid ${color}30`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default LoadingSpinner;