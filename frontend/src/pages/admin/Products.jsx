import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBox, FaPlus, FaEdit, FaTrash, FaCoins, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { adminAPI, productAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getProducts({ limit: 100 });
      setProducts(res.data.data.products || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (p) => {
    try {
      await adminAPI.updateProduct(p.id, { enabled: !p.enabled });
      toast.success(`${p.name} ${p.enabled ? 'disabled' : 'enabled'}`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminAPI.deleteProduct(deleteTarget.id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your hosting plans."
        actions={
          <Link to="/admin/products/new" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus /> New Product
          </Link>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={FaBox}
          title="No products yet"
          message="Create your first hosting product to start selling."
          action={<Link to="/admin/products/new" className="btn-primary" style={{ textDecoration: 'none' }}>Create Product</Link>}
        />
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Product</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Resources</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Price</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Coins</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.billingCycle}</p>
                    </td>
                    <td style={{ padding: '1rem' }}><Badge status={p.category}>{p.category}</Badge></td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {p.ram} MB · {p.cpu}% · {p.disk} MB
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>{formatCurrency(p.price)}</td>
                    <td style={{ padding: '1rem', color: '#fbbf24', fontWeight: 600 }}>{p.coinPrice?.toLocaleString()}</td>
                    <td style={{ padding: '1rem' }}><Badge status={p.enabled ? 'active' : 'deleted'}>{p.enabled ? 'Enabled' : 'Disabled'}</Badge></td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <Link to={`/admin/products/${p.id}`} className="btn-outline" style={{ textDecoration: 'none', padding: '0.5rem 0.9rem', fontSize: '0.8rem' }} title="Edit">
                          <FaEdit />
                        </Link>
                        <button className="btn-outline" onClick={() => handleToggle(p)} style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }} title={p.enabled ? 'Disable' : 'Enable'}>
                          {p.enabled ? <FaToggleOn style={{ color: '#10b981' }} /> : <FaToggleOff style={{ color: 'var(--text-muted)' }} />}
                        </button>
                        <button className="btn-outline" onClick={() => setDeleteTarget(p)} style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', color: '#ef4444' }} title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete this product?"
        message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Products;
