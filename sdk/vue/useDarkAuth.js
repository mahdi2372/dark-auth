import { ref, reactive } from 'vue';

export function useDarkAuth({ appId, secret, version = '1.0.0', apiUrl }) {
  const sessionToken = ref(null);
  const isAuthenticated = ref(false);
  const licenseInfo = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const getHwid = () => {
    let id = localStorage.getItem('darkauth_vue_hwid');
    if (!id) {
      id = 'vue_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('darkauth_vue_hwid', id);
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
    loading.value = true;
    error.value = null;
    try {
      const data = await request('/init', { app_id: appId, secret, version });
      sessionToken.value = data.session_token;
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

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
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getVar = async (name) => {
    const data = await request('/var/get', { session_token: sessionToken.value, name });
    return data.value;
  };

  return {
    sessionToken,
    isAuthenticated,
    licenseInfo,
    loading,
    error,
    init,
    license,
    getVar,
  };
}
