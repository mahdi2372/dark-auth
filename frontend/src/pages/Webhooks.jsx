import React, { useEffect, useState } from 'react';
import { webhooksAPI, appsAPI } from '../api/client';
import Modal from '../components/Modal';
import { Send, Plus, Trash2, BellRing, Play, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(null);

  const [form, setForm] = useState({
    appId: '',
    name: '',
    url: '',
    triggerEvent: 'all',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    url: '',
    triggerEvent: 'all',
    isEnabled: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, hooksRes] = await Promise.all([
        appsAPI.list(),
        webhooksAPI.list(selectedApp || undefined),
      ]);
      setApps(appsRes.data.applications || []);
      setWebhooks(hooksRes.data.webhooks || []);
    } catch (err) {
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedApp]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.appId || !form.name || !form.url) {
      toast.error('App, name, and webhook URL are required.');
      return;
    }

    try {
      await webhooksAPI.create(form);
      toast.success('Webhook configured!');
      setIsModalOpen(false);
      setForm({ appId: '', name: '', url: '', triggerEvent: 'all' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save webhook');
    }
  };

  const handleEdit = (webhook) => {
    setEditForm({
      name: webhook.name,
      url: webhook.url,
      triggerEvent: webhook.triggerEvent,
      isEnabled: webhook.isEnabled !== false,
    });
    setEditModal(webhook);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await webhooksAPI.update(editModal.id, editForm);
      toast.success('Webhook updated!');
      setEditModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update webhook');
    }
  };

  const handleToggle = async (webhook) => {
    try {
      await webhooksAPI.update(webhook.id, { isEnabled: !webhook.isEnabled });
      toast.success(webhook.isEnabled ? 'Webhook disabled' : 'Webhook enabled');
      loadData();
    } catch (err) {
      toast.error('Failed to toggle webhook');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this webhook?')) return;
    try {
      await webhooksAPI.delete(id);
      toast.success('Webhook deleted.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete webhook');
    }
  };

  const handleTest = async (id) => {
    try {
      toast.loading('Sending test payload...', { id: 'webhook-test' });
      await webhooksAPI.test(id);
      toast.success('Test payload delivered!', { id: 'webhook-test' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Test failed', { id: 'webhook-test' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Webhook Integrations</h1>
          <p className="page-subtitle">Stream real-time security events, activations, and user logins directly to Discord or Slack</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Webhook
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading webhooks...</div>
        ) : webhooks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No webhooks configured. Add your Discord or custom webhook URL to receive live notifications.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Name</th>
                  <th>Webhook URL</th>
                  <th>Trigger Event</th>
                  <th>Enabled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <span className="badge badge-info">{w.application?.name || 'N/A'}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{w.name}</td>
                    <td>
                      <code style={{ fontSize: '12px' }}>{w.url.substring(0, 38)}...</code>
                    </td>
                    <td>
                      <span className="badge badge-success">{w.triggerEvent.toUpperCase()}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(w)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: w.isEnabled !== false ? '#10b981' : '#6b7280' }}
                        title={w.isEnabled !== false ? 'Enabled' : 'Disabled'}
                      >
                        {w.isEnabled !== false ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleTest(w.id)} title="Send Test">
                          <Play size={12} /> Test
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(w)} title="Edit">
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(w.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Webhook">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="label">Application</label>
            <select
              className="input"
              value={form.appId}
              onChange={(e) => setForm({ ...form, appId: e.target.value })}
              required
            >
              <option value="">Select application...</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Integration Name</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Discord #alerts channel"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Webhook URL (Discord / Slack / Custom)</label>
            <input
              type="url"
              className="input"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://discord.com/api/webhooks/..."
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Trigger Event</label>
            <select
              className="input"
              value={form.triggerEvent}
              onChange={(e) => setForm({ ...form, triggerEvent: e.target.value })}
            >
              <option value="all">All Events (Activations, Registrations, Bans)</option>
              <option value="on_activate">License Activations Only</option>
              <option value="on_register">User Registrations Only</option>
              <option value="on_ban">Security Bans Only</option>
            </select>
          </div>

          <div className="modal-footer" style={{ marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Webhook
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Webhook">
        {editModal && (
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="label">Integration Name</label>
              <input
                type="text"
                className="input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Webhook URL</label>
              <input
                type="url"
                className="input"
                value={editForm.url}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Trigger Event</label>
              <select
                className="input"
                value={editForm.triggerEvent}
                onChange={(e) => setEditForm({ ...editForm, triggerEvent: e.target.value })}
              >
                <option value="all">All Events</option>
                <option value="on_activate">License Activations Only</option>
                <option value="on_register">User Registrations Only</option>
                <option value="on_ban">Security Bans Only</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForm.isEnabled}
                  onChange={(e) => setEditForm({ ...editForm, isEnabled: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <span className="label" style={{ marginBottom: 0 }}>Enabled</span>
              </label>
            </div>

            <div className="modal-footer" style={{ marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Update Webhook
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
