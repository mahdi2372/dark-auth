import React, { useState, useEffect } from 'react';
import { appsAPI } from '../api/client';
import Modal from './Modal';
import toast from 'react-hot-toast';

export default function AppSettingsModal({ isOpen, onClose, app, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (app) {
      setForm({
        name: app.name || '',
        isActive: app.isActive ?? true,
        hwidLock: app.hwidLock ?? true,
        forceHwid: app.forceHwid ?? true,
        blockVpns: app.blockVpns ?? false,
        blockLeakedPasswords: app.blockLeakedPasswords ?? false,
        tokenValidation: app.tokenValidation ?? false,
        logIp: app.logIp ?? true,
        minHwidLength: app.minHwidLength || 20,
        hwidResetCooldown: app.hwidResetCooldown || 168,
        minUsernameLength: app.minUsernameLength || 1,
        sessionExpiryHours: app.sessionExpiryHours || 6,
        customDomain: app.customDomain || '',
      });
    }
  }, [app]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await appsAPI.update(app.id, form);
      toast.success('App settings updated successfully');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  if (!form) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Settings: ${app?.name}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '20px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
        
        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Access Controls</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              App Status (Enable/Disable)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="hwidLock" checked={form.hwidLock} onChange={handleChange} />
              HWID Lock
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="forceHwid" checked={form.forceHwid} onChange={handleChange} />
              Force HWID
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="blockVpns" checked={form.blockVpns} onChange={handleChange} />
              Block VPNs
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="blockLeakedPasswords" checked={form.blockLeakedPasswords} onChange={handleChange} />
              Block Leaked Passwords
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="tokenValidation" checked={form.tokenValidation} onChange={handleChange} />
              Token Validation
            </label>
          </div>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Security & Restrictions</h4>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="input-label">Min HWID Length</label>
              <input type="number" className="input" name="minHwidLength" value={form.minHwidLength} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">HWID Reset Cooldown (Hours)</label>
              <input type="number" className="input" name="hwidResetCooldown" value={form.hwidResetCooldown} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">Min Username Length</label>
              <input type="number" className="input" name="minUsernameLength" value={form.minUsernameLength} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Session Management</h4>
          <div>
            <label className="input-label">Session Expiry (Hours)</label>
            <input type="number" className="input" name="sessionExpiryHours" value={form.sessionExpiryHours} onChange={handleChange} />
          </div>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Logging</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" name="logIp" checked={form.logIp} onChange={handleChange} />
            Log IP Addresses
          </label>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Custom Domain API</h4>
          <div>
            <label className="input-label">Custom Domain URL (Optional)</label>
            <input type="text" className="input" name="customDomain" value={form.customDomain} onChange={handleChange} placeholder="https://api.yourdomain.com" />
          </div>
        </div>

      </div>
    </Modal>
  );
}
