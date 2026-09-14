const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../utils/prisma');
const clientService = require('../services/clientService');
const appService = require('../services/appService');
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/auth');
const { clientLimiter } = require('../middleware/rateLimiter');
const config = require('../config');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = config.upload.dir;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
});

// ===== PUBLIC ENDPOINTS =====

// POST /api/client/activate — Activate a client
router.post('/activate', clientLimiter, async (req, res) => {
  try {
    const { licenseKey, appId, hwid } = req.body;
    if (!licenseKey || !appId) {
      return res.status(400).json({ error: 'License key and app ID are required.' });
    }

    const result = await clientService.activateClient({
      licenseKey,
      appId,
      hwid,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await auditService.logAction({
      action: 'CLIENT_ACTIVATE',
      resourceType: 'activation',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { appId, success: result.success },
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/client/verify-activation — Verify activation token
router.post('/verify-activation', clientLimiter, async (req, res) => {
  try {
    const { activationToken } = req.body;
    if (!activationToken) {
      return res.status(400).json({ error: 'Activation token is required.' });
    }

    const result = await clientService.verifyActivation(activationToken);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/client/latest-version/:appId — Get latest version (public)
router.get('/latest-version/:appId', clientLimiter, async (req, res) => {
  try {
    const version = await clientService.getLatestVersion(req.params.appId);
    if (!version) {
      return res.status(404).json({ error: 'No versions available.' });
    }
    res.json(version);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/client/check-update — Check for updates (public)
router.get('/check-update', clientLimiter, async (req, res) => {
  try {
    const { appId, currentVersion } = req.query;
    if (!appId || !currentVersion) {
      return res.status(400).json({ error: 'appId and currentVersion are required.' });
    }

    const result = await clientService.checkUpdate({ appId, currentVersion });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/client/download/:versionId — Download a version file
router.get('/download/:versionId', async (req, res) => {
  try {
    const version = await prisma.clientVersion.findUnique({ where: { id: req.params.versionId } });

    if (!version) {
      return res.status(404).json({ error: 'Version not found.' });
    }

    if (version.filePath && fs.existsSync(version.filePath)) {
      return res.download(version.filePath);
    }

    if (version.downloadUrl) {
      return res.redirect(version.downloadUrl);
    }

    res.status(404).json({ error: 'No file available for this version.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== AUTHENTICATED ENDPOINTS =====

// GET /api/client/versions/:appId — List all versions (owner)
router.get('/versions/:appDbId', authenticate, async (req, res) => {
  try {
    const versions = await clientService.listVersions(req.params.appDbId);
    res.json(versions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/client/versions — Create new version (with optional file upload)
router.post('/versions', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { appDbId, version, releaseNotes, downloadUrl } = req.body;
    if (!appDbId || !version) {
      return res.status(400).json({ error: 'App ID and version are required.' });
    }

    // Verify ownership
    await appService.getApp(req.user.id, appDbId);

    const data = {
      appDbId,
      version,
      releaseNotes,
      downloadUrl,
    };

    if (req.file) {
      data.filePath = req.file.path;
      data.fileSize = req.file.size;
    }

    const versionRecord = await clientService.createVersion(data);

    await auditService.logAction({
      userId: req.user.id,
      action: 'VERSION_CREATE',
      resourceType: 'client_version',
      resourceId: versionRecord.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { appDbId, version },
    });

    res.status(201).json(versionRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/client/versions/:versionId — Delete version
router.delete('/versions/:versionId', authenticate, async (req, res) => {
  try {
    const version = await prisma.clientVersion.findUnique({ where: { id: req.params.versionId } });
    if (!version) return res.status(404).json({ error: 'Version not found.' });
    const app = await prisma.application.findFirst({ where: { id: version.appId, userId: req.user.id } });
    if (!app) return res.status(403).json({ error: 'Access denied.' });

    await clientService.deleteVersion(req.params.versionId);

    await auditService.logAction({
      userId: req.user.id,
      action: 'VERSION_DELETE',
      resourceType: 'client_version',
      resourceId: req.params.versionId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Version deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
