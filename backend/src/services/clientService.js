const prisma = require('../utils/prisma');
const { generateActivationToken } = require('../utils/keygen');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const config = require('../config');

/**
 * Activate a client using a license key.
 * Creates an activation record and returns an activation token.
 * @param {{ licenseKey: string, appId: string, hwid?: string, ipAddress?: string, userAgent?: string }} data
 * @returns {Promise<{ success: boolean, activationToken?: string, message: string }>}
 */
async function activateClient({ licenseKey, appId, hwid, ipAddress, userAgent }) {
  // Find app by public appId
  const app = await prisma.application.findUnique({ where: { appId } });
  if (!app) return { success: false, message: 'Application not found.' };

  const license = await prisma.license.findFirst({
    where: { key: licenseKey, appId: app.id },
  });

  if (!license) return { success: false, message: 'License key not found.' };
  if (license.status === 'BANNED') return { success: false, message: 'License is banned.' };
  if (license.status === 'EXPIRED') return { success: false, message: 'License has expired.' };

  // Check expiration
  if (license.expiresAt && new Date() > license.expiresAt) {
    await prisma.license.update({ where: { id: license.id }, data: { status: 'EXPIRED' } });
    return { success: false, message: 'License has expired.' };
  }

  // Check HWID binding
  if (license.hwid && hwid && license.hwid !== hwid) {
    return { success: false, message: 'Hardware ID mismatch.' };
  }

  // Check max uses
  if (license.currentUses >= license.maxUses) {
    return { success: false, message: 'License activation limit reached.' };
  }

  // Bind HWID if not already bound
  const updateData = {
    currentUses: { increment: 1 },
    status: 'ACTIVE',
    activatedAt: license.activatedAt || new Date(),
  };
  if (hwid && !license.hwid) {
    updateData.hwid = hwid;
  }
  await prisma.license.update({ where: { id: license.id }, data: updateData });

  // Create activation record
  const activationToken = generateActivationToken();
  await prisma.activation.create({
    data: {
      licenseId: license.id,
      activationToken,
      hwid: hwid || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });

  return {
    success: true,
    activationToken,
    message: 'Client activated successfully.',
    license: {
      key: license.key,
      type: license.licenseType,
      expiresAt: license.expiresAt,
    },
  };
}

/**
 * Verify an activation token.
 * @param {string} activationToken
 * @returns {Promise<{ valid: boolean, message: string }>}
 */
async function verifyActivation(activationToken) {
  const activation = await prisma.activation.findUnique({
    where: { activationToken },
    include: {
      license: {
        include: { application: true },
      },
    },
  });

  if (!activation) return { valid: false, message: 'Activation token not found.' };

  const license = activation.license;
  if (license.status === 'BANNED') return { valid: false, message: 'License is banned.' };
  if (license.expiresAt && new Date() > license.expiresAt) {
    return { valid: false, message: 'License has expired.' };
  }

  return {
    valid: true,
    message: 'Activation is valid.',
    app: { name: license.application.name, appId: license.application.appId },
    license: { key: license.key, type: license.licenseType, expiresAt: license.expiresAt },
  };
}

/**
 * Create a new client version.
 * @param {{ appId: string, version: string, releaseNotes?: string, downloadUrl?: string, filePath?: string, fileSize?: number }} data
 * @returns {Promise<object>}
 */
async function createVersion({ appDbId, version, releaseNotes, downloadUrl, filePath, fileSize }) {
  // Check duplicate version
  const existing = await prisma.clientVersion.findFirst({
    where: { appId: appDbId, version },
  });
  if (existing) throw new Error(`Version ${version} already exists.`);

  // Compute checksum if file exists
  let checksum = null;
  if (filePath && fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  // Unset previous latest
  await prisma.clientVersion.updateMany({
    where: { appId: appDbId, isLatest: true },
    data: { isLatest: false },
  });

  return prisma.clientVersion.create({
    data: {
      appId: appDbId,
      version,
      releaseNotes: releaseNotes || null,
      downloadUrl: downloadUrl || null,
      checksum,
      isLatest: true,
      filePath: filePath || null,
      fileSize: fileSize || null,
    },
  });
}

/**
 * Get the latest version for an app.
 * @param {string} appIdPublic — the public app_id
 * @returns {Promise<object|null>}
 */
async function getLatestVersion(appIdPublic) {
  const app = await prisma.application.findUnique({ where: { appId: appIdPublic } });
  if (!app) throw new Error('Application not found.');

  const version = await prisma.clientVersion.findFirst({
    where: { appId: app.id, isLatest: true },
  });

  return version;
}

/**
 * List all versions for an app.
 * @param {string} appDbId
 * @returns {Promise<object[]>}
 */
async function listVersions(appDbId) {
  return prisma.clientVersion.findMany({
    where: { appId: appDbId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Check if client needs an update.
 * @param {{ appId: string, currentVersion: string }} data
 * @returns {Promise<{ needsUpdate: boolean, latestVersion?: string, downloadUrl?: string, releaseNotes?: string }>}
 */
async function checkUpdate({ appId, currentVersion }) {
  const app = await prisma.application.findUnique({ where: { appId } });
  if (!app) throw new Error('Application not found.');

  const latest = await prisma.clientVersion.findFirst({
    where: { appId: app.id, isLatest: true },
  });

  if (!latest) {
    return { needsUpdate: false, message: 'No versions available.' };
  }

  if (latest.version === currentVersion) {
    return { needsUpdate: false, latestVersion: latest.version, message: 'Already up to date.' };
  }

  return {
    needsUpdate: true,
    latestVersion: latest.version,
    downloadUrl: latest.downloadUrl,
    checksum: latest.checksum,
    releaseNotes: latest.releaseNotes,
    message: `Update available: ${currentVersion} → ${latest.version}`,
  };
}

/**
 * Delete a version.
 * @param {string} versionId
 */
async function deleteVersion(versionId) {
  const version = await prisma.clientVersion.findUnique({ where: { id: versionId } });
  if (!version) throw new Error('Version not found.');

  // Delete file if exists
  if (version.filePath && fs.existsSync(version.filePath)) {
    fs.unlinkSync(version.filePath);
  }

  await prisma.clientVersion.delete({ where: { id: versionId } });
}

module.exports = {
  activateClient,
  verifyActivation,
  createVersion,
  getLatestVersion,
  listVersions,
  checkUpdate,
  deleteVersion,
};
