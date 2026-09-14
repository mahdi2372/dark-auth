import React, { useEffect, useState } from 'react';
import { appsAPI, licensesAPI } from '../api/client';
import Modal from '../components/Modal';
import { Plus, Copy, Ban, ShieldCheck, Trash2, KeyRound, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Licenses() {
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [licenses, setLicenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [createForm, setCreateForm] = useState({
    licenseType: 'TIME_LIMITED', expiresInDays: 30, maxUses: 1, hwid: '', note: '',
  });
  const [bulkForm, setBulkForm] = useState({
    count: 10, licenseType: 'TIME_LIMITED', expiresInDays: 30, maxUses: 1,
  });

  useEffect(() => {
    appsAPI.list().then(({ data }) => {
      setApps(data);
      if (data.length > 0) setSelectedApp(data[0].id);
      setLoading(false);
    });
  }, []);

  const fetchLicenses = (page = 1) => {
    if (!selectedApp) return;
    setLoading(true);
    licensesAPI.list({ appId: selectedApp, status: statusFilter || undefined, search: searchQuery || undefined, page })
      .then(({ data }) => {
        setLicenses(data.licenses);
        setPagination({ page: data.page, totalPages: data.totalPages, total: data.total });
      })
      .catch(() => toast.error('Failed to load licenses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLicenses(); }, [selectedApp, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLicenses();
  };

  const handleCreate = async () => {
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
      fetchLicenses(pagination.page);
    } catch (err) { toast.error('Failed'); }
  };

  const handleUnban = async (id) => {
    try {
      await licensesAPI.unban(id);
      toast.success('License unbanned');
      fetchLicenses(pagination.page);
    } catch (err) { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this license?')) return;
    try {
      await licensesAPI.delete(id);
      toast.success('Deleted');
      fetchLicenses(pagination.page);
    } catch (err) { toast.error('Failed'); }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('License key copied!');
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

  const statusBadge = (status) => {
    const map = { ACTIVE: 'badge-active', EXPIRED: 'badge-expired', BANNED: 'badge-banned', UNUSED: 'badge-unused' };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
  };

  const typeBadge = (type) => {
    const map = { TIME_LIMITED: 'badge-info', LIFETIME: 'badge-lifetime', TRIAL: 'badge-warning' };
    return <span className={`badge ${map[type] || 'badge-info'}`}>{type.replace('_', ' ')}</span>;
  };

  return (
    <>
      <div className="page-header page-header-actions">
        <div>
          <h1 className="page-title">Licenses</h1>
          <p className="page-subtitle">Generate and manage license keys</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportKeys} disabled={!licenses.length}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-secondary" onClick={() => setShowBulk(true)} disabled={!selectedApp}>
            <Plus size={16} /> Bulk
          </button>
          <button id="create-license-btn" className="btn btn-primary" onClick={() => setShowCreate(true)} disabled={!selectedApp}>
            <Plus size={16} /> New License
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <select className="form-select" value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)}>
          {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="UNUSED">Unused</option>
          <option value="EXPIRED">Expired</option>
          <option value="BANNED">Banned</option>
        </select>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input className="form-input" placeholder="Search by key..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ minWidth: 200 }} />
          <button className="btn btn-secondary" type="submit">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>License Key</th>
              <th>Type</th>
              <th>Status</th>
              <th>HWID</th>
              <th>Uses</th>
              <th>Expires</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><span className="loading-spinner" /></td></tr>
            ) : licenses.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <KeyRound size={48} />
                  <h3>No licenses found</h3>
                  <p>Generate your first license key</p>
                </div>
              </td></tr>
            ) : licenses.map((lic) => (
              <tr key={lic.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="key-display">{lic.key}</span>
                    <button className="copy-btn" onClick={() => copyKey(lic.key)}><Copy size={14} /></button>
                  </div>
                </td>
                <td>{typeBadge(lic.licenseType)}</td>
                <td>{statusBadge(lic.status)}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lic.hwid ? lic.hwid.substring(0, 12) + '...' : '—'}</td>
                <td>{lic.currentUses}/{lic.maxUses}</td>
                <td style={{ fontSize: '0.8rem' }}>{lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : 'Never'}</td>
                <td style={{ fontSize: '0.8rem' }}>{new Date(lic.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {lic.status === 'BANNED' ? (
                      <button className="btn btn-success btn-sm" onClick={() => handleUnban(lic.id)} title="Unban">
                        <ShieldCheck size={14} />
                      </button>
                    ) : (
                      <button className="btn btn-danger btn-sm" onClick={() => handleBan(lic.id)} title="Ban">
                        <Ban size={14} />
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(lic.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => fetchLicenses(pagination.page - 1)}>Previous</button>
          <span className="pagination-info">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <button className="pagination-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchLicenses(pagination.page + 1)}>Next</button>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Generate License"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}>Generate</button></>}
      >
        <div className="form-group">
          <label className="form-label">License Type</label>
          <select className="form-select" value={createForm.licenseType} onChange={(e) => setCreateForm({ ...createForm, licenseType: e.target.value })}>
            <option value="TIME_LIMITED">Time Limited</option>
            <option value="LIFETIME">Lifetime</option>
            <option value="TRIAL">Trial</option>
          </select>
        </div>
        {createForm.licenseType !== 'LIFETIME' && (
          <div className="form-group">
            <label className="form-label">Expires In (days)</label>
            <input className="form-input" type="number" min="1" value={createForm.expiresInDays} onChange={(e) => setCreateForm({ ...createForm, expiresInDays: parseInt(e.target.value) })} />
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Max Uses</label>
            <input className="form-input" type="number" min="1" value={createForm.maxUses} onChange={(e) => setCreateForm({ ...createForm, maxUses: parseInt(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">HWID Lock (optional)</label>
            <input className="form-input" value={createForm.hwid} onChange={(e) => setCreateForm({ ...createForm, hwid: e.target.value })} placeholder="Pre-bind to HWID" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" value={createForm.note} onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })} placeholder="Internal note" />
        </div>
      </Modal>

      {/* Bulk Modal */}
      <Modal isOpen={showBulk} onClose={() => setShowBulk(false)} title="Bulk Generate Licenses"
        footer={<><button className="btn btn-secondary" onClick={() => setShowBulk(false)}>Cancel</button><button className="btn btn-primary" onClick={handleBulkCreate}>Generate {bulkForm.count} Keys</button></>}
      >
        <div className="form-group">
          <label className="form-label">Count (max 500)</label>
          <input className="form-input" type="number" min="1" max="500" value={bulkForm.count} onChange={(e) => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) })} />
        </div>
        <div className="form-group">
          <label className="form-label">License Type</label>
          <select className="form-select" value={bulkForm.licenseType} onChange={(e) => setBulkForm({ ...bulkForm, licenseType: e.target.value })}>
            <option value="TIME_LIMITED">Time Limited</option>
            <option value="LIFETIME">Lifetime</option>
            <option value="TRIAL">Trial</option>
          </select>
        </div>
        {bulkForm.licenseType !== 'LIFETIME' && (
          <div className="form-group">
            <label className="form-label">Expires In (days)</label>
            <input className="form-input" type="number" min="1" value={bulkForm.expiresInDays} onChange={(e) => setBulkForm({ ...bulkForm, expiresInDays: parseInt(e.target.value) })} />
          </div>
        )}
      </Modal>
    </>
  );
}
