const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/stats — Dashboard overview statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's apps
    const apps = await prisma.application.findMany({
      where: { userId },
      select: { id: true },
    });
    const appIds = apps.map((a) => a.id);

    const [
      totalApps,
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      bannedLicenses,
      unusedLicenses,
      totalActivations,
      totalVersions,
      recentLogs,
      recentActivations,
    ] = await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.license.count({ where: { appId: { in: appIds } } }),
      prisma.license.count({ where: { appId: { in: appIds }, status: 'ACTIVE' } }),
      prisma.license.count({ where: { appId: { in: appIds }, status: 'EXPIRED' } }),
      prisma.license.count({ where: { appId: { in: appIds }, status: 'BANNED' } }),
      prisma.license.count({ where: { appId: { in: appIds }, status: 'UNUSED' } }),
      prisma.activation.count({
        where: { license: { appId: { in: appIds } } },
      }),
      prisma.clientVersion.count({ where: { appId: { in: appIds } } }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.activation.findMany({
        where: { license: { appId: { in: appIds } } },
        orderBy: { activatedAt: 'desc' },
        take: 10,
        include: {
          license: { select: { key: true, application: { select: { name: true } } } },
        },
      }),
    ]);

    res.json({
      totalApps,
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      bannedLicenses,
      unusedLicenses,
      totalActivations,
      totalVersions,
      recentLogs,
      recentActivations,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
