import { ref, computed } from 'vue';

/**
 * DARK-AUTH Vue Composable v2.0.0
 *
 * Reactive composable for the DARK-AUTH V2 API.
 * Supports: Init, License Auth, User Login/Register, Cloud Variables, Chat, Logging, HWID lock.
 *
 * Usage:
 *   const { sessionToken, isAuthenticated, loading, error, init, license, login, register,
 *           check, getVar, setVar, log, resetHWID, getChat, sendChat } = useDarkAuth({
 *     appId: 'YOUR_APP_ID',
 *     secret: 'YOUR_SECRET',
 *     apiUrl: 'https://your-api-url.com',
 *   });
 */
export function useDarkAuth({ appId, secret, apiUrl, version = '2.0.0' }) {
  const sessionToken = ref(null);
  const isAuthenticated = ref(false);
  const user = ref(null);
  const licenseInfo = ref(null);
  const updateInfo = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const baseUrl = apiUrl.replace(/\/+$/, '') + '/api/v2';

  /** Generate or retrieve a persistent HWID from localStorage. */
  const getHwid = () => {
    let id = localStorage.getItem('darkauth_hwid');
    if (!id) {
      id = 'vue_' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      localStorage.setItem('darkauth_hwid', id);
    }
    return id;
  };

  /** Internal request helper. */
  const request = async (endpoint, body = null, method = 'POST') => {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${baseUrl}/${endpoint.replace(/^\/+/, '')}`, options);
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'DarkAuth request failed');
    }
    return data;
  };

  /** Initialize a session with the DARK-AUTH API. */
  const init = async (hash = null) => {
    loading.value = true;
    error.value = null;
    try {
      const payload = { app_id: appId, secret, version };
      if (hash) payload.hash = hash;
      const data = await request('/init', payload);
      sessionToken.value = data.session_token;
      if (data.update?.available) updateInfo.value = data.update;
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** Authenticate with a license key. */
  const license = async (key) => {
    loading.value = true;
    error.value = null;
    try {
      if (!sessionToken.value) await init();
      const data = await request('/license', {
        session_token: sessionToken.value,
        key: key.trim(),
        hwid: getHwid(),
      });
      isAuthenticated.value = true;
      licenseInfo.value = data;
      if (data.user) user.value = data.user;
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** Log in with username and password. */
  const login = async (username, password) => {
    loading.value = true;
    error.value = null;
    try {
      if (!sessionToken.value) await init();
      const data = await request('/login', {
        session_token: sessionToken.value,
        username,
        password,
        hwid: getHwid(),
      });
      isAuthenticated.value = true;
      user.value = data.user || { username };
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** Register a new account with a license key. */
  const register = async (username, password, key) => {
    loading.value = true;
    error.value = null;
    try {
      if (!sessionToken.value) await init();
      const data = await request('/register', {
        session_token: sessionToken.value,
        username,
        password,
        key: key.trim(),
        hwid: getHwid(),
      });
      isAuthenticated.value = true;
      user.value = data.user || { username };
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** Check if the current session is still valid. */
  const check = async () => {
    if (!sessionToken.value) return false;
    try {
      const data = await request('/check', { session_token: sessionToken.value });
      return !!data.success;
    } catch {
      return false;
    }
  };

  /** Get a cloud variable value. */
  const getVar = async (name) => {
    const data = await request('/var/get', { session_token: sessionToken.value, name });
    return data.value;
  };

  /** Set a cloud variable value. */
  const setVar = async (name, value) => {
    return request('/var/set', { session_token: sessionToken.value, name, value });
  };

  /** Send a log entry. */
  const log = async (message, level = 'INFO') => {
    return request('/log', { session_token: sessionToken.value, message, level });
  };

  /** Request a HWID reset for a key. */
  const resetHWID = async (key) => {
    return request('/hwid/reset', { session_token: sessionToken.value, key });
  };

  /** Get chat messages from a channel. */
  const getChat = async (channel = 'general') => {
    const qs = new URLSearchParams({ session_token: sessionToken.value, channel }).toString();
    const res = await fetch(`${baseUrl}/chat?${qs}`);
    const data = await res.json();
    return data.messages || [];
  };

  /** Send a chat message. */
  const sendChat = async (sender, message, channel = 'general') => {
    return request('/chat', { session_token: sessionToken.value, channel, sender, message });
  };

  return {
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
  };
}
