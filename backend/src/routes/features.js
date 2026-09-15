const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

// Protect all dashboard feature routes with JWT authentication
router.use(authenticate);

// ============================================
// CLOUD VARIABLES
// ============================================
router.get('/variables', async (req, res) => {
  try {
    const { appId } = req.query;
    const where = appId ? { appId } : {};
    const variables = await prisma.cloudVariable.findMany({
      where,
      include: { application: { select: { name: true, appId: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ variables });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/variables', async (req, res) => {
  try {
    const { appId, name, value, isSecret, userWriteable } = req.body;
    if (!appId || !name || value === undefined) {
      return res.status(400).json({ error: 'App, name, and value are required.' });
    }

    const app = await prisma.application.findFirst({ where: { id: appId, userId: req.user.id } });
    if (!app) return res.status(404).json({ error: 'Application not found or access denied.' });

    const variable = await prisma.cloudVariable.upsert({
      where: { appId_name: { appId, name } },
      update: { value, isSecret: !!isSecret, userWriteable: !!userWriteable },
      create: { appId, name, value, isSecret: !!isSecret, userWriteable: !!userWriteable },
    });

    res.json({ success: true, variable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/variables/:id', async (req, res) => {
  try {
    const variable = await prisma.cloudVariable.findUnique({ where: { id: req.params.id } });
    if (!variable) return res.status(404).json({ error: 'Variable not found.' });
    const app = await prisma.application.findFirst({ where: { id: variable.appId, userId: req.user.id } });
    if (!app) return res.status(403).json({ error: 'Access denied.' });
    await prisma.cloudVariable.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Variable deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// BLACKLIST
// ============================================
router.get('/blacklist', async (req, res) => {
  try {
    const list = await prisma.blacklist.findMany({ orderBy: { bannedAt: 'desc' } });
    res.json({ blacklist: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/blacklist', async (req, res) => {
  try {
    const { type, value, reason } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: 'Type (IP/HWID) and value are required.' });
    }

    const item = await prisma.blacklist.upsert({
      where: { value },
      update: { type, reason, bannedAt: new Date() },
      create: { type, value, reason },
    });

    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/blacklist/:id', async (req, res) => {
  try {
    await prisma.blacklist.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Removed from blacklist.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WEBHOOKS
// ============================================
router.get('/webhooks', async (req, res) => {
  try {
    const { appId } = req.query;
    const where = appId ? { appId } : {};
    const webhooks = await prisma.webhook.findMany({
      where,
      include: { application: { select: { name: true, appId: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ webhooks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhooks', async (req, res) => {
  try {
    const { appId, name, url, triggerEvent, isEnabled } = req.body;
    if (!appId || !name || !url) {
      return res.status(400).json({ error: 'App, name, and URL are required.' });
    }

    const app = await prisma.application.findFirst({ where: { id: appId, userId: req.user.id } });
    if (!app) return res.status(404).json({ error: 'Application not found or access denied.' });

    const webhook = await prisma.webhook.create({
      data: {
        appId,
        name,
        url,
        triggerEvent: triggerEvent || 'all',
        isEnabled: isEnabled !== undefined ? !!isEnabled : true,
      },
    });

    res.json({ success: true, webhook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/webhooks/:id', async (req, res) => {
  try {
    const webhook = await prisma.webhook.findUnique({ where: { id: req.params.id } });
    if (!webhook) return res.status(404).json({ error: 'Webhook not found.' });
    const app = await prisma.application.findFirst({ where: { id: webhook.appId, userId: req.user.id } });
    if (!app) return res.status(403).json({ error: 'Access denied.' });
    await prisma.webhook.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Webhook deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/webhooks/:id', async (req, res) => {
  try {
    const webhook = await prisma.webhook.findUnique({ where: { id: req.params.id } });
    if (!webhook) return res.status(404).json({ error: 'Webhook not found.' });
    const app = await prisma.application.findFirst({ where: { id: webhook.appId, userId: req.user.id } });
    if (!app) return res.status(403).json({ error: 'Access denied.' });

    const { name, url, triggerEvent, isEnabled } = req.body;
    const updated = await prisma.webhook.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(triggerEvent !== undefined && { triggerEvent }),
        ...(isEnabled !== undefined && { isEnabled: !!isEnabled }),
      },
    });
    res.json({ success: true, webhook: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhooks/test/:id', async (req, res) => {
  try {
    const webhook = await prisma.webhook.findUnique({ where: { id: req.params.id } });
    if (!webhook) return res.status(404).json({ error: 'Webhook not found.' });

    const isDiscord = webhook.url.includes('discord.com/api/webhooks');
    const data = isDiscord
      ? {
          embeds: [
            {
              title: '🧪 DARK-AUTH Webhook Test',
              description: 'This is a test notification from your DARK-AUTH dashboard.',
              color: 0x3b82f6,
              timestamp: new Date().toISOString(),
              footer: { text: 'DARK-AUTH' },
            },
          ],
        }
      : { event: 'test', message: 'DARK-AUTH test webhook', timestamp: new Date().toISOString() };

    const resp = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(`HTTP status ${resp.status}`);
    res.json({ success: true, message: 'Test message sent successfully.' });
  } catch (err) {
    res.status(400).json({ error: `Delivery failed: ${err.message}` });
  }
});

// ============================================
// APP USERS (End-Users inside client apps)
// ============================================
router.post('/app-users', async (req, res) => {
  try {
    const { appId, username, password, email, subLevel, expiresAt, hwidLocked } = req.body;
    if (!appId || !username || !password) {
      return res.status(400).json({ error: 'App ID, username, and password are required.' });
    }

    const app = await prisma.application.findFirst({ where: { id: appId, userId: req.user.id } });
    if (!app) return res.status(404).json({ error: 'Application not found or access denied.' });

    const existingUser = await prisma.appUser.findUnique({
      where: { appId_username: { appId, username } },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists for this application.' });
    }

    const { hashPassword } = require('../utils/password');
    const passwordHash = await hashPassword(password);

    const user = await prisma.appUser.create({
      data: {
        appId,
        username,
        email: email || null,
        passwordHash,
        subLevel: parseInt(subLevel || 1, 10),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        hwidLocked: hwidLocked !== undefined ? !!hwidLocked : true,
      },
    });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/app-users', async (req, res) => {
  try {
    const { appId } = req.query;
    const where = appId ? { appId } : {};
    const users = await prisma.appUser.findMany({
      where,
      include: {
        application: { select: { name: true, appId: true } },
        license: { select: { key: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/app-users/:id/ban', async (req, res) => {
  try {
    const { isBanned, banReason } = req.body;
    const user = await prisma.appUser.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'App user not found.' });
    const app = await prisma.application.findFirst({ where: { id: user.appId, userId: req.user.id } });
    if (!app) return res.status(403).json({ error: 'Access denied.' });
    const updated = await prisma.appUser.update({
      where: { id: req.params.id },
      data: { isBanned: !!isBanned, banReason: banReason || null },
    });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/app-users/:id', async (req, res) => {
  try {
    const user = await prisma.appUser.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'App user not found.' });
    const app = await prisma.application.findFirst({ where: { id: user.appId, userId: req.user.id } });
    if (!app) return res.status(403).json({ error: 'Access denied.' });
    await prisma.appUser.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'App user deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
