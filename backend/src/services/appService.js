const prisma = require('../utils/prisma');
const { generateAppId, generateAppSecret } = require('../utils/keygen');

/**
 * Create a new application.
 * @param {string} userId
 * @param {{ name: string, description?: string }} data
 * @returns {Promise<object>}
 */
async function createApp(userId, { name, description }) {
  return prisma.application.create({
    data: {
      userId,
      name,
      description: description || null,
      appId: generateAppId(),
      appSecret: generateAppSecret(),
    },
  });
}

/**
 * List all apps for a user with license counts.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
async function listApps(userId) {
  return prisma.application.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { licenses: true, clientVersions: true },
      },
    },
  });
}

/**
 * Get a single app by ID, owned by user.
 * @param {string} userId
 * @param {string} id
 * @returns {Promise<object>}
 */
async function getApp(userId, id) {
  const app = await prisma.application.findFirst({
    where: { id, userId },
    include: {
      _count: {
        select: { licenses: true, clientVersions: true },
      },
    },
  });
  if (!app) throw new Error('Application not found.');
  return app;
}

/**
 * Get app statistics.
 * @param {string} userId
 * @param {string} appId — DB id
 * @returns {Promise<object>}
 */
async function getAppStats(userId, appId) {
  const app = await prisma.application.findFirst({ where: { id: appId, userId } });
  if (!app) throw new Error('Application not found.');

  const [total, active, expired, banned, unused] = await Promise.all([
    prisma.license.count({ where: { appId } }),
    prisma.license.count({ where: { appId, status: 'ACTIVE' } }),
    prisma.license.count({ where: { appId, status: 'EXPIRED' } }),
    prisma.license.count({ where: { appId, status: 'BANNED' } }),
    prisma.license.count({ where: { appId, status: 'UNUSED' } }),
  ]);

  return { total, active, expired, banned, unused };
}

/**
 * Update an application.
 * @param {string} userId
 * @param {string} id
 * @param {{ name?: string, description?: string }} data
 * @returns {Promise<object>}
 */
async function updateApp(userId, id, data) {
  const app = await prisma.application.findFirst({ where: { id, userId } });
  if (!app) throw new Error('Application not found.');

  return prisma.application.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
}

/**
 * Delete an application (cascades licenses, versions, activations).
 * @param {string} userId
 * @param {string} id
 */
async function deleteApp(userId, id) {
  const app = await prisma.application.findFirst({ where: { id, userId } });
  if (!app) throw new Error('Application not found.');
  await prisma.application.delete({ where: { id } });
}

/**
 * Regenerate app secret.
 * @param {string} userId
 * @param {string} id
 * @returns {Promise<object>}
 */
async function regenerateSecret(userId, id) {
  const app = await prisma.application.findFirst({ where: { id, userId } });
  if (!app) throw new Error('Application not found.');

  return prisma.application.update({
    where: { id },
    data: { appSecret: generateAppSecret() },
  });
}

module.exports = { createApp, listApps, getApp, getAppStats, updateApp, deleteApp, regenerateSecret };
