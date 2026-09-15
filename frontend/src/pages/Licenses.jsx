import React, { useEffect, useState, useRef } from 'react';
import { appsAPI, licensesAPI } from '../api/client';
import { KeyRound, Search, Plus, Download, MoreVertical, Trash2, Ban, ShieldCheck, Copy, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

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

const statusColors = {
  ACTIVE: { bg: 'rgba(0,212,170,0.12)', color: '#00d4aa' },
  UNUSED: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  EXPIRED: { bg: 'rgba(255,165,2,0.12)', color: '#ffa502' },
  BANNED: { bg: 'rgba(255,71,87,0.12)', color: '#ff4757' },
};

const typeColors = {
  TIME_LIMITED: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  LIFETIME: { bg: 'rgba(124,91,245,0.12)', color: '#7c5bf5' },
  TRIAL: { bg: 'rgba(255,165,2,0.12)', color: '#ffa502' },
};

export default function Licenses() {
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [licenses, setLicenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const menuRef = useRef(null);

  const [createForm, setCreateForm] = useState({
    licenseType: 'TIME_LIMITED',
    expiresInDays: 30,
    maxUses: 1,
    hwid: '',
    note: '',
  });

  const [bulkForm, setBulkForm] = useState({
    count: 10,
    licenseType: 'TIME_LIMITED',
    expiresInDays: 30,
    maxUses: 1,
  });

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    appsAPI.list().then(({ data }) => {
      const list = data.applications || data || [];
      setApps(list);
      if (list.length > 0 && !selectedApp) setSelectedApp(list[0].id);
    });
  }, []);

  const fetchLicenses = (page = 1) => {
    if (!selectedApp) return;
    setLoading(true);
    licensesAPI.list({
      appId: selectedApp,
      status: statusFilter || undefined,
      search: searchQuery || undefined,
      page,
    })
      .then(({ data }) => {
        setLicenses(data.licenses || []);
        setPagination({ page: data.page || 1, totalPages: data.totalPages || 1, total: data.total || 0 });
      })
      .catch(() => toast.error('Failed to load licenses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLicenses(); }, [selectedApp, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLicenses(1);
  };

  const handleCreate = async () => {
    if (!selectedApp) return toast.error('Select an application first');
    try {
      const result = await licensesAPI.create({ appId: selectedApp, ...createForm });
      toast.success(`License created: ${result.data.key}`);
      setShowCreate(false);
      fetchLicenses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleBulkCreate = async () => {
    if (!selectedApp) return toast.error('Select an application first');
    try {
      const result = await licensesAPI.bulkCreate({ appId: selectedApp, ...bulkForm });
      toast.success(`${result.data.count} licenses created!`);
      setShowBulk(false);
      fetchLicenses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleBan = async (id) => {
    try {
      await licensesAPI.ban(id);
      toast.success('License banned');
      setOpenMenu(null);
      fetchLicenses(pagination.page);
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleUnban = async (id) => {
    try {
      await licensesAPI.unban(id);
      toast.success('License unbanned');
      setOpenMenu(null);
      fetchLicenses(pagination.page);
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this license permanently?')) return;
    try {
      await licensesAPI.delete(id);
      toast.success('License deleted');
      setOpenMenu(null);
      fetchLicenses(pagination.page);
    } catch (err) {
      toast.error('Failed');
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('Key copied!');
  };

  const exportKeys = () => {
    const keys = licenses.map(l => l.key).join('\n');
    const blob = new Blob([keys], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'licenses.txt'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Licenses</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0, marginTop: 4 }}>Generate and manage license keys</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle('secondary')} onClick={exportKeys} disabled={!licenses.length}>
            <Download size={14} /> Export
          </button>
          <button style={btnStyle('secondary')} onClick={() => setShowBulk(true)} disabled={!selectedApp}>
            <Plus size={14} /> Bulk
          </button>
          <button style={btnStyle('primary')} onClick={() => setShowCreate(true)} disabled={!selectedApp}>
            <Plus size={14} /> New License
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
            minWidth: 180,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: 36,
          }}
          value={selectedApp}
          onChange={e => setSelectedApp(e.target.value)}
        >
          {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select
          style={{
            ...inputStyle,
            width: 'auto',
            minWidth: 140,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: 36,
          }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="UNUSED">Unused</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="BANNED">Banned</option>
        </select>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input
              style={{ ...inputStyle, paddingLeft: 36 }}
              placeholder="Search by key..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button style={btnStyle('secondary')} type="submit">Search</button>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div style={{ width: 24, height: 24, border: '3px solid rgba(124,91,245,0.2)', borderTopColor: '#7c5bf5', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        </div>
      ) : licenses.length === 0 ? (
        <div style={{
          background: '#121218',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 80,
          textAlign: 'center',
          color: '#6b7280',
        }}>
          <KeyRound size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>No licenses found</div>
          <div style={{ fontSize: 13 }}>Generate your first license key to get started.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
          {licenses.map(lic => {
            const sc = statusColors[lic.status] || statusColors.UNUSED;
            const tc = typeColors[lic.licenseType] || typeColors.TIME_LIMITED;
            return (
              <div
                key={lic.id}
                style={{
                  background: '#121218',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 20,
                  transition: '0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <div style={{
                      padding: '6px 10px',
                      background: '#0a0a0f',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <KeyRound size={14} style={{ color: '#7c5bf5' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#fff',
                          fontFamily: 'monospace',
                          letterSpacing: '0.04em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lic.key}
                      </div>
                    </div>
                    <button
                      onClick={() => copyKey(lic.key)}
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, borderRadius: 4, flexShrink: 0 }}
                      title="Copy key"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }} ref={openMenu === lic.id ? menuRef : null}>
                    <button
                      onClick={() => setOpenMenu(openMenu === lic.id ? null : lic.id)}
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, borderRadius: 4 }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenu === lic.id && (
                      <div style={{
                        position: 'absolute',
                        top: 30,
                        right: 0,
                        background: '#1a1a24',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        padding: '6px 0',
                        zIndex: 50,
                        minWidth: 160,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                      }}>
                        {lic.status === 'BANNED' ? (
                          <button
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#00d4aa', background: 'none', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
                            onClick={() => handleUnban(lic.id)}
                          >
                            <ShieldCheck size={14} /> Unban
                          </button>
                        ) : (
                          <button
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#ff4757', background: 'none', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
                            onClick={() => handleBan(lic.id)}
                          >
                            <Ban size={14} /> Ban
                          </button>
                        )}
                        <button
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#ff4757', background: 'none', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
                          onClick={() => handleDelete(lic.id)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color }}>
                    {lic.licenseType?.replace('_', ' ')}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                    {lic.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12 }}>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Duration</div>
                    <div style={{ color: '#9ca3af' }}>
                      {lic.licenseType === 'LIFETIME' ? 'Lifetime' : lic.expiresAt ? `${Math.ceil((new Date(lic.expiresAt) - new Date()) / 86400000)}d left` : 'No expiry'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Uses</div>
                    <div style={{ color: '#9ca3af' }}>{lic.currentUses}/{lic.maxUses}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Generated</div>
                    <div style={{ color: '#9ca3af' }}>{new Date(lic.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', marginBottom: 2 }}>Used on</div>
                    <div style={{ color: '#9ca3af' }}>{lic.activatedAt ? new Date(lic.activatedAt).toLocaleDateString() : '—'}</div>
                  </div>
                </div>

                {lic.note && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: '#0a0a0f', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
                    {lic.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button
            style={{ padding: '8px 16px', background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#9ca3af', fontSize: 13, cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.4 : 1, fontFamily: 'inherit' }}
            disabled={pagination.page <= 1}
            onClick={() => fetchLicenses(pagination.page - 1)}
          >
            <ChevronLeft size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Previous
          </button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            style={{ padding: '8px 16px', background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#9ca3af', fontSize: 13, cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page >= pagination.totalPages ? 0.4 : 1, fontFamily: 'inherit' }}
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchLicenses(pagination.page + 1)}
          >
            Next<ChevronRight size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </button>
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Generate License</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>License Type</label>
                <select
                  style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36 }}
                  value={createForm.licenseType}
                  onChange={e => setCreateForm({ ...createForm, licenseType: e.target.value })}
                >
                  <option value="TIME_LIMITED">Time Limited</option>
                  <option value="LIFETIME">Lifetime</option>
                  <option value="TRIAL">Trial</option>
                </select>
              </div>
              {createForm.licenseType !== 'LIFETIME' && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Expires In (days)</label>
                  <input style={inputStyle} type="number" min="1" value={createForm.expiresInDays} onChange={e => setCreateForm({ ...createForm, expiresInDays: parseInt(e.target.value) })} />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Max Uses</label>
                  <input style={inputStyle} type="number" min="1" value={createForm.maxUses} onChange={e => setCreateForm({ ...createForm, maxUses: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>HWID Lock</label>
                  <input style={inputStyle} value={createForm.hwid} onChange={e => setCreateForm({ ...createForm, hwid: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Note</label>
                <input style={inputStyle} value={createForm.note} onChange={e => setCreateForm({ ...createForm, note: e.target.value })} placeholder="Internal note (optional)" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button style={btnStyle('secondary')} onClick={() => setShowCreate(false)}>Cancel</button>
                <button style={btnStyle('primary')} onClick={handleCreate}>Generate</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulk && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Bulk Generate Licenses</h2>
              <button onClick={() => setShowBulk(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Count (max 500)</label>
                <input style={inputStyle} type="number" min="1" max="500" value={bulkForm.count} onChange={e => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>License Type</label>
                <select
                  style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36 }}
                  value={bulkForm.licenseType}
                  onChange={e => setBulkForm({ ...bulkForm, licenseType: e.target.value })}
                >
                  <option value="TIME_LIMITED">Time Limited</option>
                  <option value="LIFETIME">Lifetime</option>
                  <option value="TRIAL">Trial</option>
                </select>
              </div>
              {bulkForm.licenseType !== 'LIFETIME' && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Expires In (days)</label>
                  <input style={inputStyle} type="number" min="1" value={bulkForm.expiresInDays} onChange={e => setBulkForm({ ...bulkForm, expiresInDays: parseInt(e.target.value) })} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button style={btnStyle('secondary')} onClick={() => setShowBulk(false)}>Cancel</button>
                <button style={btnStyle('primary')} onClick={handleBulkCreate}>Generate {bulkForm.count} Keys</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
