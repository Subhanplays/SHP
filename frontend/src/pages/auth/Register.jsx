import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { signInWithPopup } from 'firebase/auth';
import { motion } from 'framer-motion';
import { FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuthStore();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      toast.success('Account created! You received 1000 SHP Coins as a welcome bonus.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      toast.success('Account created! Welcome to SHP.');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Create your account</h2>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Get started with 1000 SHP Coins free!
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <FaUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              className="form-control"
              style={{ paddingLeft: '2.75rem' }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <FaEnvelope style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="form-control"
              style={{ paddingLeft: '2.75rem' }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <FaLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="form-control"
              style={{ paddingLeft: '2.75rem' }}
              required
              minLength={6}
            />
          </div>
        </div>

        <motion.button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '0.875rem' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </motion.button>
      </form>

      <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR CONTINUE WITH</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
      </div>

      <motion.button
        type="button"
        onClick={handleGoogleSignup}
        style={{
          width: '100%',
          padding: '0.875rem',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          transition: 'all var(--transition-fast)',
        }}
        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.98 }}
      >
        <FaGoogle style={{ color: '#ea4335' }} />
        Sign up with Google
      </motion.button>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;