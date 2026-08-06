import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaGoogle, FaDiscord } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../api/axios';

const SocialButton = ({ provider }) => {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const res = provider === 'google' ? await authAPI.getGoogleUrl() : await authAPI.getDiscordUrl();
      window.location.href = res.url;
    } catch (error) {
      toast.error(error.response?.data?.message || `${provider} login not configured`);
      setLoading(false);
    }
  };
  const Icon = provider === 'google' ? FaGoogle : FaDiscord;
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.875rem',
        transition: 'all var(--transition-fast)',
      }}
    >
      <Icon /> {loading ? 'Redirecting...' : provider === 'google' ? 'Google' : 'Discord'}
    </button>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
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
              placeholder="Enter your password"
              className="form-control"
              style={{ paddingLeft: '2.75rem' }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" style={{ accentColor: 'var(--primary-color)' }} />
            Remember me
          </label>
          <Link to="/forgot-password" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.875rem' }}>
            Forgot password?
          </Link>
        </div>

        <motion.button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '0.875rem' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </motion.button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <SocialButton provider="google" />
        <SocialButton provider="discord" />
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;
