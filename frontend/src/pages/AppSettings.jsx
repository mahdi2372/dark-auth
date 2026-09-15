import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appsAPI } from '../api/client';
import { ArrowLeft, Save, Hash, Globe, ShieldCheck, Clock, Download, MessageSquare, UserCog, Box, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const cardStyle = {
  background: '#121218',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '24px',
  marginBottom: 20,
};

const cardTitleStyle = {
  fontSize: 16,
  fontWeight: 700,
  color: '#fff',
  marginBottom: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: 4,
  display: 'block',
};

const descStyle = {
  fontSize: 12,
  color: '#6b7280',
  marginTop: 2,
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: '#0a0a0f',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
};

const Toggle = ({ checked, onChange }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    style={{
      width: 40,
      height: 22,
      appearance: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      background: checked ? '#7c5bf5' : '#333',
      borderRadius: 11,
      position: 'relative',
      cursor: 'pointer',
      transition: '0.2s',
      outline: 'none',
      flexShrink: 0,
      border: 'none',
    }}
  />
);

const tabStyle = (active) => ({
  padding: '10px 20px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  background: active ? '#7c5bf5' : 'transparent',
  color: active ? '#fff' : '#9ca3af',
  transition: '0.2s',
  fontFamily: 'inherit',
});

export default function AppSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [form, setForm] = useState(null);

  useEffect(() => {
    appsAPI.get(id)
      .then(({ data }) => {
        setApp(data);
        setForm({
          name: data.name || '',
          description: data.description || '',
          isActive: data.isActive ?? true,
          hwidLock: data.hwidLock ?? true,
          forceHwid: data.forceHwid ?? true,
          blockVpns: data.blockVpns ?? false,
          hashCheck: data.hashCheck ?? false,
          appHash: data.appHash || '',
          blockLeakedPasswords: data.blockLeakedPasswords ?? false,
          tokenValidation: data.tokenValidation ?? false,
          logIp: data.logIp ?? true,
          minHwidLength: data.minHwidLength || 20,
          hwidResetCooldown: data.hwidResetCooldown || 168,
          minUsernameLength: data.minUsernameLength || 1,
          sessionExpiryHours: data.sessionExpiryHours || 6,
          customDomain: data.customDomain || '',
          discordWebhook: data.discordWebhook || '',
          applicationVersion: data.applicationVersion || '',
          autoUpdateLink: data.autoUpdateLink || '',
          hwidResetUnit: data.hwidResetUnit || 'days',
          hwidResetValue: data.hwidResetValue || 7,
          sessionExpiryUnit: data.sessionExpiryUnit || 'Hours',
          sessionExpiryValue: data.sessionExpiryValue || 6,
        });
      })
      .catch(() => {
        toast.error('Failed to load app settings');
        navigate('/apps');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await appsAPI.update(id, form);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHash = async () => {
    const hash = prompt('Enter the application hash (SHA-256):');
    if (hash) {
      try {
        await appsAPI.update(id, { appHash: hash });
        handleChange('appHash', hash);
        toast.success('Hash added successfully!');
      } catch (err) {
        toast.error('Failed to add hash');
      }
    }
  };

  const handleResetHashes = async () => {
    try {
      await appsAPI.update(id, { appHash: '' });
      handleChange('appHash', '');
      toast.success('All hashes cleared!');
    } catch (err) {
      toast.error('Failed to reset hashes');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ width: 24, height: 24, border: '3px solid rgba(124,91,245,0.2)', borderTopColor: '#7c5bf5', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  if (!form) return null;

  const tabs = [
    { key: 'config', label: 'App Config', icon: Box },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'panel', label: 'Customer Panel', icon: UserCog },
    { key: 'functions', label: 'Functions', icon: Key },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/apps')}
          style={{
            background: '#1e1e2a',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: 8,
            cursor: 'pointer',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: '0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,91,245,0.4)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0, marginTop: 2 }}>
            {app?.name} — Configure your application
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 4,
        background: '#0a0a0f',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: 4,
        marginBottom: 24,
        overflowX: 'auto',
      }}>
        <div style={{
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 700,
          borderRadius: 8,
          background: 'rgba(124,91,245,0.15)',
          color: '#7c5bf5',
          whiteSpace: 'nowrap',
        }}>
          Application
        </div>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={tabStyle(activeTab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* LEFT COLUMN */}
          <div>
            {/* Access Controls */}
            <div style={cardStyle}>
              <div style={cardTitleStyle}>
                <ShieldCheck size={18} style={{ color: '#7c5bf5' }} />
                Access Controls
              </div>
              {[
                { key: 'isActive', label: 'App Status', desc: 'Enable or disable the application, preventing users from logging in' },
                { key: 'hwidLock', label: 'HWID Lock', desc: 'Lock users to a value from your user\'s device which only changes if they reinstall their operating system. Use this to prevent people from sharing your product.' },
                { key: 'forceHwid', label: 'Force HWID', desc: 'Prevent users from logging in with a black HWID (disable this for web based products, i.e. PHP)' },
                { key: 'blockVpns', label: 'Block VPNs', desc: 'Prevent users from logging in from a Virtual Private Network (VPN)' },
                { key: 'hashCheck', label: 'Hash Check', desc: 'Checks whether the application has been modified since the last time you pressed the reset hash button. Used to prevent people from altering/bypassing your application.' },
                { key: 'blockLeakedPasswords', label: 'Block Leaked Passwords', desc: 'Prevent users from registering using a leaked password.' },
                { key: 'tokenValidation', label: 'Token Validation', desc: 'Prevents users from accessing your program without a valid token. Note: This is not the same as a license. Licenses allow users to login/register, while tokens allow users to access the application entirely.' },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ flex: 1, paddingRight: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>{item.label}</div>
                    <div style={descStyle}>{item.desc}</div>
                  </div>
                  <Toggle checked={form[item.key]} onChange={() => handleToggle(item.key)} />
                </div>
              ))}
            </div>

            {/* Hash Management */}
            <div style={cardStyle}>
              <div style={cardTitleStyle}>
                <Hash size={18} style={{ color: '#7c5bf5' }} />
                Hash Management
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <button
                  onClick={handleAddHash}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: '0.2s',
                  }}
                >
                  Add Hash
                </button>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginTop: 4 }}>Delete Existing Hashes</div>
                <button
                  onClick={handleResetHashes}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: '0.2s',
                  }}
                >
                  Reset All Hashes
                </button>
              </div>
              {form.appHash && (
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Current Hash</label>
                  <div style={{
                    padding: '10px 14px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: '#00d4aa',
                    wordBreak: 'break-all',
                  }}>
                    {form.appHash}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Download & Update */}
            <div style={cardStyle}>
              <div style={cardTitleStyle}>
                <Download size={18} style={{ color: '#7c5bf5' }} />
                Download & Update
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Application Version</label>
                  <input
                    style={inputStyle}
                    value={form.applicationVersion}
                    onChange={e => handleChange('applicationVersion', e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Auto-Update Download Link</label>
                  <input
                    style={inputStyle}
                    value={form.autoUpdateLink}
                    onChange={e => handleChange('autoUpdateLink', e.target.value)}
                    placeholder="https://example.com/download/latest"
                  />
                </div>
              </div>
            </div>

            {/* Logging & Integration */}
            <div style={cardStyle}>
              <div style={cardTitleStyle}>
                <MessageSquare size={18} style={{ color: '#7c5bf5' }} />
                Logging & Integration
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Discord Webhook Link</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      style={inputStyle}
                      value={form.discordWebhook}
                      onChange={e => handleChange('discordWebhook', e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <Toggle checked={form.logIp} onChange={() => handleToggle('logIp')} />
                      <span style={{ fontSize: 13, color: '#9ca3af', whiteSpace: 'nowrap' }}>Log IP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security & User Restriction */}
            <div style={cardStyle}>
              <div style={cardTitleStyle}>
                <ShieldCheck size={18} style={{ color: '#7c5bf5' }} />
                Security & User Restriction
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Minimum HWID Length</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    value={form.minHwidLength}
                    onChange={e => handleChange('minHwidLength', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>HWID Reset Cooldown</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <select
                      style={selectStyle}
                      value={form.hwidResetUnit}
                      onChange={e => handleChange('hwidResetUnit', e.target.value)}
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                    <input
                      style={inputStyle}
                      type="number"
                      min={0}
                      value={form.hwidResetValue}
                      onChange={e => handleChange('hwidResetValue', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Minimum Username Length</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={1}
                    value={form.minUsernameLength}
                    onChange={e => handleChange('minUsernameLength', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>

            {/* Session Management */}
            <div style={cardStyle}>
              <div style={cardTitleStyle}>
                <Clock size={18} style={{ color: '#7c5bf5' }} />
                Session Management
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Session Expiry Unit</label>
                  <select
                    style={selectStyle}
                    value={form.sessionExpiryUnit}
                    onChange={e => handleChange('sessionExpiryUnit', e.target.value)}
                  >
                    <option value="Minutes">Minutes</option>
                    <option value="Hours">Hours</option>
                    <option value="Days">Days</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Session Expiry Duration</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={1}
                    value={form.sessionExpiryValue}
                    onChange={e => handleChange('sessionExpiryValue', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>

            {/* Custom Domain */}
            <div style={cardStyle}>
              <div style={cardTitleStyle}>
                <Globe size={18} style={{ color: '#7c5bf5' }} />
                Custom Domain — API
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Current Custom Domain</label>
                  <div style={{
                    padding: '10px 14px',
                    background: '#0a0a0f',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: form.customDomain ? '#00d4aa' : '#6b7280',
                  }}>
                    {form.customDomain || 'You do not have a custom domain set up. Click on \'Add Domain\' to get started'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button
                    onClick={() => { handleChange('customDomain', ''); toast.success('Domain removed. Save to apply.'); }}
                    style={{
                      padding: '10px 20px',
                      background: form.customDomain ? 'rgba(255,71,87,0.1)' : 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,71,87,0.2)',
                      borderRadius: 8,
                      color: form.customDomain ? '#ff4757' : '#6b7280',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: '0.2s',
                    }}
                  >
                    Remove Domain
                  </button>
                  <button
                    onClick={() => {
                      const domain = prompt('Enter custom domain (e.g. api.yourdomain.com):');
                      if (domain) {
                        handleChange('customDomain', domain);
                        toast.success('Domain set. Save to apply.');
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #7c5bf5, #6344e8)',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: '0.2s',
                    }}
                  >
                    Add Domain
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '12px 32px',
                  background: saving ? '#5a42c2' : 'linear-gradient(135deg, #7c5bf5, #6344e8)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(124,91,245,0.3)',
                  transition: '0.2s',
                }}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,91,245,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { if (!saving) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,91,245,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'config' && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🚧</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>
              {tabs.find(t => t.key === activeTab)?.label} — Coming Soon
            </div>
            <div style={{ fontSize: 13 }}>This section is under development.</div>
          </div>
        </div>
      )}
    </div>
  );
}
