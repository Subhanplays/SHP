import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaServer, FaPlay, FaStop, FaRedo, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import { userAPI, serverAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { formatDate, daysLeft } from '../../utils/format';

const Servers = () => {
  const { refreshProfile } = useAuthStore();
  const [servers, setServers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await userAPI.getServers({ limit: 20, page });
      setServers(res.data.data.servers || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1 });
    } catch (error) {
      toast.error('Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRenew = async (server) => {
    setRenewing(server.id);
    try {
      const renewRes = await serverAPI.renew(server.id, { paymentMethod: 'coins' });
      await refreshProfile();
      toast.success(renewRes.data.message || 'Server renewed successfully');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to renew server');
    } finally {
      setRenewing(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Servers"
        subtitle="Manage your game servers."
        actions={
          <Link to="/products" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlus /> New Server
          </Link>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : servers.length === 0 ? (
        <EmptyState
          icon={FaServer}
          title="No servers yet"
          message="Order your first server to get started."
          action={
            <Link to="/products" className="btn-primary" style={{ textDecoration: 'none' }}>
              Browse Products
            </Link>
          }
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {servers.map((server) => {
              const d = daysLeft(server.expiresAt);
              return (
                <div key={server.id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaServer style={{ color: 'var(--primary-color)' }} />
                      </div>
                      <div>
                        <Link to={`/servers/${server.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>
                          {server.name}
                        </Link>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expires {formatDate(server.expiresAt)}</p>
                      </div>
                    </div>
                    <Badge status={server.status}>{server.status}</Badge>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    <span>{server.ram} MB</span>
                    <span>{server.cpu}% CPU</span>
                    <span>{server.disk} MB</span>
                  </div>

                  {d !== null && d <= 7 && server.status === 'running' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: '0.8rem' }}>
                      <FaExclamationTriangle /> Expires in {d} day{d === 1 ? '' : 's'}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <Link to={`/servers/${server.id}`} className="btn-outline" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', padding: '0.6rem', fontSize: '0.85rem' }}>
                      Manage
                    </Link>
                    <button
                      className="btn-outline"
                      onClick={() => handleRenew(server)}
                      disabled={renewing === server.id}
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                      title="Renew with coins"
                    >
                      {renewing === server.id ? '...' : 'Renew'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPage={load} />
        </>
      )}
    </div>
  );
};

export default Servers;
