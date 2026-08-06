import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaCoins, FaCreditCard } from 'react-icons/fa';
import { adminAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '../../utils/format';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getOrders({ limit: 20, page, status: status || undefined });
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1 });
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  return (
    <div>
      <PageHeader title="Orders" subtitle="All customer orders." />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['', 'pending', 'completed', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className="btn-outline"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              background: status === s ? 'var(--primary-color)' : 'transparent',
              color: status === s ? '#fff' : 'var(--text-secondary)',
              borderColor: status === s ? 'var(--primary-color)' : 'var(--glass-border)',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={FaShoppingCart} title="No orders found" message="Orders will appear here when customers place them." />
      ) : (
        <>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Order</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Total</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Method</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ fontWeight: 600 }}>#{o.id.slice(0, 8)}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>{o.user?.username}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.user?.email}</p>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{o.items?.map((i) => i.product?.name).join(', ') || '—'}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>
                        {o.totalAmount > 0 ? formatCurrency(o.totalAmount) : (
                          <span style={{ color: '#fbbf24' }}><FaCoins style={{ marginRight: '0.25rem' }} />{o.coinAmount?.toLocaleString()}</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {o.paymentMethod === 'coins' ? <FaCoins style={{ color: '#fbbf24' }} /> : <FaCreditCard />} {o.paymentMethod || '—'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatDateTime(o.createdAt)}</td>
                      <td style={{ padding: '1rem 1.5rem' }}><Badge status={o.status}>{o.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPage={load} />
        </>
      )}
    </div>
  );
};

export default Orders;
