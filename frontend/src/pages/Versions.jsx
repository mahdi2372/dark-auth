import React, { useEffect, useState } from 'react';
import { appsAPI, clientAPI } from '../api/client';
import Modal from '../components/Modal';
import { Plus, Trash2, Package, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Versions() {
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ version: '', releaseNotes: '', downloadUrl: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    appsAPI.list().then(({ data }) => {
      setApps(data);
      if (data.length > 0) setSelectedApp(data[0].id);
      setLoading(false);
    });
  }, []);

  const fetchVersions = () => {
    if (!selectedApp) return;
    setLoading(true);
    clientAPI.listVersions(selectedApp)
      .then(({ data }) => setVersions(data))
      .catch(() => toast.error('Failed to load versions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVersions(); }, [selectedApp]);

  const handleCreate = async () => {
    if (!form.version) return toast.error('Version is required');
    try {
      const data = { appDbId: selectedApp, version: form.version, releaseNotes: form.releaseNotes, downloadUrl: form.downloadUrl };
      if (file) data.file = file;
      await clientAPI.createVersion(data);
      toast.success('Version published!');
      setShowCreate(false);
      setForm({ version: '', releaseNotes: '', downloadUrl: '' });
      setFile(null);
      fetchVersions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this version?')) return;
    try {
      await clientAPI.deleteVersion(id);
      toast.success('Deleted');
      fetchVersions();
    } catch (err) { toast.error('Failed'); }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <>
      <div className="page-header page-header-actions">
        <div>
          <h1 className="page-title">Client Versions</h1>
          <p className="page-subtitle">Manage client releases and updates</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} disabled={!selectedApp}>
          <Plus size={16} /> New Version
        </button>
      </div>

      <div className="toolbar">
        <select className="form-select" value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)}>
          {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="page-loading"><span className="loading-spinner" /></div>
      ) : versions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Package size={48} />
            <h3>No versions published</h3>
            <p>Upload your first client version.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Status</th>
                <th>Checksum</th>
                <th>File Size</th>
                <th>Release Notes</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id}>
                  <td>
                    <span style={{ fontWeight: 700 }}>{v.version}</span>
                  </td>
                  <td>
                    {v.isLatest ? (
                      <span className="badge badge-success"><Star size={10} style={{ marginRight: 4 }} /> Latest</span>
                    ) : (
                      <span className="badge badge-info">Previous</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {v.checksum ? v.checksum.substring(0, 16) + '...' : '—'}
                    </span>
                  </td>
                  <td>{formatSize(v.fileSize)}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.releaseNotes || '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Publish New Version"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}>Publish</button></>}
      >
        <div className="form-group">
          <label className="form-label">Version (e.g., 1.0.0)</label>
          <input className="form-input" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0.0" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Release Notes</label>
          <textarea className="form-textarea" value={form.releaseNotes} onChange={(e) => setForm({ ...form, releaseNotes: e.target.value })} placeholder="What's new in this version..." />
        </div>
        <div className="form-group">
          <label className="form-label">Download URL (optional)</label>
          <input className="form-input" value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div className="form-group">
          <label className="form-label">Upload File (optional)</label>
          <input className="form-input" type="file" onChange={(e) => setFile(e.target.files[0])} />
        </div>
      </Modal>
    </>
  );
}
