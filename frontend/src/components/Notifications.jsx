import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaCheckDouble } from 'react-icons/fa';
import { authAPI } from '../api/axios';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await authAPI.getNotifications({ limit: 15 });
      setData(res.data.data);
    } catch (e) {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAll = async () => {
    await authAPI.markAllNotificationsRead();
    setData((d) => ({ ...d, unreadCount: 0, notifications: d.notifications.map((n) => ({ ...n, read: true })) }));
  };

  const markOne = async (id) => {
    await authAPI.markNotificationRead(id);
    setData((d) => ({
      ...d,
      unreadCount: Math.max(0, d.unreadCount - 1),
      notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-secondary)',
          padding: '0.625rem',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <FaBell />
        {data.unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: '360px',
            maxHeight: '480px',
            overflow: 'auto',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.9rem 1.25rem',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
            <button
              onClick={markAll}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FaCheckDouble /> Mark all read
            </button>
          </div>
          {data.notifications.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              No notifications yet
            </p>
          ) : (
            data.notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markOne(n.id)}
                style={{
                  padding: '0.9rem 1.25rem',
                  borderBottom: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  opacity: n.read ? 0.6 : 1,
                  background: n.read ? 'transparent' : 'rgba(99,102,241,0.05)',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: n.read ? 400 : 600 }}>{n.title}</p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.message}</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
