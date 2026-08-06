import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaDiscord, FaLink, FaUnlink, FaCoins, FaCopy, FaCheck, FaGift } from 'react-icons/fa';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import { authAPI, coinAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

const Profile = () => {
  const { user, updateProfile, updateCoins } = useAuthStore();
  const coinsSettings = useSettingsStore((s) => s.coins);
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [discordModal, setDiscordModal] = useState(false);
  const [unlinkModal, setUnlinkModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referral, setReferral] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({ username, avatar });
      if (res.success) {
        toast.success('Profile updated');
        setUsername(res.user?.username || username);
        setAvatar(res.user?.avatar || avatar);
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscordLink = async () => {
    setDiscordModal(false);
    try {
      const res = await authAPI.getDiscordUrl();
      window.location.href = res.url;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Discord login not configured');
    }
  };

  const handleUnlink = async () => {
    setUnlinkModal(false);
    try {
      await authAPI.unlinkDiscord();
      toast.success('Discord account unlinked');
      updateProfile({ username });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to unlink Discord');
    }
  };

  const loadReferral = async () => {
    try {
      const res = await coinAPI.getReferral();
      setReferral(res.data.data);
    } catch (e) { /* ignore */ }
  };

  const handleClaimDaily = async () => {
    setClaiming(true);
    try {
      const res = await coinAPI.claimDailyReward();
      updateCoins(res.data.data.balance);
      toast.success(res.data.message || `Claimed ${res.data.data.amount} coins!`);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Daily reward unavailable');
    } finally {
      setClaiming(false);
    }
  };

  const copyCode = () => {
    if (!referral) loadReferral().then(() => {});
    navigator.clipboard.writeText(referral?.referralCode || user?.referralCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account details and linked accounts." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Account form */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaUser style={{ color: 'var(--primary-color)' }} /> Account Information
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <img
              src={avatar || `https://ui-avatars.com/api/?name=${username || 'User'}&background=6366f1&color=fff`}
              alt="Avatar"
              style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid var(--primary-color)' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{user?.username}</p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user?.email}</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Member since {formatDate(user?.createdAt)}</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="form-control" required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Avatar URL</label>
              <input type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} className="form-control" placeholder="https://..." />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                <FaEnvelope style={{ marginRight: '0.35rem', color: 'var(--text-muted)' }} />Email
              </label>
              <input type="email" value={user?.email || ''} className="form-control" disabled style={{ opacity: 0.6 }} />
            </div>
            <motion.button type="submit" className="btn-primary" style={{ width: '100%' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </form>
        </motion.div>

        {/* Wallet & links */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaCoins style={{ color: '#fbbf24' }} /> SHP Coins
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{(user?.coins || 0).toLocaleString()}</p>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Available balance</p>
              </div>
              <button className="btn-outline" onClick={handleClaimDaily} disabled={claiming} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaGift style={{ color: '#fbbf24' }} /> {claiming ? 'Claiming...' : 'Daily Reward'}
              </button>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your referral code</p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <code style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                  {referral?.referralCode || user?.referralCode || '—'}
                </code>
                <button className="btn-outline" onClick={copyCode} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                  {copied ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Earn {coinsSettings?.referralReward || 500} coins per referred friend's first purchase.
              </p>
            </div>
          </motion.div>

          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaDiscord style={{ color: '#5865F2' }} /> Linked Accounts
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <FaDiscord style={{ color: '#5865F2', fontSize: '1.25rem' }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Discord</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {user?.discordId ? `Linked (${user.discordId.slice(0, 8)}...)` : 'Not linked'}
                </p>
              </div>
              {user?.discordId ? (
                <button className="btn-outline" onClick={() => setUnlinkModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#ef4444' }}>
                  <FaUnlink /> Unlink
                </button>
              ) : (
                <button className="btn-outline" onClick={() => setDiscordModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <FaLink /> Link
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ConfirmModal
        show={discordModal}
        title="Link Discord account"
        message="You will be redirected to Discord to authorize the connection."
        confirmText="Continue"
        danger={false}
        onConfirm={handleDiscordLink}
        onCancel={() => setDiscordModal(false)}
      />
      <ConfirmModal
        show={unlinkModal}
        title="Unlink Discord account?"
        message="You can link it again later. Your account will still work with your email."
        confirmText="Unlink"
        onConfirm={handleUnlink}
        onCancel={() => setUnlinkModal(false)}
      />
    </div>
  );
};

export default Profile;
