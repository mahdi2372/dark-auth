import React, { useEffect, useState, useRef } from 'react';
import { appUsersAPI, appsAPI } from '../api/client';
import { Users, Search, Grid3X3, List, Filter, Download, Trash2, Ban, MoreVertical, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const cardStyle = {
  background: '#121218',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: 20,
  transition: '0.2s',
  position: 'relative',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: '#0a0a0f',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
};

const btnStyle = (variant = 'primary') => ({
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  transition: '0.2s',
  ...(variant === 'primary' && {
    background: 'linear-gradient(135deg, #7c5bf5, #6344e8)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(124,91,245,0.25)',
  }),
  ...(variant === 'secondary' && {
    background: '#1e1e2a',
    color: '#e5e7eb',
    border: '1px solid rgba(255,255,255,0.1)',
  }),
  ...(variant === 'danger' && {
    background: 'rgba(255,71,87,0.1)',
    color: '#ff4757',
    border: '1px solid rgba(255,71,87,0.2)',
  }),
  ...(variant === 'ghost' && {
    background: 'transparent',
    color: '#9ca3af',
    padding: '6px 10px',
  }),
});

const menuStyle = {
  position: 'absolute',
  top: 40,
  right: 12,
  background: '#1a1a24',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '6px 0',
  zIndex: 50,
  minWidth: 160,
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
};

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  fontSize: 13,
  cursor: 'pointer',
  color: '#e5e7eb',
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: '0.15s',
};

