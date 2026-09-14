const express = require('express');
const router = express.Router();
const v2Service = require('../services/v2Service');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || req.ip;
}

// Handler wrapper to catch errors and return consistent JSON format
const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    res.json(result);
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({
      success: false,
      code: err.code || 'ERROR',
      message: err.message || 'An unexpected error occurred.',
      ...(err.update ? { update: err.update } : {}),
    });
  }
};

// 1. Handshake / Init
router.post('/init', handle(async (req) => {
  const { app_id, secret, version, hash } = req.body;
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return await v2Service.init({ appId: app_id, secret, version, hash, ip, userAgent });
}));

// 2. Single-Key License Login
router.post('/license', handle(async (req) => {
  const { session_token, key, hwid } = req.body;
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return await v2Service.licenseLogin({ sessionToken: session_token, key, hwid, ip, userAgent });
}));

// 3. User Register
router.post('/register', handle(async (req) => {
  const { session_token, username, password, key, hwid } = req.body;
  const ip = getClientIp(req);
  return await v2Service.registerUser({ sessionToken: session_token, username, password, key, hwid, ip });
}));

// 4. User Login
router.post('/login', handle(async (req) => {
  const { session_token, username, password, hwid } = req.body;
  const ip = getClientIp(req);
  return await v2Service.loginUser({ sessionToken: session_token, username, password, hwid, ip });
}));

// 5. Check Session / Heartbeat
router.post('/check', handle(async (req) => {
  const { session_token } = req.body;
  const session = await v2Service.getSession(session_token);
  return { success: true, message: 'Session is active', expires_at: session.expiresAt };
}));

// 6. Cloud Variable: Get
router.post('/var/get', handle(async (req) => {
  const { session_token, name } = req.body;
  return await v2Service.getVariable({ sessionToken: session_token, name });
}));

// 7. Cloud Variable: Set
router.post('/var/set', handle(async (req) => {
  const { session_token, name, value } = req.body;
  return await v2Service.setVariable({ sessionToken: session_token, name, value });
}));

// 8. Log Telemetry
router.post('/log', handle(async (req) => {
  const { session_token, message, level } = req.body;
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return await v2Service.clientLog({ sessionToken: session_token, message, level, ip, userAgent });
}));

// 9. HWID Reset
router.post('/hwid/reset', handle(async (req) => {
  const { session_token, key } = req.body;
  return await v2Service.resetHWID({ sessionToken: session_token, key });
}));

// 10. Chat: Get
router.get('/chat', handle(async (req) => {
  const { session_token, channel } = req.query;
  return await v2Service.getChat({ sessionToken: session_token, channel });
}));

// 11. Chat: Send
router.post('/chat', handle(async (req) => {
  const { session_token, channel, sender, message } = req.body;
  return await v2Service.sendChat({ sessionToken: session_token, channel, sender, message });
}));

module.exports = router;
