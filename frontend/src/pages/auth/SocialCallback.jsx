import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

// Handles the OAuth redirect from the backend: /auth/social?token=...&user=...
const SocialCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get('token');
    const userParam = params.get('user');
    const error = params.get('error');

    if (error) {
      toast.error(decodeURIComponent(error));
      navigate('/login');
      return;
    }

    if (!token) {
      toast.error('Social login failed');
      navigate('/login');
      return;
    }

    let user = null;
    if (userParam) {
      try {
        user = JSON.parse(userParam);
      } catch (e) {
        /* ignore */
      }
    }
    setSession(token, user);

    toast.success('Signed in successfully!');
    navigate('/dashboard', { replace: true });
  }, [params, navigate, setSession]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <LoadingSpinner />
    </div>
  );
};

export default SocialCallback;
