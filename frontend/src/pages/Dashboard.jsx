import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../api/client';
import { AppWindow, KeyRound, Zap, Package, ShieldCheck, Ban, Clock, Inbox } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.stats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-loading"><span className="loading-spinner" /></div>;
  }

  const statCards = [
    { icon: AppWindow, label: 'Applications', value: stats?.totalApps || 0, color: 'purple' },
    { icon: KeyRound, label: 'Total Licenses', value: stats?.totalLicenses || 0, color: 'blue' },
    { icon: ShieldCheck, label: 'Active Licenses', value: stats?.activeLicenses || 0, color: 'green' },
    { icon: Clock, label: 'Expired', value: stats?.expiredLicenses || 0, color: 'yellow' },
    { icon: Ban, label: 'Banned', value: stats?.bannedLicenses || 0, color: 'red' },
    { icon: Inbox, label: 'Unused', value: stats?.unusedLicenses || 0, color: 'blue' },
    { icon: Zap, label: 'Activations', value: stats?.totalActivations || 0, color: 'purple' },
    { icon: Package, label: 'Versions', value: stats?.totalVersions || 0, color: 'green' },
  ];

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your licensing platform</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={card.label} className="stat-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`stat-icon ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div className="stat-value">{card.value.toLocaleString()}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          {stats?.recentLogs?.length > 0 ? (
            <ul className="activity-list">
              {stats.recentLogs.map((log) => (
                <li key={log.id} className="activity-item">
                  <span className="activity-dot" />
                  <span className="activity-text">
                    <strong>{log.action}</strong>
                    {log.resourceType && <> on {log.resourceType}</>}
                  </span>
                  <span className="activity-time">{formatTime(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state"><p>No recent activity</p></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activations</h3>
          </div>
          {stats?.recentActivations?.length > 0 ? (
            <ul className="activity-list">
              {stats.recentActivations.map((act) => (
                <li key={act.id} className="activity-item">
                  <span className="activity-dot" style={{ background: 'var(--accent-secondary)' }} />
                  <span className="activity-text">
                    <span className="key-display" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
                      {act.license?.key?.substring(0, 11)}...
                    </span>
                    {' '}{act.license?.application?.name}
                  </span>
                  <span className="activity-time">{formatTime(act.activatedAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state"><p>No recent activations</p></div>
          )}
        </div>
      </div>
    </>
  );
}
