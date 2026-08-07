import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaCoins, FaCreditCard } from 'react-icons/fa';
import { userAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '../../utils/format';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await userAPI.getOrders({ limit: 20, page });
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
  }, []);

  return (
    <div>
      <PageHeader title="My Orders" subtitle="Track the status of your orders." />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={FaShoppingCart}
          title="No orders yet"
          message="Place your first order to get started."
          action={
            <Link to="/products" className="btn-primary" style={{ textDecoration: 'none' }}>
              Browse Products
            </Link>
          }
        />
      ) : (
        <>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Order</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Total</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Method</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <Link to={`/orders/${order.id}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
                          #{order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {order.items?.map((i) => i.product?.name).join(', ') || '—'}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>
                        {order.totalAmount > 0 ? formatCurrency(order.totalAmount) : (
                          <span style={{ color: '#fbbf24' }}><FaCoins style={{ marginRight: '0.25rem' }} />{order.coinAmount?.toLocaleString()}</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {order.paymentMethod === 'coins' ? <FaCoins style={{ color: '#fbbf24' }} /> : <FaCreditCard />} {order.paymentMethod || '—'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatDateTime(order.createdAt)}</td>
                      <td style={{ padding: '1rem 1.5rem' }}><Badge status={order.status}>{order.status}</Badge></td>
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
