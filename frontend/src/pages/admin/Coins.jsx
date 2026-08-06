import { useState, useEffect } from 'react';
import { FaCoins, FaSearch } from 'react-icons/fa';
import { adminAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/format';

const Coins = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50 });
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getCoinTransactions({ limit: 50, page, type: type || undefined, search: search || undefined });
      setTransactions(res.data.data.transactions || []);
      setPagination({ ...(res.data.data.pagination || {}), page });
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [type]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    load(1);
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / (pagination.limit || 50)));

  return (
    <div>
      <PageHeader title="Coins" subtitle={`${pagination.total || 0} total coin transactions`} />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: 240 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by user or description..." className="form-control" style={{ paddingLeft: '2.75rem' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.25rem' }}>Search</button>
        </form>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'signup', 'daily', 'purchase', 'renewal', 'referral', 'topup', 'admin'].map((t) => (
            <button
              key={t || 'all'}
              onClick={() => setType(t)}
              className="btn-outline"
              style={{
                padding: '0.5rem 1.1rem',
                fontSize: '0.8rem',
                background: type === t ? 'var(--primary-color)' : 'transparent',
                color: type === t ? '#fff' : 'var(--text-secondary)',
                borderColor: type === t ? 'var(--primary-color)' : 'var(--glass-border)',
              }}
            >
              {t || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState icon={FaCoins} title="No transactions found" message="Coin transactions will appear here." />
      ) : (
        <>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>User</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '1rem' }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <img src={tx.user?.avatar || `https://ui-avatars.com/api/?name=${tx.user?.username || 'U'}&background=6366f1&color=fff`} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{tx.user?.username || 'System'}</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.description || tx.type}</td>
                      <td style={{ padding: '1rem' }}><Badge status={tx.type}>{tx.type}</Badge></td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatDateTime(tx.createdAt)}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: tx.amount >= 0 ? '#10b981' : '#ef4444' }}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{tx.balance?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={totalPages} onPage={load} />
        </>
      )}
    </div>
  );
};

export default Coins;
