import React, { useEffect, useState } from 'react';
import { blacklistAPI } from '../api/client';
import Modal from '../components/Modal';
import { Ban, Plus, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Blacklist() {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    type: 'HWID',
    value: '',
    reason: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await blacklistAPI.list();
      setBlacklist(res.data.blacklist || []);
    } catch (err) {
      toast.error('Failed to load blacklist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.value.trim()) {
      toast.error('Value is required.');
      return;
    }

    try {
      await blacklistAPI.add(form);
      toast.success('Added to blacklist!');
      setIsModalOpen(false);
      setForm({ type: 'HWID', value: '', reason: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to blacklist');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove from blacklist?')) return;
    try {
      await blacklistAPI.remove(id);
      toast.success('Removed from blacklist.');
      loadData();
    } catch (err) {
      toast.error('Failed to remove from blacklist');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🚫 Blacklist & Ban Engine</h1>
          <p className="page-subtitle">Instantly deny initialization or authentication by hardware ID (HWID) or IP address</p>
        </div>
        <button className="btn btn-danger" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Blacklist Entry
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading blacklist...</div>
        ) : blacklist.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No blacklisted items found. Click "Add Blacklist Entry" to ban a machine or IP.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target Value (HWID or IP)</th>
                  <th>Reason</th>
                  <th>Date Banned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blacklist.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`badge ${item.type === 'HWID' ? 'badge-danger' : 'badge-warning'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.value}</code>
                    </td>
                    <td>{item.reason || <span style={{ color: 'var(--text-muted)' }}>No reason provided</span>}</td>
                    <td>{new Date(item.bannedAt).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleRemove(item.id)}>
                        Unban / Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add to Blacklist">
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label className="label">Ban Target Type</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="HWID">Hardware ID (HWID)</option>
              <option value="IP">IP Address</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Target Value</label>
            <input
              type="text"
              className="input"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={form.type === 'HWID' ? 'e.g. 7f3b89a1c...' : 'e.g. 192.168.1.100'}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Reason / Notes</label>
            <input
              type="text"
              className="input"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Suspicious memory modification / Chargeback"
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              Enforce Ban
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
