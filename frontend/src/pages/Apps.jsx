import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appsAPI } from '../api/client';
import {
  Plus, Trash2, Edit, RefreshCw, Copy, Eye, EyeOff, Settings, Search,
  AppWindow, ShieldCheck, Users as UsersIcon, Pause, ChevronDown
} from 'lucide-react';
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
  whiteSpace: 'nowrap',
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
  ...(variant === 'success' && {
    background: 'rgba(0,212,170,0.1)',
    color: '#00d4aa',
    border: '1px solid rgba(0,212,170,0.2)',
  }),
  ...(variant === 'ghost' && {
    background: 'transparent',
    color: '#9ca3af',
    padding: '6px 10px',
  }),
});

const statCardStyle = {
  background: '#121218',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '20px 24px',
  flex: 1,
  minWidth: 180,
};

export default function Apps() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [visibleSecrets, setVisibleSecrets] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showRename, setShowRename] = useState(null);
  const [showDesc, setShowDesc] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchApps = () => {
    appsAPI.list()
      .then(({ data }) => {
        const list = data.applications || data || [];
        setApps(list);
        if (list.length > 0 && !selectedApp) setSelectedApp(list[0]);
      })
      .catch(() => toast.error('Failed to load apps'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); }, []);

  const handleCreate = async () => {
    if (!form.name) return toast.error('Name is required');
    try {
      await appsAPI.create(form);
      toast.success('Application created!');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleRename = async () => {
    if (!showRename || !form.name) return;
    try {
      await appsAPI.update(showRename.id, { name: form.name });
      toast.success('Renamed!');
      setShowRename(null);
      setForm({ name: '', description: '' });
      if (selectedApp?.id === showRename.id) setSelectedApp({ ...selectedApp, name: form.name });
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleUpdateDesc = async () => {
    if (!showDesc) return;
    try {
      await appsAPI.update(showDesc.id, { description: form.description });
      toast.success('Description updated!');
      setShowDesc(null);
      setForm({ name: '', description: '' });
      if (selectedApp?.id === showDesc.id) setSelectedApp({ ...selectedApp, description: form.description });
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this application and all its licenses?')) return;
    try {
      await appsAPI.delete(id);
      toast.success('Deleted!');
      if (selectedApp?.id === id) setSelectedApp(apps.find(a => a.id !== id) || null);
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleRegenSecret = async (id) => {
    if (!confirm('Regenerate secret? Old secret will stop working.')) return;
    try {
      await appsAPI.regenerateSecret(id);
      toast.success('Secret regenerated!');
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handlePause = async (app) => {
    try {
      await appsAPI.update(app.id, { isActive: !app.isActive });
      toast.success(app.isActive ? 'Application paused' : 'Application resumed');
      fetchApps();
    } catch (err) {
      toast.error('Failed');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const toggleSecret = (id) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredApps = apps.filter(a => {
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterMode === 'active' && !a.isActive) return false;
    if (filterMode === 'paused' && a.isActive) return false;
    return true;
  });

  const totalApps = apps.length;
  const activeApps = apps.filter(a => a.isActive).length;
  const pausedApps = apps.filter(a => !a.isActive).length;
  const totalSessions = apps.reduce((sum, a) => sum + (a._count?.clientSessions || 0), 0);

  const filterLabels = { all: 'All Applications', active: 'Active Only', paused: 'Paused Only' };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ width: 24, height: 24, border: '3px solid rgba(124,91,245,0.2)', borderTopColor: '#7c5bf5', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Overview / </span>
        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Manage Applications</span>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 24px' }}>Manage Applications</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Apps', value: totalApps, color: '#7c5bf5', bg: 'rgba(124,91,245,0.12)' },
          { label: 'Active', value: activeApps, color: '#00d4aa', bg: 'rgba(0,212,170,0.12)' },
          { label: 'Paused', value: pausedApps, color: '#ffa502', bg: 'rgba(255,165,2,0.12)' },
          { label: 'Active Sessions', value: totalSessions, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
        ].map((s, i) => (
          <div key={i} style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AppWindow size={18} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{
          background: '#121218',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 24,
          position: 'sticky',
          top: 24,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Application Credentials</h3>
          {selectedApp ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 6 }}>App Name</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{selectedApp.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 6 }}>Account Owner ID</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <code style={{ fontSize: 12, background: '#0a0a0f', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                    {selectedApp.userId}
                  </code>
                  <button onClick={() => copyToClipboard(selectedApp.userId)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 6 }}>Application Secret</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <code style={{ fontSize: 12, background: '#0a0a0f', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', color: '#00d4aa', fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
                    {visibleSecrets[selectedApp.id] ? selectedApp.appSecret : '••••••••••••••••'}
                  </code>
                  <button onClick={() => toggleSecret(selectedApp.id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
                    {visibleSecrets[selectedApp.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => copyToClipboard(selectedApp.appSecret)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 6 }}>Application Version</div>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>{selectedApp.applicationVersion || 'N/A'}</div>
              </div>
              <button
                onClick={() => handleRegenSecret(selectedApp.id)}
                style={btnStyle('danger')}
              >
                <RefreshCw size={14} /> Refresh Application Secret
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#6b7280', fontSize: 13 }}>Select an application</div>
          )}
        </div>

        <div style={{
          background: '#121218',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>My Applications</h3>
            <button style={btnStyle('primary')} onClick={() => { setForm({ name: '', description: '' }); setShowCreate(true); }}>
              <Plus size={16} /> Create Application
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                style={{ ...inputStyle, paddingLeft: 36 }}
                placeholder="Search applications..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                style={{
                  ...btnStyle('secondary'),
                  minWidth: 180,
                  justifyContent: 'space-between',
                }}
              >
                {filterLabels[filterMode]} <ChevronDown size={14} />
              </button>
              {showFilterDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1a1a24',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '6px 0',
                  zIndex: 50,
                  marginTop: 4,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}>
                  {Object.entries(filterLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setFilterMode(key); setShowFilterDropdown(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 16px',
                        fontSize: 13,
                        color: filterMode === key ? '#7c5bf5' : '#e5e7eb',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: '0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filteredApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
              <AppWindow size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>No applications found</div>
              <div style={{ fontSize: 13 }}>Create your first application to get started.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  style={{
                    background: selectedApp?.id === app.id ? 'rgba(124,91,245,0.08)' : '#0a0a0f',
                    border: `1px solid ${selectedApp?.id === app.id ? 'rgba(124,91,245,0.3)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: 12,
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                  onMouseEnter={e => { if (selectedApp?.id !== app.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { if (selectedApp?.id !== app.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: app.isActive ? 'rgba(124,91,245,0.15)' : 'rgba(255,165,2,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <AppWindow size={16} style={{ color: app.isActive ? '#7c5bf5' : '#ffa502' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</div>
                          {app.description && (
                            <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.description}</div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <UsersIcon size={12} /> {app._count?.licenses || 0} users
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={12} /> {app.isActive ? 'Good' : 'Paused'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: selectedApp?.id === app.id ? '1px solid rgba(124,91,245,0.3)' : '1px solid rgba(255,255,255,0.08)',
                          background: selectedApp?.id === app.id ? 'rgba(124,91,245,0.15)' : 'transparent',
                          color: selectedApp?.id === app.id ? '#7c5bf5' : '#9ca3af',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: '0.15s',
                        }}
                      >
                        {selectedApp?.id === app.id ? 'Selected' : 'Select'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setForm({ name: app.name, description: '' }); setShowRename(app); }}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                        title="Rename"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/apps/${app.id}/settings`); }}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                        title="Settings"
                      >
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePause(app); }}
                      style={{
                        ...btnStyle(app.isActive ? 'secondary' : 'success'),
                        padding: '6px 12px',
                        fontSize: 11,
                      }}
                    >
                      <Pause size={12} /> {app.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setForm({ name: '', description: app.description || '' }); setShowDesc(app); }}
                      style={{ ...btnStyle('ghost'), padding: '6px 12px', fontSize: 11 }}
                    >
                      <Edit size={12} /> Edit Description
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}
                      style={{ ...btnStyle('ghost'), padding: '6px 12px', fontSize: 11, color: '#ff4757' }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Create Application</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}><span style={{ fontSize: 20 }}>&times;</span></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Application Name</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My App" autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Description (optional)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of your application"
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button style={btnStyle('secondary')} onClick={() => setShowCreate(false)}>Cancel</button>
                <button style={btnStyle('primary')} onClick={handleCreate}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRename && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Rename Application</h2>
              <button onClick={() => setShowRename(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}><span style={{ fontSize: 20 }}>&times;</span></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>New Name</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button style={btnStyle('secondary')} onClick={() => setShowRename(null)}>Cancel</button>
                <button style={btnStyle('primary')} onClick={handleRename}>Rename</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDesc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Edit Description</h2>
              <button onClick={() => setShowDesc(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}><span style={{ fontSize: 20 }}>&times;</span></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Description</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Application description"
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button style={btnStyle('secondary')} onClick={() => setShowDesc(null)}>Cancel</button>
                <button style={btnStyle('primary')} onClick={handleUpdateDesc}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
