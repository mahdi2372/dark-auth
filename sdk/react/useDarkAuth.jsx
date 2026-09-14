import React, { createContext, useContext, useState, useEffect } from 'react';

const DarkAuthContext = createContext(null);

export function DarkAuthProvider({ appId, secret, version = '1.0.0', apiUrl, children }) {
  const [sessionToken, setSessionToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHwid = () => {
    let id = localStorage.getItem('darkauth_client_hwid');
    if (!id) {
      id = 'react_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('darkauth_client_hwid', id);
    }
    return id;
  };

  const request = async (endpoint, body = {}) => {
    const url = `${apiUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'DarkAuth request failed');
    }
    return data;
  };

  const init = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request('/init', { app_id: appId, secret, version });
      setSessionToken(data.session_token);
      if (data.update?.available) setUpdateInfo(data.update);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const license = async (key) => {
    setLoading(true);
    setError(null);
    try {
      let token = sessionToken;
      if (!token) {
        const initData = await init();
        token = initData.session_token;
      }
      const data = await request('/license', {
        session_token: token,
        key: key.trim(),
        hwid: getHwid(),
      });
      setIsAuthenticated(true);
      setLicenseInfo(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getVar = async (name) => {
    const data = await request('/var/get', { session_token: sessionToken, name });
    return data.value;
  };

  return (
    <DarkAuthContext.Provider
      value={{
        sessionToken,
        isAuthenticated,
        user,
        licenseInfo,
        updateInfo,
        loading,
        error,
        init,
        license,
        getVar,
      }}
    >
      {children}
    </DarkAuthContext.Provider>
  );
}

export function useDarkAuth() {
  const context = useContext(DarkAuthContext);
  if (!context) throw new Error('useDarkAuth must be used within DarkAuthProvider');
  return context;
}

export function DarkAuthModal({ isOpen, onClose, onSuccess }) {
  const { license, loading, error } = useDarkAuth();
  const [key, setKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await license(key);
      if (onSuccess) onSuccess(res);
      if (onClose) onClose();
    } catch (err) {
      // Handled by context
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#111827', border: '1px solid #ef4444', borderRadius: '16px',
        padding: '28px', width: '100%', maxWidth: '420px', color: '#fff'
      }}>
        <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>🔐 Software Activation</h3>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
          Please enter your product license key to unlock this application.
        </p>
        {error && (
          <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            style={{
              width: '100%', padding: '12px', background: '#1f2937', border: '1px solid #374151',
              borderRadius: '8px', color: '#fff', fontSize: '15px', marginBottom: '16px'
            }}
            required
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '10px 18px', background: '#374151', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px', background: '#ef4444', color: '#fff', borderRadius: '8px',
                border: 'none', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {loading ? 'Validating...' : 'Activate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
