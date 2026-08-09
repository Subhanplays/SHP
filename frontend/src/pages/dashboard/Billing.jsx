import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCoins, FaGift, FaUserFriends, FaLink, FaCopy, FaCheck, FaArrowRight } from 'react-icons/fa';
import { coinAPI, userAPI } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '../../utils/format';

const TABS = ['Coins', 'Transactions', 'Payments'];

const Billing = () => {
  const { user, updateCoins } = useAuthStore();
  const coinsSettings = useSettingsStore((s) => s.coins);
  const [tab, setTab] = useState('Coins');
  const [balance, setBalance] = useState(user?.coins || 0);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [referral, setReferral] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [bal, tx, pay, ref] = await Promise.all([
        coinAPI.getBalance(),
        coinAPI.getTransactions({ limit: 20 }),
        userAPI.getPayments({ limit: 20 }),
        coinAPI.getReferral(),
      ]);
      setBalance(bal.data.data.balance);
      updateCoins(bal.data.data.balance);
      setTransactions(tx.data.data.transactions || []);
      setPayments(pay.data.data.payments || []);
      setReferral(ref.data.data);
    } catch (error) {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDaily = async () => {
    setClaiming(true);
    try {
      const res = await coinAPI.claimDailyReward();
      setBalance(res.data.data.balance);
      updateCoins(res.data.data.balance);
      toast.success(res.data.message || `Claimed ${res.data.data.amount} coins!`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Daily reward unavailable');
    } finally {
      setClaiming(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referral?.referralLink || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <PageHeader title="Billing" subtitle="Manage your SHP Coins, rewards and payment history." />

      {/* Balance banner */}
      <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))', borderColor: 'rgba(251,191,36,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaCoins style={{ color: '#fbbf24', fontSize: '1.75rem' }} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>SHP Coin Balance</p>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{balance.toLocaleString()}</h2>
            </div>
          </div>
          <button className="btn-primary" onClick={handleClaimDaily} disabled={claiming} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaGift /> {claiming ? 'Claiming...' : `Claim Daily Reward${coinsSettings?.dailyReward ? ` (${coinsSettings.dailyReward})` : ''}`}
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn-outline"
            style={{
              padding: '0.6rem 1.5rem',
              fontSize: '0.875rem',
              background: tab === t ? 'var(--primary-color)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
              borderColor: tab === t ? 'var(--primary-color)' : 'var(--glass-border)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {tab === 'Coins' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {/* Referral */}
              <div className="glass-card">
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaUserFriends style={{ color: 'var(--primary-color)' }} /> Referral Program
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Earn {coinsSettings?.referralReward || 500} SHP Coins for every friend who signs up and makes their first purchase.
                </p>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your referral link</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input readOnly value={referral?.referralLink || ''} className="form-control" style={{ fontSize: '0.8rem' }} />
                  <button className="btn-outline" onClick={copyLink} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    {copied ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Referred friends ({referral?.referrals?.length || 0})</p>
                  {referral?.referrals?.length > 0 ? (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {referral.referrals.map((ref) => (
                        <div key={ref.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                          <img src={ref.referred?.avatar || `https://ui-avatars.com/api/?name=${ref.referred?.username || 'U'}`} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{ref.referred?.username}</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDateTime(ref.createdAt)}</p>
                          </div>
                          <Badge status={ref.rewarded ? 'active' : 'pending'}>{ref.rewarded ? 'Rewarded' : 'Pending'}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No referrals yet. Share your link to earn coins!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'Transactions' && (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Description</th>
                      <th style={{ textAlign: 'left', padding: '1rem' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
                      <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>{tx.description || tx.type}</td>
                        <td style={{ padding: '1rem' }}><Badge status={tx.type}>{tx.type}</Badge></td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatDateTime(tx.createdAt)}</td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700, color: tx.amount >= 0 ? '#10b981' : '#ef4444' }}>
                          {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'Payments' && (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Payment</th>
                      <th style={{ textAlign: 'left', padding: '1rem' }}>Method</th>
                      <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
                      <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>Amount</th>
                      <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontWeight: 600 }}>#{p.id.slice(0, 8)}</span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{p.method}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatDateTime(p.createdAt)}</td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(p.amount)}</td>
                        <td style={{ padding: '1rem 1.5rem' }}><Badge status={p.status}>{p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Billing;
