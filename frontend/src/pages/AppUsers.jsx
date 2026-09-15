import React, { useEffect, useState } from 'react';
import { appUsersAPI, appsAPI } from '../api/client';
import { Users, Ban, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AppUsers() {
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [loading, setLoading] = useState(true);

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
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, usersRes] = await Promise.all([
        appsAPI.list(),
        appUsersAPI.list(selectedApp || undefined),
      ]);
      setApps(appsRes.data.applications || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      toast.error('Failed to load application users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedApp]);

  const handleToggleBan = async (user) => {
    const newStatus = !user.isBanned;
    const reason = newStatus ? prompt('Enter reason for banning user:', 'Suspicious activity') : null;
    if (newStatus && reason === null) return;

    try {
      await appUsersAPI.ban(user.id, newStatus, reason);
      toast.success(newStatus ? 'User banned.' : 'User unbanned.');
      loadData();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      await appUsersAPI.delete(id);
      toast.success('User deleted.');
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
      // If expiresAt is empty, set it to null or undefined so it doesn't send empty string
      if (!payload.expiresAt) delete payload.expiresAt;

      await appUsersAPI.create(payload);
      toast.success('App user created successfully');
      setCreateForm({ ...createForm, username: '', password: '', email: '', expiresAt: '' });
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">👥 App Users</h1>
          <p className="page-subtitle">Manage client end-users registered directly via SDK login/register APIs</p>
        </div>
        {!showCreateForm && (
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            + Create App User
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Create App User</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
            <div>
              <label className="input-label">Application <span style={{color: 'red'}}>*</span></label>
              <select
                className="input"
                value={createForm.appId}
                onChange={(e) => setCreateForm({ ...createForm, appId: e.target.value })}
                required
              >
                <option value="">Select an application...</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Username <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                className="input"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generate and store secure passwords with Proton Pass</span>
            </div>
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Subscription <span style={{color: 'red'}}>*</span></label>
              <input
                type="number"
                className="input"
                min="1"
                value={createForm.subLevel}
                onChange={(e) => setCreateForm({ ...createForm, subLevel: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Expiration <span style={{color: 'red'}}>*</span></label>
              <input
                type="datetime-local"
                className="input"
                value={createForm.expiresAt}
                onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createForm.hwidLocked}
                  onChange={(e) => setCreateForm({ ...createForm, hwidLocked: e.target.checked })}
                />
                HWID Affected
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

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

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading app users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No registered users in client applications yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>App</th>
                  <th>Username</th>
                  <th>Subscription Tier</th>
                  <th>HWID</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="badge badge-info">{u.application?.name || 'N/A'}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td>
                      <span className="badge badge-success">Tier {u.subLevel}</span>
                    </td>
                    <td>
                      <code style={{ fontSize: '11px' }}>
                        {u.hwid ? `${u.hwid.substring(0, 16)}...` : 'Not bound'}
                      </code>
                    </td>
                    <td>
                      {u.isBanned ? (
                        <span className="badge badge-danger">BANNED</span>
                      ) : (
                        <span className="badge badge-success">ACTIVE</span>
                      )}
                    </td>
                    <td>{u.expiresAt ? new Date(u.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className={`btn btn-sm ${u.isBanned ? 'btn-primary' : 'btn-danger'}`}
                          onClick={() => handleToggleBan(u)}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(u.id)}>
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
    </div>
  );
}
