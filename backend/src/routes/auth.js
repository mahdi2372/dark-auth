const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const result = await authService.register({ username, email, password });

    await auditService.logAction({
      userId: result.user.id,
      action: 'USER_REGISTER',
      resourceType: 'user',
      resourceId: result.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required.' });
    }

    const result = await authService.login({ login, password });

    await auditService.logAction({
      userId: result.user.id,
      action: 'USER_LOGIN',
      resourceType: 'user',
      resourceId: result.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(result);
  } catch (err) {
    await auditService.logAction({
      action: 'USER_LOGIN_FAILED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { login: req.body.login },
    });
    res.status(401).json({ error: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    await authService.updatePassword(req.user.id, currentPassword, newPassword);

    await auditService.logAction({
      userId: req.user.id,
      action: 'PASSWORD_CHANGE',
      resourceType: 'user',
      resourceId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
