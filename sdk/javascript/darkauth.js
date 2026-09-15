/**
 * DARK-AUTH Official JavaScript / TypeScript SDK
 * Universal client for Node.js, Browsers, React, Vue, Electron, and React Native.
 */

class DarkAuth {
  /**
   * @param {Object} config
   * @param {string} config.appId
   * @param {string} config.secret
   * @param {string} [config.version='1.0.0']
   * @param {string} config.apiUrl
   */
  constructor({ appId, secret, version = '1.0.0', apiUrl }) {
    this.appId = appId;
    this.secret = secret;
    this.version = version;
    this.apiUrl = apiUrl.replace(/\/+$/, '');
    this.sessionToken = null;
    this.hwid = this.detectHWID();
    this.user = null;
    this.licenseInfo = null;
  }

  detectHWID() {
    if (typeof window !== 'undefined' && window.localStorage) {
      let id = localStorage.getItem('darkauth_hwid');
      if (!id) {
        id = 'web_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('darkauth_hwid', id);
      }
      return id;
    }
    return 'node_client_' + process.platform + '_' + (process.env.USER || process.env.USERNAME || 'unknown');
  }

  async _request(endpoint, body = {}) {
    const url = `${this.apiUrl}/${endpoint.replace(/^\/+/, '')}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.success) {
      const err = new Error(data.message || 'Request failed');
      err.code = data.code || 'ERROR';
      err.update = data.update;
      throw err;
    }
    return data;
  }

  /**
   * Initialize connection, anti-tamper hash, and auto-updater check
   */
  async init(hash = null) {
    const data = await this._request('/init', {
      app_id: this.appId,
      secret: this.secret,
      version: this.version,
      hash,
    });
    this.sessionToken = data.session_token;
    return data;
  }

  /**
   * Direct License Authentication (KeyAuth style)
   */
  async license(key) {
    if (!this.sessionToken) await this.init();
    const data = await this._request('/license', {
      session_token: this.sessionToken,
      key: key.trim(),
      hwid: this.hwid,
    });
    this.licenseInfo = data;
    return data;
  }

  /**
   * User Login
   */
  async login(username, password) {
    if (!this.sessionToken) await this.init();
    const data = await this._request('/login', {
      session_token: this.sessionToken,
      username,
      password,
      hwid: this.hwid,
    });
    this.user = data.user;
    return data;
  }

  /**
   * User Registration with License Key
   */
  async register(username, password, key) {
    if (!this.sessionToken) await this.init();
    const data = await this._request('/register', {
      session_token: this.sessionToken,
      username,
      password,
      key: key.trim(),
      hwid: this.hwid,
    });
    this.user = data.user;
    return data;
  }

  /**
   * Check Session Heartbeat
   */
  async check() {
    if (!this.sessionToken) return false;
    try {
      const data = await this._request('/check', { session_token: this.sessionToken });
      return !!data.success;
    } catch {
      return false;
    }
  }

  /**
   * Cloud Variable: Get
   */
  async getVar(name) {
    const data = await this._request('/var/get', { session_token: this.sessionToken, name });
    return data.value;
  }

  /**
   * Cloud Variable: Set
   */
  async setVar(name, value) {
    return await this._request('/var/set', { session_token: this.sessionToken, name, value });
  }

  /**
   * Client Telemetry Log
   */
  async log(message, level = 'INFO') {
    return await this._request('/log', { session_token: this.sessionToken, message, level });
  }

  /**
   * Reset HWID
   */
  async resetHWID(key) {
    return await this._request('/hwid/reset', { session_token: this.sessionToken, key });
  }

  /**
   * Get in-app announcements & chat messages
   */
  async getChat(channel = 'general') {
    const url = `${this.apiUrl}/chat?session_token=${this.sessionToken}&channel=${encodeURIComponent(channel)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.messages || [];
  }

  /**
   * Send in-app chat message
   */
  async sendChat(sender, message, channel = 'general') {
    return await this._request('/chat', {
      session_token: this.sessionToken,
      channel,
      sender,
      message,
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkAuth;
}
if (typeof window !== 'undefined') {
  window.DarkAuth = DarkAuth;
}
