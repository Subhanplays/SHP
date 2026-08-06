import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaUsers, FaCoins, FaServer, FaShoppingCart } from 'react-icons/fa';
import { adminAPI } from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/format';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ limit: 20, page, search: search || undefined, role: role || undefined });
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1 });
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    load(1);
  };

  return (
    <div>
      <PageHeader title="Users" subtitle={`${pagination.total || 0} registered users`} />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: 240 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by username or email..."
              className="form-control"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.25rem' }}>Search</button>
        </form>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['', 'user', 'admin', 'superadmin'].map((r) => (
            <button
              key={r || 'all'}
              onClick={() => setRole(r)}
              className="btn-outline"
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                background: role === r ? 'var(--primary-color)' : 'transparent',
                color: role === r ? '#fff' : 'var(--text-secondary)',
                borderColor: role === r ? 'var(--primary-color)' : 'var(--glass-border)',
              }}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={FaUsers} title="No users found" message="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>User</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Coins</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Servers</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Orders</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>Joined</th>
                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=6366f1&color=fff`} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                          <div>
                            <p style={{ margin: 0, fontWeight: 600 }}>{u.username}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}><Badge status={u.role}>{u.role}</Badge></td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}><FaCoins style={{ marginRight: '0.25rem' }} />{u.coins?.toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        <FaServer style={{ marginRight: '0.35rem' }} />{u._count?.servers || 0}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        <FaShoppingCart style={{ marginRight: '0.35rem' }} />{u._count?.orders || 0}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatDateTime(u.createdAt)}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <Link to={`/admin/users/${u.id}`} className="btn-outline" style={{ textDecoration: 'none', padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>
                          Manage
                        </Link>
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
    </div>
  );
};

export default Users;
