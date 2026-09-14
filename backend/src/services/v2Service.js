const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Dispatch webhooks registered for an application.
 */
async function dispatchWebhook(appId, eventName, payload) {
  try {
    const hooks = await prisma.webhook.findMany({
      where: {
        appId,
        isEnabled: true,
        OR: [{ triggerEvent: 'all' }, { triggerEvent: eventName }],
      },
    });

    for (const hook of hooks) {
      // Format as rich Discord embed if Discord webhook URL
      const isDiscord = hook.url.includes('discord.com/api/webhooks');
      const data = isDiscord
        ? {
            embeds: [
              {
                title: `🛡️ DARK-AUTH Alert: ${eventName.toUpperCase()}`,
                color: eventName === 'on_ban' ? 0xef4444 : 0x10b981,
                fields: Object.entries(payload).map(([k, v]) => ({
                  name: k,
                  value: String(v || 'N/A'),
                  inline: true,
                })),
                timestamp: new Date().toISOString(),
                footer: { text: 'DARK-AUTH Security Engine' },
              },
            ],
          }
        : { event: eventName, payload, timestamp: new Date().toISOString() };

      fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch((err) => {
        console.warn(`[Webhook] Delivery failed to ${hook.url}:`, err.message);
      });
    }
  } catch (err) {
    console.warn('[Webhook] Error dispatching webhooks:', err.message);
  }
}

/**
 * Check if an IP or HWID is blacklisted.
 */
async function checkBlacklist(ip, hwid) {
  const matches = await prisma.blacklist.findFirst({
    where: {
      OR: [
        ip ? { type: 'IP', value: ip } : undefined,
        hwid ? { type: 'HWID', value: hwid } : undefined,
      ].filter(Boolean),
    },
  });
  return matches;
}

/**
 * KeyAuth/Authly compatible v2 API implementation.
 */
