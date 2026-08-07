import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaUser, FaGoogle, FaDiscord } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
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

const Register = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const register = useAuthStore((state) => state.register);
  const coins = useSettingsStore((state) => state.coins);
  const signupReward = coins?.signupReward || 1000;
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    referralCode: params.get('ref') || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await register(formData.username, formData.email, formData.password, formData.referralCode);
      if (result.success) {
        toast.success(`Account created! You received ${signupReward} SHP Coins as a welcome bonus.`);
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
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Create your account</h2>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Get started with {signupReward.toLocaleString()} SHP Coins free!
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

        <div style={{ marginBottom: '1rem' }}>
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

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Referral Code <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <FaUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="Enter referral code if you have one"
              className="form-control"
              style={{ paddingLeft: '2.75rem' }}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>or sign up with</span>
        <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <SocialButton provider="google" />
        <SocialButton provider="discord" />
      </div>

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
