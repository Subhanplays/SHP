import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaServer, FaDatabase, FaArchive, FaCoins, FaCreditCard, FaTag, FaCheck, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import { productAPI, orderAPI, paymentAPI, couponAPI } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCoins, refreshProfile } = useAuthStore();
  const coinsSettings = useSettingsStore((s) => s.coins);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('coins');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    productAPI.getById(id)
      .then((res) => setProduct(res.data.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h3>Product not found</h3>
        <Link to="/products" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          Back to Products
        </Link>
      </div>
    );
  }

  const discountedPrice = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? product.price * (1 - appliedCoupon.value / 100)
      : Math.max(0, product.price - appliedCoupon.value)
    : product.price;

  const coinRate = coinsSettings?.coinRate || 100;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponAPI.validate({ code: couponCode.trim(), productId: product.id });
      setAppliedCoupon(res.data.data);
      toast.success('Coupon applied!');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleOrder = async () => {
    setOrdering(true);
    try {
      const res = await orderAPI.create({
        productId: product.id,
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
      });
      const order = res.data.data;

      if (paymentMethod === 'coins') {
        await refreshProfile();
        if (res.data.provisionResult?.provisioned) {
          toast.success('Order placed! Your server is being provisioned.');
        } else {
          toast.error(res.data.provisionResult?.reason || 'Order placed but server creation failed. Please contact support.');
        }
        navigate('/orders/' + order.id);
        return;
      }

      // Card / Stripe flow
      toast.success('Order created. Proceeding to checkout...');
      navigate('/orders/' + order.id);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create order');
    } finally {
      setOrdering(false);
    }
  };

  const specRow = (icon, label, value) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid var(--glass-border)' }}>
      {icon}
      <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{value}</span>
    </div>
  );

  return (
    <div>
      <Link to="/products" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <FaArrowLeft /> Back to Products
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Product info */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaServer style={{ color: '#fff', fontSize: '1.5rem' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{product.name}</h1>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{product.category} hosting</p>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{product.description}</p>

          <div>
            {specRow(<FaServer style={{ color: 'var(--primary-color)' }} />, 'CPU', `${product.cpu}%`)}
            {specRow(<FaDatabase style={{ color: 'var(--primary-color)' }} />, 'Memory (RAM)', `${product.ram} MB`)}
            {specRow(<FaArchive style={{ color: 'var(--primary-color)' }} />, 'Disk Space', `${product.disk} MB`)}
            {specRow(<FaDatabase style={{ color: 'var(--primary-color)' }} />, 'Databases', `${product.databases || 0}`)}
            {specRow(<FaArchive style={{ color: 'var(--primary-color)' }} />, 'Backups', `${product.backups || 0}`)}
            {specRow(<FaCheck style={{ color: 'var(--primary-color)' }} />, 'Billing Cycle', product.billingCycle)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <FaInfoCircle style={{ color: 'var(--primary-color)' }} />
            Servers are provisioned automatically after payment.
          </div>
        </motion.div>

        {/* Order form */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ margin: 0, marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Order Summary</h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Plan price</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                {formatCurrency(discountedPrice)}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{product.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
              </p>
            </div>
            {coinsSettings?.enabled && product.coinPrice > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>or pay with</p>
                <p style={{ margin: 0, color: '#fbbf24', fontWeight: 700 }}>
                  <FaCoins style={{ marginRight: '0.25rem' }} />{product.coinPrice.toLocaleString()} coins
                </p>
              </div>
            )}
          </div>

          {/* Coupon */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              <FaTag style={{ marginRight: '0.35rem', color: 'var(--text-muted)' }} />Coupon Code
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon (e.g. SAVE10)"
                className="form-control"
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button className="btn-outline" onClick={() => setAppliedCoupon(null)} style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                  Remove
                </button>
              ) : (
                <button className="btn-outline" onClick={handleApplyCoupon} disabled={couponLoading} style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                  {couponLoading ? '...' : 'Apply'}
                </button>
              )}
            </div>
            {appliedCoupon && (
              <p style={{ margin: '0.5rem 0 0', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}%` : `${formatCurrency(appliedCoupon.value)}`} off applied!
              </p>
            )}
          </div>

          {/* Payment method */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {coinsSettings?.enabled && (
                <button
                  onClick={() => setPaymentMethod('coins')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${paymentMethod === 'coins' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                    background: paymentMethod === 'coins' ? 'rgba(251,191,36,0.1)' : 'var(--glass-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <FaCoins style={{ color: '#fbbf24', fontSize: '1.25rem', marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>SHP Coins</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getCoins().toLocaleString()} available</p>
                </button>
              )}
              <button
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${paymentMethod === 'card' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                  background: paymentMethod === 'card' ? 'rgba(99,102,241,0.1)' : 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <FaCreditCard style={{ color: 'var(--primary-color)', fontSize: '1.25rem', marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Credit Card</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure checkout</p>
              </button>
            </div>
          </div>

          {paymentMethod === 'coins' && getCoins() < product.coinPrice && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.85rem' }}>
              Not enough coins. <Link to="/billing" style={{ color: '#ef4444', fontWeight: 700 }}>Buy more coins</Link> or pay with card.
            </div>
          )}

          <motion.button
            className="btn-primary"
            style={{ width: '100%', padding: '0.9rem' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={ordering}
            onClick={handleOrder}
          >
            {ordering ? 'Placing order...' : `Order Now • ${formatCurrency(discountedPrice)}`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