const v2Service = {
  /**
   * Handshake & Session initialization
   */
  async init({ appId, secret, version, hash, ip, userAgent }) {
    if (!appId || !secret) {
      throw { code: 'MISSING_FIELDS', status: 400, message: 'appId and secret are required.' };
    }

    const app = await prisma.application.findUnique({
      where: { appId },
      include: {
        clientVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!app || app.appSecret !== secret) {
      throw { code: 'INVALID_CREDENTIALS', status: 401, message: 'Invalid application ID or secret.' };
    }

    if (!app.isActive) {
      throw { code: 'APP_DISABLED', status: 403, message: 'This application is currently paused.' };
    }

    // Check IP blacklist
    const blacklisted = await checkBlacklist(ip);
    if (blacklisted) {
      throw { code: 'BLACKLISTED', status: 403, message: `Access denied: ${blacklisted.reason || 'Blacklisted'}` };
    }

    // Anti-tamper binary hash check
    if (app.hashCheck && app.appHash) {
      if (!hash || hash.toLowerCase() !== app.appHash.toLowerCase()) {
        throw { code: 'HASH_MISMATCH', status: 403, message: 'Binary checksum verification failed (Anti-tamper triggered).' };
      }
    }

    // Version validation & auto-updater check
    let updateInfo = { available: false };
    const latestVersion = app.clientVersions[0];
    if (latestVersion && version && latestVersion.version !== version) {
      const isOutdated = latestVersion.version > version;
      if (isOutdated) {
        updateInfo = {
          available: true,
          latest_version: latestVersion.version,
          download_url: latestVersion.downloadUrl,
          is_forced: latestVersion.isForced,
          reminder_message: latestVersion.reminderMessage || 'A new software update is available.',
          allowed_until: latestVersion.allowedUntil,
        };

        if (latestVersion.isForced) {
          // If past allowed deadline or strictly forced, reject init
          if (!latestVersion.allowedUntil || new Date() > new Date(latestVersion.allowedUntil)) {
            throw {
              code: 'OUTDATED_VERSION',
              status: 426,
              message: `Version ${version} is obsolete. Please update to ${latestVersion.version}.`,
              update: updateInfo,
            };
          }
        }
      }
    }

    // Create session token (valid for 2 hours)
    const sessionToken = `sess_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await prisma.clientSession.create({
      data: {
        appId: app.id,
        sessionToken,
        ipAddress: ip,
        userAgent,
        expiresAt,
      },
    });

    return {
      success: true,
      message: 'Initialized successfully',
      session_token: sessionToken,
      app_name: app.name,
      version: version || '1.0.0',
      update: updateInfo,
    };
  },

  /**
   * Validate session token
   */
  async getSession(sessionToken) {
    if (!sessionToken) {
      throw { code: 'SESSION_REQUIRED', status: 401, message: 'Session token is missing. Please call init first.' };
    }

    const session = await prisma.clientSession.findUnique({
      where: { sessionToken },
      include: { application: true },
    });

    if (!session || !session.isValid) {
      throw { code: 'INVALID_SESSION', status: 401, message: 'Invalid session token.' };
    }

    if (new Date() > session.expiresAt) {
      throw { code: 'SESSION_EXPIRED', status: 401, message: 'Session expired. Re-initialization required.' };
    }

    return session;
  },

  /**
   * Single-key license activation / login
   */
  async licenseLogin({ sessionToken, key, hwid, ip, userAgent }) {
    const session = await this.getSession(sessionToken);
    const appId = session.appId;

    if (!key) {
      throw { code: 'MISSING_FIELDS', status: 400, message: 'License key is required.' };
    }

    // Check blacklist
    const blacklisted = await checkBlacklist(ip, hwid);
    if (blacklisted) {
      throw { code: 'BLACKLISTED', status: 403, message: `Access denied: ${blacklisted.reason || 'Blacklisted'}` };
    }

    const license = await prisma.license.findFirst({
      where: { appId, key: key.trim() },
    });

    if (!license) {
      throw { code: 'INVALID_LICENSE', status: 404, message: 'License key not found.' };
    }

    if (license.status === 'BANNED') {
      throw { code: 'LICENSE_BANNED', status: 403, message: `License is banned: ${license.note || 'Contact support'}` };
    }

    const now = new Date();

    // If unused, activate it
    if (license.status === 'UNUSED') {
      let expiresAt = null;
      if (license.licenseType === 'TIME_LIMITED') {
        expiresAt = license.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (license.licenseType === 'TRIAL') {
        expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      }

      await prisma.license.update({
        where: { id: license.id },
        data: {
          status: 'ACTIVE',
          hwid: hwid || null,
          activatedAt: now,
          expiresAt,
          currentUses: 1,
        },
      });

      // Activation record
      const activationToken = `act_${crypto.randomBytes(20).toString('hex')}`;
      await prisma.activation.create({
        data: {
          licenseId: license.id,
          activationToken,
          hwid,
          ipAddress: ip,
          userAgent,
        },
      });

      await dispatchWebhook(appId, 'on_activate', {
        Key: license.key,
        HWID: hwid || 'N/A',
        IP: ip || 'N/A',
        Tier: license.level,
        Status: 'Activated',
      });

      return {
        success: true,
        message: 'License activated successfully.',
        level: license.level,
        status: 'ACTIVE',
        hwid,
        expires_at: expiresAt,
        activation_token: activationToken,
      };
    }

    // If already active, verify HWID and expiry
    if (license.status === 'ACTIVE') {
      if (license.expiresAt && now > license.expiresAt) {
        await prisma.license.update({ where: { id: license.id }, data: { status: 'EXPIRED' } });
        throw { code: 'LICENSE_EXPIRED', status: 403, message: 'License has expired.' };
      }

      if (license.hwid && hwid && license.hwid !== hwid) {
        throw {
          code: 'HWID_MISMATCH',
          status: 403,
          message: 'Hardware ID mismatch. Please request an HWID reset.',
        };
      }

      return {
        success: true,
        message: 'License verified successfully.',
        level: license.level,
        status: 'ACTIVE',
        hwid: license.hwid,
        expires_at: license.expiresAt,
      };
    }

    throw { code: 'LICENSE_INVALID', status: 400, message: `License status: ${license.status}` };
  },

  /**
   * User Registration within client app (KeyAuth/Authly style)
   */
  async registerUser({ sessionToken, username, password, key, hwid, ip }) {
    const session = await this.getSession(sessionToken);
    const appId = session.appId;

    if (!username || !password || !key) {
      throw { code: 'MISSING_FIELDS', status: 400, message: 'Username, password, and license key are required.' };
    }

    const blacklisted = await checkBlacklist(ip, hwid);
    if (blacklisted) {
      throw { code: 'BLACKLISTED', status: 403, message: 'Blacklisted.' };
    }

    // Check if username taken
    const existing = await prisma.appUser.findUnique({
      where: { appId_username: { appId, username } },
    });
    if (existing) {
      throw { code: 'USERNAME_TAKEN', status: 409, message: 'Username is already taken.' };
    }

    // Check license
    const license = await prisma.license.findFirst({
      where: { appId, key: key.trim() },
    });
    if (!license || license.status === 'BANNED') {
      throw { code: 'INVALID_LICENSE', status: 400, message: 'Invalid or banned license key.' };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = license.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const user = await prisma.appUser.create({
      data: {
        appId,
        licenseId: license.id,
        username,
        passwordHash,
        hwid,
        subLevel: license.level,
        expiresAt,
      },
    });

    // Mark license active
    await prisma.license.update({
      where: { id: license.id },
      data: { status: 'ACTIVE', hwid, activatedAt: new Date(), currentUses: 1 },
    });

    await dispatchWebhook(appId, 'on_register', {
      Username: username,
      Key: license.key,
      HWID: hwid || 'N/A',
      IP: ip || 'N/A',
    });

    return {
      success: true,
      message: 'Account created and activated successfully.',
      user: {
        username: user.username,
        level: user.subLevel,
        expires_at: user.expiresAt,
      },
    };
  },

  /**
   * User Login within client app
   */
  async loginUser({ sessionToken, username, password, hwid, ip }) {
    const session = await this.getSession(sessionToken);
    const appId = session.appId;

    if (!username || !password) {
      throw { code: 'MISSING_FIELDS', status: 400, message: 'Username and password are required.' };
    }

    const blacklisted = await checkBlacklist(ip, hwid);
    if (blacklisted) {
      throw { code: 'BLACKLISTED', status: 403, message: 'Blacklisted.' };
    }

    const user = await prisma.appUser.findUnique({
      where: { appId_username: { appId, username } },
    });
    if (!user) {
      throw { code: 'USER_NOT_FOUND', status: 404, message: 'User does not exist.' };
    }

    if (user.isBanned) {
      throw { code: 'USER_BANNED', status: 403, message: `Account is banned: ${user.banReason || 'Contact support'}` };
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw { code: 'INVALID_PASSWORD', status: 401, message: 'Invalid credentials.' };
    }

    // Check expiry
    if (user.expiresAt && new Date() > user.expiresAt) {
      throw { code: 'SUBSCRIPTION_EXPIRED', status: 403, message: 'Subscription has expired.' };
    }

    // HWID binding
    if (!user.hwid && hwid) {
      await prisma.appUser.update({ where: { id: user.id }, data: { hwid } });
    } else if (user.hwid && hwid && user.hwid !== hwid) {
      throw { code: 'HWID_MISMATCH', status: 403, message: 'Hardware ID mismatch.' };
    }

    await prisma.appUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      success: true,
      message: 'Login successful.',
      user: {
        username: user.username,
        level: user.subLevel,
        expires_at: user.expiresAt,
      },
    };
  },

  /**
   * Cloud Variable: Get
   */
  async getVariable({ sessionToken, name }) {
    const session = await this.getSession(sessionToken);
    if (!name) throw { code: 'MISSING_FIELDS', status: 400, message: 'Variable name required.' };

    const variable = await prisma.cloudVariable.findUnique({
      where: { appId_name: { appId: session.appId, name } },
    });

    if (!variable) {
      throw { code: 'VAR_NOT_FOUND', status: 404, message: `Variable '${name}' not found.` };
    }

    return {
      success: true,
      name: variable.name,
      value: variable.value,
    };
  },

  /**
   * Cloud Variable: Set
   */
  async setVariable({ sessionToken, name, value }) {
    const session = await this.getSession(sessionToken);
    if (!name || value === undefined) {
      throw { code: 'MISSING_FIELDS', status: 400, message: 'Name and value required.' };
    }

    const variable = await prisma.cloudVariable.findUnique({
      where: { appId_name: { appId: session.appId, name } },
    });

    if (!variable) {
      throw { code: 'VAR_NOT_FOUND', status: 404, message: `Variable '${name}' not found.` };
    }

    if (!variable.userWriteable) {
      throw { code: 'READ_ONLY', status: 403, message: 'This variable is read-only.' };
    }

    const updated = await prisma.cloudVariable.update({
      where: { id: variable.id },
      data: { value: String(value) },
    });

    return { success: true, name: updated.name, value: updated.value };
  },

  /**
   * Log telemetry from client
   */
  async clientLog({ sessionToken, message, level = 'INFO', ip, userAgent }) {
    const session = await this.getSession(sessionToken);
    await prisma.auditLog.create({
      data: {
        action: `CLIENT_LOG_${level.toUpperCase()}`,
        resourceType: 'Application',
        resourceId: session.appId,
        ipAddress: ip,
        userAgent,
        details: JSON.stringify({ message, timestamp: new Date().toISOString() }),
      },
    });

    return { success: true, message: 'Logged.' };
  },

  /**
   * HWID Reset Request
   */
  async resetHWID({ sessionToken, key }) {
    const session = await this.getSession(sessionToken);
    if (!key) throw { code: 'MISSING_FIELDS', status: 400, message: 'Key is required.' };

    const license = await prisma.license.findFirst({
      where: { appId: session.appId, key: key.trim() },
    });

    if (!license) throw { code: 'NOT_FOUND', status: 404, message: 'License not found.' };

    await prisma.license.update({
      where: { id: license.id },
      data: { hwid: null },
    });

    return { success: true, message: 'HWID reset successful. Next login will bind to current machine.' };
  },

  /**
   * Chat: Get messages
   */
  async getChat({ sessionToken, channel = 'general' }) {
    const session = await this.getSession(sessionToken);
    const messages = await prisma.chatMessage.findMany({
      where: { appId: session.appId, channel },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { success: true, messages: messages.reverse() };
  },

  /**
   * Chat: Send message
   */
  async sendChat({ sessionToken, channel = 'general', sender = 'Client', message }) {
    const session = await this.getSession(sessionToken);
    if (!message) throw { code: 'MISSING_FIELDS', status: 400, message: 'Message cannot be empty.' };

    const chat = await prisma.chatMessage.create({
      data: {
        appId: session.appId,
        channel,
        sender,
        message,
      },
    });

    return { success: true, chat };
  },
};

module.exports = v2Service;
