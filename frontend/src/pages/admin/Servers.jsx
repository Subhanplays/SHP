import { useState, useEffect } from 'react';
import { FaServer, FaPlay, FaPause, FaTrash, FaRedo } from 'react-icons/fa';
import { adminAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/format';

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState(null);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getServers({ limit: 20, page, status: status || undefined });
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
  }, [status]);

  const performAction = async () => {
    if (!actionTarget || !action) return;
    setBusy(true);
    try {
      let res;
      switch (action) {
        case 'suspend': res = await adminAPI.suspendServer(actionTarget.id); break;
        case 'unsuspend': res = await adminAPI.unsuspendServer(actionTarget.id); break;
        case 'delete': res = await adminAPI.deleteServer(actionTarget.id); break;
        case 'provision': res = await adminAPI.retryProvision(actionTarget.id); break;
      }
      toast.success(res?.data?.message || 'Action completed');
      setActionTarget(null);
      setAction(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = (server, type) => {
    setActionTarget(server);
    setAction(type);
  };

  const modalContent = {
    suspend: { title: 'Suspend this server?', message: `${actionTarget?.name} will be suspended and the user loses access.`, confirm: 'Suspend' },
    unsuspend: { title: 'Unsuspend this server?', message: `${actionTarget?.name} will be re-enabled.`, confirm: 'Unsuspend', danger: false },
    delete: { title: 'Delete this server?', message: `${actionTarget?.name} will be soft-deleted. This can be undone by an admin.`, confirm: 'Delete' },
    provision: { title: 'Retry provisioning?', message: `${actionTarget?.name} will be re-provisioned on the Pterodactyl panel.`, confirm: 'Provision', danger: false },
  }[action] || {};

  return (
    <div>
      <PageHeader title="Servers" subtitle="Manage all servers across your panel." />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['', 'pending', 'running', 'suspended', 'expired', 'failed', 'deleted'].map((s) => (
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
      ) : servers.length === 0 ? (
        <EmptyState icon={FaServer} title="No servers found" message="Servers will appear here once customers place orders." />
      ) : (
        <>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Server</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Owner</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Resources</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Panel</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Expires</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {servers.map((s) => (
                    <tr key={s.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>{s.name}</p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.pteroId ? `Ptero #${s.pteroId}` : 'No Ptero ID'}</p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>{s.user?.username}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.user?.email}</p>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {s.ram} MB · {s.cpu}% · {s.disk} MB
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {s.pteroPanelId ? `Panel #${s.pteroPanelId}` : '—'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatDateTime(s.expiresAt)}</td>
                      <td style={{ padding: '1rem' }}><Badge status={s.status}>{s.status}</Badge></td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          {s.status === 'failed' && (
                            <button className="btn-outline" onClick={() => confirmAction(s, 'provision')} style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem' }} title="Retry provisioning">
                              <FaRedo style={{ color: '#f59e0b' }} />
                            </button>
                          )}
                          {s.status === 'suspended' ? (
                            <button className="btn-outline" onClick={() => confirmAction(s, 'unsuspend')} style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem' }} title="Unsuspend">
                              <FaPlay style={{ color: '#10b981' }} />
                            </button>
                          ) : s.status !== 'deleted' && (
                            <button className="btn-outline" onClick={() => confirmAction(s, 'suspend')} style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem' }} title="Suspend">
                              <FaPause style={{ color: '#f59e0b' }} />
                            </button>
                          )}
                          {s.status !== 'deleted' && (
                            <button className="btn-outline" onClick={() => confirmAction(s, 'delete')} style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem', color: '#ef4444' }} title="Delete">
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPage={load} />
        </>
      )}

      <ConfirmModal
        show={!!actionTarget}
        title={modalContent.title}
        message={modalContent.message}
        confirmText={busy ? 'Working...' : modalContent.confirm}
        danger={modalContent.danger !== false}
        loading={busy}
        onConfirm={performAction}
        onCancel={() => { setActionTarget(null); setAction(null); }}
      />
    </div>
  );
};

export default Servers;
