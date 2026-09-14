import React, { useEffect, useState } from 'react';
import { logsAPI } from '../api/client';
import { ScrollText } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const fetchLogs = (page = 1) => {
    setLoading(true);
    logsAPI.list({
      page,
      action: actionFilter || undefined,
      resourceType: resourceFilter || undefined,
    })
      .then(({ data }) => {
        setLogs(data.logs);
        setPagination({ page: data.page, totalPages: data.totalPages, total: data.total });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [actionFilter, resourceFilter]);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const actionColors = {
    USER_LOGIN: 'var(--accent-secondary)',
    USER_REGISTER: 'var(--accent-info)',
    USER_LOGIN_FAILED: 'var(--accent-danger)',
    LICENSE_CREATE: 'var(--accent-primary)',
    LICENSE_VERIFY: 'var(--accent-secondary)',
    LICENSE_BAN: 'var(--accent-danger)',
    CLIENT_ACTIVATE: 'var(--accent-secondary)',
    APP_CREATE: 'var(--accent-primary)',
    APP_DELETE: 'var(--accent-danger)',
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Track all actions and events</p>
      </div>

      <div className="toolbar">
        <select className="form-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All Actions</option>
          <option value="USER_LOGIN">Login</option>
          <option value="USER_REGISTER">Register</option>
          <option value="USER_LOGIN_FAILED">Login Failed</option>
          <option value="LICENSE_CREATE">License Create</option>
          <option value="LICENSE_VERIFY">License Verify</option>
          <option value="LICENSE_BAN">License Ban</option>
          <option value="CLIENT_ACTIVATE">Client Activate</option>
          <option value="APP_CREATE">App Create</option>
          <option value="APP_DELETE">App Delete</option>
          <option value="PASSWORD_CHANGE">Password Change</option>
        </select>
        <select className="form-select" value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)}>
          <option value="">All Resources</option>
          <option value="user">User</option>
          <option value="application">Application</option>
          <option value="license">License</option>
          <option value="activation">Activation</option>
          <option value="client_version">Client Version</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>User</th>
              <th>Resource</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><span className="loading-spinner" /></td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <ScrollText size={48} />
                  <h3>No logs found</h3>
                </div>
              </td></tr>
            ) : logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatTime(log.createdAt)}</td>
                <td>
                  <span style={{
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: actionColors[log.action] || 'var(--text-primary)',
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{log.user?.username || '—'}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {log.resourceType || '—'}
                </td>
                <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {log.ipAddress || '—'}
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.details ? JSON.stringify(log.details) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => fetchLogs(pagination.page - 1)}>Previous</button>
          <span className="pagination-info">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <button className="pagination-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchLogs(pagination.page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
