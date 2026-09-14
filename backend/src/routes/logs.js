const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/auth');

// GET /api/logs — Get audit logs
router.get('/', authenticate, async (req, res) => {
  try {
    const { action, resourceType, page, limit } = req.query;

    const result = await auditService.getLogs({
      userId: req.user.role === 'ADMIN' ? undefined : req.user.id,
      action,
      resourceType,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '50', 10),
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
