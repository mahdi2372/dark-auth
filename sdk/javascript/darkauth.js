/**
 * DARK-AUTH Official JavaScript SDK v2.0.0
 * Universal client for Node.js, Browsers, React, Vue, Electron, and React Native.
 */

class DarkAuth {
  /**
   * @param {Object} config
   * @param {string} config.appId - Application ID
   * @param {string} config.secret - Application secret
   * @param {string} config.apiUrl - API base URL
   * @param {string} [config.version='2.0.0'] - Client version
   */
  constructor({ appId, secret, apiUrl, version = '2.0.0' }) {
    this.appId = appId;
    this.secret = secret;
    this.version = version;
    this.apiUrl = apiUrl.replace(/\/+$/, '');
    this.sessionToken = null;
    this.hwid = this._detectHWID();
    this.user = null;
    this.licenseInfo = null;
  }

  /** Generate or retrieve a persistent hardware identifier. */
  _detectHWID() {
    if (typeof window !== 'undefined' && window.localStorage) {
      let id = localStorage.getItem('darkauth_hwid');
      if (!id) {
        id = 'web_' + this._randomHex(32);
        localStorage.setItem('darkauth_hwid', id);
      }
      return id;
    }
    if (typeof process !== 'undefined' && process.platform) {
      return 'node_' + process.platform + '_' + (process.env.USER || process.env.USERNAME || 'unknown');
    }
    return 'client_' + this._randomHex(32);
  }

  /** Generate a random hex string of the given bit length. */
  _randomHex(bits) {
    let result = '';
    for (let i = 0; i < bits; i++) {
      result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
  }

  /** Build the full URL for an API v2 endpoint. */
  _url(endpoint) {
    return `${this.apiUrl}/api/v2/${endpoint.replace(/^\/+/, '')}`;
  }

  /** Send a POST request to the API. */
  async _post(endpoint, body = {}) {
    const response = await fetch(this._url(endpoint), {
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

  /** Send a GET request to the API. */
  async _get(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${this._url(endpoint)}${qs ? '?' + qs : ''}`;
    const response = await fetch(url);
    return response.json();
  }

  /**
   * Initialize a session with the DARK-AUTH API.
   * @param {string|null} [hash=null] - SHA-256 hash of the client binary
   * @returns {Promise<Object>} Init response with session_token and optional update info
   */
  async init(hash = null) {
    const payload = {
      app_id: this.appId,
      secret: this.secret,
      version: this.version,
    };
    if (hash) payload.hash = hash;
    const data = await this._post('/init', payload);
    this.sessionToken = data.session_token;
    return data;
  }

  /**
   * Authenticate with a license key.
   * @param {string} key - License key
   * @returns {Promise<Object>} Auth response with level and status
   */
  async license(key) {
    if (!this.sessionToken) await this.init();
    const data = await this._post('/license', {
      session_token: this.sessionToken,
      key: key.trim(),
      hwid: this.hwid,
    });
    this.licenseInfo = data;
    this.user = data.user || null;
    return data;
  }

  /**
   * Log in with username and password.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Object>} Auth response
   */
  async login(username, password) {
    if (!this.sessionToken) await this.init();
    const data = await this._post('/login', {
      session_token: this.sessionToken,
      username,
      password,
      hwid: this.hwid,
    });
    this.user = data.user || null;
    return data;
  }

  /**
   * Register a new user account.
   * @param {string} username
   * @param {string} password
   * @param {string} key - License key
   * @returns {Promise<Object>} Registration response
   */
  async register(username, password, key) {
    if (!this.sessionToken) await this.init();
    const data = await this._post('/register', {
      session_token: this.sessionToken,
      username,
      password,
      key: key.trim(),
      hwid: this.hwid,
    });
    this.user = data.user || null;
    return data;
  }

  /**
   * Check if the current session is still valid.
   * @returns {Promise<boolean>}
   */
  async check() {
    if (!this.sessionToken) return false;
    try {
      const data = await this._post('/check', { session_token: this.sessionToken });
      return !!data.success;
    } catch {
      return false;
    }
  }

  /**
   * Get a cloud variable value.
   * @param {string} name - Variable name
   * @returns {Promise<string>}
   */
  async getVar(name) {
    const data = await this._post('/var/get', { session_token: this.sessionToken, name });
    return data.value;
  }

  /**
   * Set a cloud variable value.
   * @param {string} name - Variable name
   * @param {string} value - New value
   * @returns {Promise<Object>}
   */
  async setVar(name, value) {
    return this._post('/var/set', { session_token: this.sessionToken, name, value });
  }

  /**
   * Send a log entry to the API.
   * @param {string} message - Log message
   * @param {string} [level='INFO'] - Log level
   * @returns {Promise<Object>}
   */
  async log(message, level = 'INFO') {
    return this._post('/log', { session_token: this.sessionToken, message, level });
  }

  /**
   * Request a HWID reset for a key.
   * @param {string} key - License key
   * @returns {Promise<Object>}
   */
  async resetHWID(key) {
    return this._post('/hwid/reset', { session_token: this.sessionToken, key });
  }

  /**
   * Get chat messages from a channel.
   * @param {string} [channel='general']
   * @returns {Promise<Array>}
   */
  async getChat(channel = 'general') {
    const data = await this._get('/chat', { session_token: this.sessionToken, channel });
    return data.messages || [];
  }

  /**
   * Send a chat message.
   * @param {string} sender - Sender name
   * @param {string} message - Message text
   * @param {string} [channel='general']
   * @returns {Promise<Object>}
   */
  async sendChat(sender, message, channel = 'general') {
    return this._post('/chat', {
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
