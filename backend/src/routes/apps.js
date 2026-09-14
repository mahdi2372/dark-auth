const express = require('express');
const router = express.Router();
const appService = require('../services/appService');
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// POST /api/apps — Create application
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Application name is required.' });
    }

    const app = await appService.createApp(req.user.id, { name, description });

    await auditService.logAction({
      userId: req.user.id,
      action: 'APP_CREATE',
      resourceType: 'application',
      resourceId: app.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { name },
    });

    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/apps — List all apps
router.get('/', async (req, res) => {
  try {
    const apps = await appService.listApps(req.user.id);
    res.json(apps);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/apps/:id — Get app detail
router.get('/:id', async (req, res) => {
  try {
    const app = await appService.getApp(req.user.id, req.params.id);
    res.json(app);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/apps/:id/stats — Get app statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await appService.getAppStats(req.user.id, req.params.id);
    res.json(stats);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PUT /api/apps/:id — Update app
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const app = await appService.updateApp(req.user.id, req.params.id, { name, description });

    await auditService.logAction({
      userId: req.user.id,
      action: 'APP_UPDATE',
      resourceType: 'application',
      resourceId: app.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/apps/:id — Delete app
router.delete('/:id', async (req, res) => {
  try {
    await appService.deleteApp(req.user.id, req.params.id);

    await auditService.logAction({
      userId: req.user.id,
      action: 'APP_DELETE',
      resourceType: 'application',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Application deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/apps/:id/regenerate-secret — Regenerate app secret
router.post('/:id/regenerate-secret', async (req, res) => {
  try {
    const app = await appService.regenerateSecret(req.user.id, req.params.id);

    await auditService.logAction({
      userId: req.user.id,
      action: 'APP_REGENERATE_SECRET',
      resourceType: 'application',
      resourceId: app.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