export default function AppUsers() {
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [openMenu, setOpenMenu] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    appId: '',
    username: '',
    password: '',
    email: '',
    subLevel: 1,
    expiresAt: '',
    hwidLocked: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, usersRes] = await Promise.all([
        appsAPI.list(),
        appUsersAPI.list(selectedApp || undefined),
      ]);
      setApps(appsRes.data.applications || appsRes.data || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      toast.error('Failed to load application users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedApp]);

  const handleToggleBan = async (user) => {
    const newStatus = !user.isBanned;
    const reason = newStatus ? prompt('Enter reason for banning:', 'Suspicious activity') : null;
    if (newStatus && reason === null) return;
    try {
      await appUsersAPI.ban(user.id, newStatus, reason);
      toast.success(newStatus ? 'User banned.' : 'User unbanned.');
      setOpenMenu(null);
      loadData();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user account permanently?')) return;
    try {
      await appUsersAPI.delete(id);
      toast.success('User deleted.');
      setOpenMenu(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.appId || !createForm.username || !createForm.password) {
      toast.error('App, username, and password are required');
      return;
    }
    try {
      setIsCreating(true);
      const payload = { ...createForm };
      if (!payload.expiresAt) delete payload.expiresAt;
      await appUsersAPI.create(payload);
      toast.success('User created successfully');
      setCreateForm({ appId: '', username: '', password: '', email: '', subLevel: 1, expiresAt: '', hwidLocked: true });
      setShowCreate(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected user(s)?`)) return;
    try {
      await Promise.all([...selectedIds].map(id => appUsersAPI.delete(id)));
      toast.success(`${selectedIds.size} user(s) deleted`);
      setSelectedIds(new Set());
      loadData();
    } catch (err) {
      toast.error('Failed to delete some users');
    }
  };

  const exportUsers = () => {
    const rows = ['Username,Email,Status,Subscription,Last Login,Created'];
    filteredUsers.forEach(u => {
      rows.push([
        u.username,
        u.email || '',
        u.isBanned ? 'Banned' : 'Active',
        `Tier ${u.subLevel}`,
        u.lastLogin ? new Date(u.lastLogin).toISOString() : 'Never',
        new Date(u.createdAt).toISOString(),
      ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'app-users.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Users exported!');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Users</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0, marginTop: 4 }}>Manage client end-users registered via SDK</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input
              style={{ ...inputStyle, paddingLeft: 36, width: 240 }}
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button style={btnStyle('primary')} onClick={() => { setCreateForm(prev => ({ ...prev, appId: selectedApp || '' })); setShowCreate(true); }}>
            <Plus size={16} /> Create User
          </button>
        </div>
      </div>

      <div style={{
        background: '#121218',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '14px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <select
          style={{
            ...inputStyle,
            width: 'auto',
            minWidth: 200,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: 36,
          }}
          value={selectedApp}
          onChange={e => setSelectedApp(e.target.value)}
        >
          <option value="">All Applications</option>
          {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 6, background: '#0a0a0f', borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setViewMode('card')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: viewMode === 'card' ? '#7c5bf5' : 'transparent',
              color: viewMode === 'card' ? '#fff' : '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            <Grid3X3 size={14} /> Card
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: viewMode === 'list' ? '#7c5bf5' : 'transparent',
              color: viewMode === 'list' ? '#fff' : '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            <List size={14} /> List
          </button>
        </div>

        <button style={btnStyle('ghost')} onClick={exportUsers} disabled={filteredUsers.length === 0}>
          <Download size={14} /> Export
        </button>

        {selectedIds.size > 0 && (
          <button style={btnStyle('danger')} onClick={handleBulkDelete}>
            <Trash2 size={14} /> Delete ({selectedIds.size})
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 24, height: 24, border: '3px solid rgba(124,91,245,0.2)', borderTopColor: '#7c5bf5', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{
          background: '#121218',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 80,
          textAlign: 'center',
          color: '#6b7280',
        }}>
          <Users size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>No users found</div>
          <div style={{ fontSize: 13 }}>Create your first user to get started.</div>
        </div>
      ) : viewMode === 'card' ? (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            padding: '0 4px',
          }}>
            <input
              type="checkbox"
              checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
              onChange={toggleSelectAll}
              style={{ width: 16, height: 16, accentColor: '#7c5bf5', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : `Select all (${filteredUsers.length})`}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
            {filteredUsers.map(u => (
              <div
                key={u.id}
                style={{
                  ...cardStyle,
                  borderLeft: `3px solid ${u.isBanned ? '#ff4757' : '#00d4aa'}`,
                  background: selectedIds.has(u.id) ? 'rgba(124,91,245,0.08)' : '#121218',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      style={{ width: 16, height: 16, accentColor: '#7c5bf5', cursor: 'pointer', marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{u.username}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.isBanned ? 'rgba(255,71,87,0.12)' : 'rgba(0,212,170,0.12)', color: u.isBanned ? '#ff4757' : '#00d4aa' }}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }} ref={openMenu === u.id ? menuRef : null}>
                    <button
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, borderRadius: 4 }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenu === u.id && (
                      <div style={menuStyle}>
                        <button
                          style={menuItemStyle}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          onClick={() => handleToggleBan(u)}
                        >
                          <Ban size={14} style={{ color: u.isBanned ? '#00d4aa' : '#ff4757' }} />
                          {u.isBanned ? 'Unban User' : 'Ban User'}
                        </button>
                        <button
                          style={{ ...menuItemStyle, color: '#ff4757' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 size={14} />
                          Delete User
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12 }}>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Created</div>
                    <div style={{ color: '#9ca3af' }}>{new Date(u.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Last Login</div>
                    <div style={{ color: '#9ca3af' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>2FA</div>
                    <div style={{ color: '#9ca3af' }}>Disabled</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>HWID Affected</div>
                    <div style={{ color: '#9ca3af' }}>{u.hwid ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Subscription</div>
                    <div style={{ color: '#7c5bf5', fontWeight: 600 }}>Tier {u.subLevel}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Cooldown</div>
                    <div style={{ color: '#9ca3af' }}>None</div>
                  </div>
                </div>

                {u.hwid && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: '#0a0a0f', borderRadius: 6, fontSize: 11, fontFamily: 'monospace', color: '#6b7280', wordBreak: 'break-all' }}>
                    HWID: {u.hwid.substring(0, 32)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          background: '#121218',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0a0f' }}>
                {['', 'Username', 'Status', 'Subscription', 'Last Login', 'HWID', 'Created', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      style={{ width: 16, height: 16, accentColor: '#7c5bf5', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff', fontSize: 13 }}>{u.username}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.isBanned ? 'rgba(255,71,87,0.12)' : 'rgba(0,212,170,0.12)', color: u.isBanned ? '#ff4757' : '#00d4aa' }}>
                      {u.isBanned ? 'BANNED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>Tier {u.subLevel}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'monospace', color: '#6b7280' }}>{u.hwid ? u.hwid.substring(0, 12) + '...' : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', position: 'relative' }} ref={openMenu === `list-${u.id}` ? menuRef : null}>
                    <button
                      onClick={() => setOpenMenu(openMenu === `list-${u.id}` ? null : `list-${u.id}`)}
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenu === `list-${u.id}` && (
                      <div style={menuStyle}>
                        <button style={menuItemStyle} onClick={() => handleToggleBan(u)}>
                          <Ban size={14} /> {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                        <button style={{ ...menuItemStyle, color: '#ff4757' }} onClick={() => handleDelete(u.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Create user</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>
                  Username <span style={{ color: '#ff4757' }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  value={createForm.username}
                  onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>
                  Password <span style={{ color: '#ff4757' }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  type="password"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>
                    Subscription <span style={{ color: '#ff4757' }}>*</span>
                  </label>
                  <select
                    style={{
                      ...inputStyle,
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: 36,
                    }}
                    value={createForm.subLevel}
                    onChange={e => setCreateForm({ ...createForm, subLevel: parseInt(e.target.value) })}
                  >
                    <option value={1}>Default</option>
                    <option value={2}>Basic</option>
                    <option value={3}>Premium</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>
                    Expiration <span style={{ color: '#ff4757' }}>*</span>
                  </label>
                  <input
                    style={inputStyle}
                    type="datetime-local"
                    value={createForm.expiresAt}
                    onChange={e => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#0a0a0f', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <input
                  type="checkbox"
                  checked={createForm.hwidLocked}
                  onChange={e => setCreateForm({ ...createForm, hwidLocked: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#7c5bf5', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#e5e7eb' }}>HWID Affected</span>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="button" style={btnStyle('secondary')} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" style={btnStyle('primary')} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
