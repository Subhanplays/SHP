import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCreditCard, FaServer, FaCoins, FaFileInvoice, FaShoppingCart } from 'react-icons/fa';
import { userAPI, orderAPI, paymentAPI } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '../../utils/format';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCoins, updateCoins } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getOrder(id);
      setOrder(res.data.data);
    } catch (error) {
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handlePayWithCard = async () => {
    setPaying(true);
    try {
      const checkout = await paymentAPI.checkout({ amount: order.totalAmount, orderId: order.id, method: 'stripe', purpose: 'order' });
      const paymentId = checkout.data.data.paymentId;
      await paymentAPI.complete({ paymentId });
      toast.success('Payment completed! Your server is being provisioned.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handlePayWithCoins = async () => {
    if (getCoins() < (order?.items?.[0]?.coinPrice || 0)) {
      toast.error('Insufficient coins. Buy more in Billing.');
      return;
    }
    setPaying(true);
    try {
      const res = await orderAPI.pay(id, { paymentMethod: 'coins' });
      const checkout = await paymentAPI.checkout({ amount: order.totalAmount, orderId: order.id, method: 'coins', purpose: 'order' });
      await paymentAPI.complete({ paymentId: checkout.data.data.paymentId });
      updateCoins(getCoins() - (order?.items?.[0]?.coinPrice || 0));
      toast.success(res.data.message || 'Payment completed!');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderAPI.cancel(id);
      toast.success('Order cancelled');
      setCancelModal(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={FaShoppingCart}
        title="Order not found"
        message="This order does not exist."
        action={<Link to="/orders" className="btn-primary" style={{ textDecoration: 'none' }}>Back to Orders</Link>}
      />
    );
  }

  const items = order.items || [];
  const total = order.totalAmount > 0 ? order.totalAmount : null;

  return (
    <div>
      <Link to="/orders" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <FaArrowLeft /> Back to Orders
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Order #{order.id.slice(0, 8)}</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <Badge status={order.status}>{order.status}</Badge>
      </div>

      {order.status === 'pending' && (
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem', borderColor: 'rgba(245,158,11,0.3)' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Complete your payment</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {order.totalAmount > 0 ? `Amount due: ${formatCurrency(order.totalAmount)}` : ''}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handlePayWithCard} disabled={paying} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaCreditCard /> {paying ? 'Processing...' : 'Pay with Card'}
            </button>
            {order.items?.[0]?.coinPrice > 0 && (
              <button className="btn-outline" onClick={handlePayWithCoins} disabled={paying} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaCoins style={{ color: '#fbbf24' }} /> {paying ? 'Processing...' : `Pay with Coins (${order.items[0].coinPrice.toLocaleString()})`}
              </button>
            )}
            <button className="btn-outline" onClick={() => setCancelModal(true)} style={{ color: '#ef4444' }}>Cancel Order</button>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', fontWeight: 700 }}>Order Items</h3>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaServer style={{ color: 'var(--primary-color)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{item.product?.name}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty {item.quantity} × {item.product?.billingCycle}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {item.price > 0 && <p style={{ margin: 0, fontWeight: 700 }}>{formatCurrency(item.price)}</p>}
                {item.coinPrice > 0 && <p style={{ margin: 0, fontSize: '0.8rem', color: '#fbbf24' }}><FaCoins style={{ marginRight: '0.2rem' }} />{item.coinPrice.toLocaleString()}</p>}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total</span>
            {total ? (
              <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>{formatCurrency(total)}</span>
            ) : (
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fbbf24' }}><FaCoins style={{ marginRight: '0.25rem' }} />{order.coinAmount?.toLocaleString()}</span>
            )}
          </div>
        </motion.div>

        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', fontWeight: 700 }}>Order Details</h3>
          <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.875rem' }}>
            <InfoRow label="Order ID" value={order.id} />
            <InfoRow label="Payment Method" value={order.paymentMethod || '—'} />
            {order.couponCode && <InfoRow label="Coupon" value={order.couponCode} />}
            <InfoRow label="Created" value={formatDateTime(order.createdAt)} />
            <InfoRow label="Updated" value={formatDateTime(order.updatedAt)} />
          </div>

          {order.servers?.length > 0 && (
            <>
              <h4 style={{ margin: '1.5rem 0 0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>Associated Servers</h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {order.servers.map((s) => (
                  <Link key={s.id} to={`/servers/${s.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', textDecoration: 'none', color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</span>
                    <Badge status={s.status}>{s.status}</Badge>
                  </Link>
                ))}
              </div>
            </>
          )}

          {order.invoices?.length > 0 && (
            <>
              <h4 style={{ margin: '1.5rem 0 0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>Invoices</h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {order.invoices.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <FaFileInvoice /> {formatDateTime(inv.createdAt)}
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(inv.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      <ConfirmModal
        show={cancelModal}
        title="Cancel this order?"
        message="This action cannot be undone."
        confirmText={cancelling ? 'Cancelling...' : 'Cancel Order'}
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelModal(false)}
      />
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--glass-border)', gap: '1rem' }}>
    <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
  </div>
);

export default OrderDetail;
