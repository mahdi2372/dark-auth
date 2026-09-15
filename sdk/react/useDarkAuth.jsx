import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const DarkAuthContext = createContext(null);

/**
 * DARK-AUTH React Hook Provider v2.0.0
 *
 * Wraps your app with session management, license auth, cloud variables, and chat.
 */
export function DarkAuthProvider({ appId, secret, apiUrl, version = '2.0.0', children }) {
  const [sessionToken, setSessionToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHwid = useCallback(() => {
    let id = localStorage.getItem('darkauth_hwid');
    if (!id) {
      id = 'web_' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      localStorage.setItem('darkauth_hwid', id);
    }
    return id;
  }, []);

  const baseUrl = apiUrl.replace(/\/+$/, '') + '/api/v2';

  const request = useCallback(async (endpoint, body = null, method = 'POST') => {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${baseUrl}/${endpoint.replace(/^\/+/, '')}`, options);
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'DarkAuth request failed');
    }
    return data;
  }, [baseUrl]);

  /** Initialize a session with the DARK-AUTH API. */
  const init = useCallback(async (hash = null) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { app_id: appId, secret, version };
      if (hash) payload.hash = hash;
      const data = await request('/init', payload);
      setSessionToken(data.session_token);
      if (data.update?.available) setUpdateInfo(data.update);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, secret, version, request]);

  /** Authenticate with a license key. */
  const license = useCallback(async (key) => {
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
      if (data.user) setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionToken, init, request, getHwid]);

  /** Log in with username and password. */
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      let token = sessionToken;
      if (!token) {
        const initData = await init();
        token = initData.session_token;
      }
      const data = await request('/login', {
        session_token: token,
        username,
        password,
        hwid: getHwid(),
      });
      setIsAuthenticated(true);
      setUser(data.user || { username });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionToken, init, request, getHwid]);

  /** Register a new account with a license key. */
  const register = useCallback(async (username, password, key) => {
    setLoading(true);
    setError(null);
    try {
      let token = sessionToken;
      if (!token) {
        const initData = await init();
        token = initData.session_token;
      }
      const data = await request('/register', {
        session_token: token,
        username,
        password,
        key: key.trim(),
        hwid: getHwid(),
      });
      setIsAuthenticated(true);
      setUser(data.user || { username });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionToken, init, request, getHwid]);

  /** Check if the current session is still valid. */
  const check = useCallback(async () => {
    if (!sessionToken) return false;
    try {
      const data = await request('/check', { session_token: sessionToken });
      return !!data.success;
    } catch {
      return false;
    }
  }, [sessionToken, request]);

  /** Get a cloud variable value. */
  const getVar = useCallback(async (name) => {
    const data = await request('/var/get', { session_token: sessionToken, name });
    return data.value;
  }, [sessionToken, request]);

  /** Set a cloud variable value. */
  const setVar = useCallback(async (name, value) => {
    return request('/var/set', { session_token: sessionToken, name, value });
  }, [sessionToken, request]);

  /** Send a log entry. */
  const log = useCallback(async (message, level = 'INFO') => {
    return request('/log', { session_token: sessionToken, message, level });
  }, [sessionToken, request]);

  /** Request a HWID reset for a key. */
  const resetHWID = useCallback(async (key) => {
    return request('/hwid/reset', { session_token: sessionToken, key });
  }, [sessionToken, request]);

  /** Get chat messages from a channel. */
  const getChat = useCallback(async (channel = 'general') => {
    const qs = new URLSearchParams({ session_token: sessionToken, channel }).toString();
    const res = await fetch(`${baseUrl}/chat?${qs}`);
    const data = await res.json();
    return data.messages || [];
  }, [sessionToken, baseUrl]);

  /** Send a chat message. */
  const sendChat = useCallback(async (sender, message, channel = 'general') => {
    return request('/chat', { session_token: sessionToken, channel, sender, message });
  }, [sessionToken, request]);

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
        login,
        register,
        check,
        getVar,
        setVar,
        log,
        resetHWID,
        getChat,
        sendChat,
      }}
    >
      {children}
    </DarkAuthContext.Provider>
  );
}

/**
 * React hook to access the DARK-AUTH context.
 */
export function useDarkAuth() {
  const context = useContext(DarkAuthContext);
  if (!context) throw new Error('useDarkAuth must be used within a DarkAuthProvider');
  return context;
}

/**
 * Pre-built license activation modal.
 */
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
    } catch {
      // Error handled by context
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
        <h3 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '18px' }}>DARK-AUTH — Software Activation</h3>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
          Enter your product license key to unlock this application.
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
              borderRadius: '8px', color: '#fff', fontSize: '15px', marginBottom: '16px', boxSizing: 'border-box'
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
                border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.6 : 1
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
