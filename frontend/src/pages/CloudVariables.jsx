import React, { useEffect, useState } from 'react';
import { variablesAPI, appsAPI } from '../api/client';
import Modal from '../components/Modal';
import { Database, Plus, Trash2, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CloudVariables() {
  const [variables, setVariables] = useState([]);
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealed, setRevealed] = useState({});

  const [form, setForm] = useState({
    appId: '',
    name: '',
    value: '',
    isSecret: false,
    userWriteable: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, varsRes] = await Promise.all([
        appsAPI.list(),
        variablesAPI.list(selectedApp || undefined),
      ]);
      setApps(appsRes.data.applications || []);
      setVariables(varsRes.data.variables || []);
    } catch (err) {
      toast.error('Failed to load variables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedApp]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.appId || !form.name || form.value === '') {
      toast.error('App, name, and value are required.');
      return;
    }

    try {
      await variablesAPI.create(form);
      toast.success('Cloud variable saved!');
      setIsModalOpen(false);
      setForm({ appId: '', name: '', value: '', isSecret: false, userWriteable: false });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save variable');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this cloud variable?')) return;
    try {
      await variablesAPI.delete(id);
      toast.success('Variable deleted.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete variable');
    }
  };

  const toggleReveal = (id) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">☁️ Cloud Variables</h1>
          <p className="page-subtitle">Securely store strings, feature flags, and secrets fetched by clients at runtime</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Variable
        </button>
      </div>

      {/* Filter by Application */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Filter by Application:</span>
          <select
            className="input"
            style={{ width: '260px' }}
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
          >
            <option value="">All Applications</option>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Variables Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading variables...</div>
        ) : variables.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No cloud variables found. Click "New Variable" to create one.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>App</th>
                  <th>Variable Name</th>
                  <th>Value</th>
                  <th>Type</th>
                  <th>Permission</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="badge badge-info">{v.application?.name || 'N/A'}</span>
                    </td>
                    <td>
                      <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{v.name}</code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code>
                          {v.isSecret && !revealed[v.id] ? '••••••••••••••••' : v.value}
                        </code>
                        {v.isSecret && (
                          <button
                            className="btn btn-sm btn-icon"
                            onClick={() => toggleReveal(v.id)}
                            title={revealed[v.id] ? 'Hide' : 'Reveal'}
                          >
                            {revealed[v.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      {v.isSecret ? (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <Lock size={12} /> Secret
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <Unlock size={12} /> Public
                        </span>
                      )}
                    </td>
                    <td>
                      {v.userWriteable ? (
                        <span className="badge badge-info">Client Writeable</span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>Read-Only</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(v.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Cloud Variable">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="label">Application</label>
            <select
              className="input"
              value={form.appId}
              onChange={(e) => setForm({ ...form, appId: e.target.value })}
              required
            >
              <option value="">Select an application...</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.appId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Variable Name (e.g. MOTD, SERVER_IP, FEATURE_FLAG)</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="API_KEY"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Value</label>
            <textarea
              className="input"
              rows={3}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="Variable content or encrypted payload"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '24px', margin: '16px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={form.isSecret}
                onChange={(e) => setForm({ ...form, isSecret: e.target.checked })}
              />
              Mask in Dashboard (Secret)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={form.userWriteable}
                onChange={(e) => setForm({ ...form, userWriteable: e.target.checked })}
              />
              Client Writeable
            </label>
          </div>

          <div className="modal-footer" style={{ marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Variable
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
