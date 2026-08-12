import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaServer, FaPlay, FaStop, FaRedo, FaTerminal, FaChartLine, FaCoins, FaArrowLeft, FaExternalLinkAlt, FaNetworkWired } from 'react-icons/fa';
import { userAPI, serverAPI } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/Badge';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDate, daysLeft } from '../../utils/format';

const ServerDetail = () => {
  const { id } = useParams();
  const { refreshProfile } = useAuthStore();
  const [server, setServer] = useState(null);
  const [resources, setResources] = useState(null);
  const [consoleData, setConsoleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [renewModal, setRenewModal] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [portModal, setPortModal] = useState(false);
  const [freePorts, setFreePorts] = useState([]);
  const [portLoading, setPortLoading] = useState(true);
  const [changingPort, setChangingPort] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getServer(id);
      setServer(res.data.data);
    } catch (error) {
      toast.error('Server not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    serverAPI.getResources(id).then((r) => setResources(r.data.data)).catch(() => {});
    serverAPI.getConsole(id).then((c) => setConsoleData(c.data.data)).catch(() => {});
  }, [id]);

  const doAction = async (action) => {
    setActionLoading(true);
    try {
      const map = { start: serverAPI.start, stop: serverAPI.stop, restart: serverAPI.restart };
      const res = await map[action](id);
      toast.success(res.data.message || `${action} command sent`);
      await load();
      serverAPI.getResources(id).then((r) => setResources(r.data.data)).catch(() => {});
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    setRenewing(true);
    try {
      const res = await serverAPI.renew(id, { paymentMethod: 'coins' });
      await refreshProfile();
      toast.success(res.data.message || 'Server renewed successfully');
      setRenewModal(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Renewal failed');
    } finally {
      setRenewing(false);
    }
  };

  const openPortModal = async () => {
    setPortModal(true);
    setPortLoading(true);
    try {
      const res = await serverAPI.getFreePorts(id);
      setFreePorts(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not load available ports');
      setFreePorts([]);
    } finally {
      setPortLoading(false);
    }
  };

  const handleChangePort = async (allocationId) => {
    setChangingPort(true);
    try {
      const res = await serverAPI.changePort(id, allocationId);
      toast.success(res.data.message || 'Port changed successfully');
      setPortModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || error.response?.data?.message || 'Could not change port');
    } finally {
      setChangingPort(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!server) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h3>Server not found</h3>
        <Link to="/servers" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
          Back to Servers
        </Link>
      </div>
    );
  }

  const d = daysLeft(server.expiresAt);
  const product = server?.order?.items?.[0]?.product;
  const r = resources?.resources || {};

  return (
    <div>
      <Link to="/servers" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <FaArrowLeft /> Back to Servers
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaServer style={{ color: '#fff', fontSize: '1.5rem' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{server.name}</h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{product?.name}</p>
          </div>
        </div>
        <Badge status={server.status}>{server.status}</Badge>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button className="btn-outline" onClick={() => doAction('start')} disabled={actionLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaPlay style={{ color: '#10b981' }} /> Start
        </button>
        <button className="btn-outline" onClick={() => doAction('stop')} disabled={actionLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaStop style={{ color: '#ef4444' }} /> Stop
        </button>
        <button className="btn-outline" onClick={() => doAction('restart')} disabled={actionLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaRedo style={{ color: '#f59e0b' }} /> Restart
        </button>
        <button className="btn-outline" onClick={openPortModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <FaNetworkWired /> Change Port
        </button>
        <button className="btn-primary" onClick={() => setRenewModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaCoins /> Renew
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Resources */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaChartLine style={{ color: 'var(--primary-color)' }} /> Live Resources
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[['Memory', r.memory_bytes, (resources?.limits?.memory || 4096) * 1024 * 1024],
              ['CPU', r.cpu_absolute, 100],
              ['Disk', r.disk_bytes, (resources?.limits?.disk || 40000) * 1024 * 1024]].map(([label, used, total]) => {
              const pct = total ? Math.min(100, ((used || 0) / total) * 100) : 0;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span>{total ? `${(pct).toFixed(1)}%` : '—'}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--glass-bg)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))', borderRadius: 4 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {resources?.currentState && (
            <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Current state: <Badge status={resources.currentState}>{resources.currentState}</Badge>
            </p>
          )}
        </motion.div>

        {/* Details */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', fontWeight: 700 }}>Server Details</h3>
          <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.875rem' }}>
            <InfoRow label="Server ID" value={server.id} />
            <InfoRow label="RAM" value={`${server.ram} MB`} />
            <InfoRow label="CPU" value={`${server.cpu}%`} />
            <InfoRow label="Disk" value={`${server.disk} MB`} />
            <InfoRow label="Databases" value={`${server.databases || 0}`} />
            <InfoRow label="Backups" value={`${server.backups || 0}`} />
            <InfoRow label="Created" value={formatDate(server.createdAt)} />
            <InfoRow label="Expires" value={formatDate(server.expiresAt)} />
            {d !== null && d >= 0 && <InfoRow label="Days left" value={d.toString()} />}
          </div>

          {consoleData && (
            <a
              href={consoleData.panelUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', marginTop: '1.25rem' }}
            >
              <FaExternalLinkAlt /> Open in Pterodactyl Panel
            </a>
          )}
        </motion.div>
      </div>

      {/* Console hint */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaTerminal style={{ color: 'var(--primary-color)' }} /> Console
        </h3>
        {consoleData ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <iframe
              title={`${server.name} console`}
              src={consoleData.panelUrl}
              style={{ width: '100%', minHeight: 560, border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', background: '#0b1020' }}
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              If the console does not load here, open the panel directly.
            </p>
            <a
              href={consoleData.panelUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', width: 'fit-content' }}
            >
              <FaExternalLinkAlt /> Open in Pterodactyl Panel
            </a>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Console data is unavailable right now.
          </p>
        )}
      </div>

      <ConfirmModal
        show={renewModal}
        title="Renew this server?"
        message={`This will renew your server for one billing cycle using ${product?.coinPrice ? product.coinPrice.toLocaleString() + ' SHP Coins' : 'your coins'}.`}
        confirmText={renewing ? 'Renewing...' : 'Renew'}
        danger={false}
        loading={renewing}
        onConfirm={handleRenew}
        onCancel={() => setRenewModal(false)}
      />

      {portModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => !changingPort && setPortModal(false)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 700 }}>Change Port</h3>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Choose a free port. Your current port will be released and becomes free for others.
            </p>
            {portLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
            ) : freePorts.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No free ports are currently available on this panel.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem', maxHeight: 320, overflowY: 'auto' }}>
                {freePorts.map((p) => (
                  <button
                    key={p.allocationId}
                    className="btn-outline"
                    disabled={changingPort}
                    onClick={() => handleChangePort(p.allocationId)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left' }}
                  >
                    <span>{p.ip}:{p.port}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>node {p.nodeId}</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn-outline" onClick={() => setPortModal(false)} disabled={changingPort}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--glass-border)' }}>
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);

export default ServerDetail;
