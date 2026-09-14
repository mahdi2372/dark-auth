import React, { useEffect, useState } from 'react';
import { appUsersAPI, appsAPI } from '../api/client';
import { Users, Ban, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AppUsers() {
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">👥 App Users</h1>
          <p className="page-subtitle">Manage client end-users registered directly via SDK login/register APIs</p>
        </div>
      </div>

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
