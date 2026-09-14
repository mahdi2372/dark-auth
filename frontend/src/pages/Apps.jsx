import React, { useEffect, useState } from 'react';
import { appsAPI } from '../api/client';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit, RefreshCw, Copy, AppWindow, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Apps() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [visibleSecrets, setVisibleSecrets] = useState({});

  const fetchApps = () => {
    appsAPI.list()
      .then(({ data }) => setApps(data))
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

  const handleUpdate = async () => {
    try {
      await appsAPI.update(showEdit.id, form);
      toast.success('Updated!');
      setShowEdit(null);
      setForm({ name: '', description: '' });
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const toggleSecret = (id) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="page-loading"><span className="loading-spinner" /></div>;

  return (
    <>
      <div className="page-header page-header-actions">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">Manage your apps and their configurations</p>
        </div>
        <button id="create-app-btn" className="btn btn-primary" onClick={() => { setForm({ name: '', description: '' }); setShowCreate(true); }}>
          <Plus size={18} /> New App
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <AppWindow size={48} />
            <h3>No applications yet</h3>
            <p>Create your first application to start generating licenses.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={18} /> Create Application
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {apps.map((app, i) => (
            <div key={app.id} className="card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{app.name}</h3>
                  {app.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>{app.description}</p>}

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>App ID</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="key-display">{app.appId}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(app.appId)}><Copy size={14} /></button>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secret</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="key-display">
                          {visibleSecrets[app.id] ? app.appSecret : '••••••••••••••••'}
                        </span>
                        <button className="copy-btn" onClick={() => toggleSecret(app.id)}>
                          {visibleSecrets[app.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button className="copy-btn" onClick={() => copyToClipboard(app.appSecret)}><Copy size={14} /></button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span><strong>{app._count?.licenses || 0}</strong> licenses</span>
                    <span><strong>{app._count?.clientVersions || 0}</strong> versions</span>
                    <span>Created {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ name: app.name, description: app.description || '' }); setShowEdit(app); }}>
                    <Edit size={14} />
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleRegenSecret(app.id)} title="Regenerate secret">
                    <RefreshCw size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(app.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Application"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}>Create</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Application Name</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My App" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!showEdit}
        onClose={() => setShowEdit(null)}
        title="Edit Application"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Application Name</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>
    </>
  );
}
