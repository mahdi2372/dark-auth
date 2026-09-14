import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import { Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwordForm.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    setLoading(true);
    try {
      await authAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-md)', maxWidth: 600 }}>
        {/* Profile Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Profile</h3>
            <span className={`badge ${user?.role === 'ADMIN' ? 'badge-admin' : 'badge-info'}`}>
              {user?.role}
            </span>
          </div>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={user?.username || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Member Since</label>
              <input className="form-input" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} disabled />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Shield size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Change Password</h3>
          </div>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                className="form-input"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : <><Save size={16} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
