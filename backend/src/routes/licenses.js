const express = require('express');
const router = express.Router();
const licenseService = require('../services/licenseService');
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/auth');
const { clientLimiter } = require('../middleware/rateLimiter');

// POST /api/licenses/verify — Public endpoint
router.post('/verify', clientLimiter, async (req, res) => {
  try {
    const { licenseKey, appId, hwid } = req.body;
    if (!licenseKey || !appId) {
      return res.status(400).json({ error: 'License key and app ID are required.' });
    }

    const result = await licenseService.verifyLicense({ licenseKey, appId, hwid });

    await auditService.logAction({
      action: 'LICENSE_VERIFY',
      resourceType: 'license',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { licenseKey, appId, valid: result.valid },
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// All routes below require authentication
router.use(authenticate);

// POST /api/licenses — Create single license
router.post('/', async (req, res) => {
  try {
    const { appId, licenseType, expiresInDays, maxUses, hwid, note } = req.body;
    if (!appId) {
      return res.status(400).json({ error: 'Application ID is required.' });
    }

    const license = await licenseService.createLicense({
      appId,
      licenseType,
      expiresInDays,
      maxUses,
      hwid,
      note,
    });

    await auditService.logAction({
      userId: req.user.id,
      action: 'LICENSE_CREATE',
      resourceType: 'license',
      resourceId: license.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { appId, licenseType },
    });

    res.status(201).json(license);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/licenses/bulk — Bulk create licenses
router.post('/bulk', async (req, res) => {
  try {
    const { appId, count, licenseType, expiresInDays, maxUses } = req.body;
    if (!appId || !count) {
      return res.status(400).json({ error: 'Application ID and count are required.' });
    }

    const licenses = await licenseService.bulkCreateLicenses({
      appId,
      count: parseInt(count, 10),
      licenseType,
      expiresInDays,
      maxUses,
    });

    await auditService.logAction({
      userId: req.user.id,
      action: 'LICENSE_BULK_CREATE',
      resourceType: 'license',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { appId, count: licenses.length },
    });

    res.status(201).json({ count: licenses.length, licenses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/licenses — List licenses (requires appId query param)
router.get('/', async (req, res) => {
  try {
    const { appId, status, licenseType, search, page, limit } = req.query;
    if (!appId) {
      return res.status(400).json({ error: 'appId query parameter is required.' });
    }

    const result = await licenseService.listLicenses({
      appId,
      status,
      licenseType,
      search,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '50', 10),
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/licenses/:id/ban
router.put('/:id/ban', async (req, res) => {
  try {
    const license = await licenseService.banLicense(req.params.id);

    await auditService.logAction({
      userId: req.user.id,
      action: 'LICENSE_BAN',
      resourceType: 'license',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(license);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/licenses/:id/unban
router.put('/:id/unban', async (req, res) => {
  try {
    const license = await licenseService.unbanLicense(req.params.id);

    await auditService.logAction({
      userId: req.user.id,
      action: 'LICENSE_UNBAN',
      resourceType: 'license',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(license);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/licenses/:id
router.delete('/:id', async (req, res) => {
  try {
    await licenseService.deleteLicense(req.params.id);

    await auditService.logAction({
      userId: req.user.id,
      action: 'LICENSE_DELETE',
      resourceType: 'license',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'License deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
