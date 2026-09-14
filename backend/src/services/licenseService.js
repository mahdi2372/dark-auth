const prisma = require('../utils/prisma');
const { generateLicenseKey } = require('../utils/keygen');

/**
 * Create a single license.
 * @param {{ appId: string, licenseType?: string, expiresInDays?: number, maxUses?: number, hwid?: string, note?: string }} data
 * @returns {Promise<object>}
 */
async function createLicense({ appId, licenseType = 'TIME_LIMITED', expiresInDays, maxUses = 1, hwid, note }) {
  const app = await prisma.application.findUnique({ where: { id: appId } });
  if (!app) throw new Error('Application not found.');

  let expiresAt = null;
  if (licenseType === 'TIME_LIMITED' && expiresInDays) {
    expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  } else if (licenseType === 'TRIAL') {
    expiresAt = new Date(Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000);
  }

  return prisma.license.create({
    data: {
      appId,
      key: generateLicenseKey(),
      licenseType,
      status: 'UNUSED',
      hwid: hwid || null,
      maxUses,
      expiresAt,
      note: note || null,
    },
  });
}

/**
 * Bulk create licenses.
 * @param {{ appId: string, count: number, licenseType?: string, expiresInDays?: number, maxUses?: number }} data
 * @returns {Promise<object[]>}
 */
async function bulkCreateLicenses({ appId, count, licenseType = 'TIME_LIMITED', expiresInDays, maxUses = 1 }) {
  const app = await prisma.application.findUnique({ where: { id: appId } });
  if (!app) throw new Error('Application not found.');

  if (count > 500) throw new Error('Maximum 500 licenses per batch.');

  const licenses = [];
  for (let i = 0; i < count; i++) {
    let expiresAt = null;
    if (licenseType === 'TIME_LIMITED' && expiresInDays) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    } else if (licenseType === 'TRIAL') {
      expiresAt = new Date(Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000);
    }

    licenses.push({
      appId,
      key: generateLicenseKey(),
      licenseType,
      status: 'UNUSED',
      maxUses,
      expiresAt,
    });
  }

  // Use transaction for atomicity
  const created = await prisma.$transaction(
    licenses.map((l) => prisma.license.create({ data: l }))
  );

  return created;
}

/**
 * List licenses for an app with filtering and pagination.
 * @param {{ appId: string, status?: string, licenseType?: string, search?: string, page?: number, limit?: number }} filters
 * @returns {Promise<{ licenses: object[], total: number, page: number, totalPages: number }>}
 */
async function listLicenses({ appId, status, licenseType, search, page = 1, limit = 50 }) {
  const where = { appId };
  if (status) where.status = status;
  if (licenseType) where.licenseType = licenseType;
  if (search) where.key = { contains: search, mode: 'insensitive' };

  const [licenses, total] = await Promise.all([
    prisma.license.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { activations: true } } },
    }),
    prisma.license.count({ where }),
  ]);

  return { licenses, total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * Verify a license key (public endpoint).
 * Checks status, expiration, HWID binding.
 * @param {{ licenseKey: string, appId: string, hwid?: string }} data
 * @returns {Promise<{ valid: boolean, license?: object, message: string }>}
 */
async function verifyLicense({ licenseKey, appId, hwid }) {
  // Find the app by appId field (the public-facing app_id, not the DB id)
  const app = await prisma.application.findUnique({ where: { appId } });
  if (!app) return { valid: false, message: 'Application not found.' };

  const license = await prisma.license.findFirst({
    where: { key: licenseKey, appId: app.id },
  });

  if (!license) return { valid: false, message: 'License key not found.' };
  if (license.status === 'BANNED') return { valid: false, message: 'License is banned.' };
  if (license.status === 'EXPIRED') return { valid: false, message: 'License has expired.' };

  // Check expiration
  if (license.expiresAt && new Date() > license.expiresAt) {
    await prisma.license.update({ where: { id: license.id }, data: { status: 'EXPIRED' } });
    return { valid: false, message: 'License has expired.' };
  }

  // Check HWID binding
  if (license.hwid && hwid && license.hwid !== hwid) {
    return { valid: false, message: 'Hardware ID mismatch. License is bound to another device.' };
  }

  // If HWID provided and license has no HWID yet, bind it
  if (hwid && !license.hwid) {
    await prisma.license.update({ where: { id: license.id }, data: { hwid } });
  }

  // Activate if unused
  if (license.status === 'UNUSED') {
    await prisma.license.update({
      where: { id: license.id },
      data: { status: 'ACTIVE', activatedAt: new Date() },
    });
  }

  return {
    valid: true,
    message: 'License is valid.',
    license: {
      key: license.key,
      type: license.licenseType,
      status: 'ACTIVE',
      expiresAt: license.expiresAt,
      hwid: license.hwid || hwid || null,
    },
  };
}

/**
 * Ban a license.
 * @param {string} licenseId
 */
async function banLicense(licenseId) {
  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) throw new Error('License not found.');
  return prisma.license.update({ where: { id: licenseId }, data: { status: 'BANNED' } });
}

/**
 * Unban a license.
 * @param {string} licenseId
 */
async function unbanLicense(licenseId) {
  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) throw new Error('License not found.');

  // Determine correct status
  let newStatus = 'ACTIVE';
  if (license.expiresAt && new Date() > license.expiresAt) newStatus = 'EXPIRED';
  if (!license.activatedAt) newStatus = 'UNUSED';

  return prisma.license.update({ where: { id: licenseId }, data: { status: newStatus } });
}

/**
 * Delete a license.
 * @param {string} licenseId
 */
async function deleteLicense(licenseId) {
  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) throw new Error('License not found.');
  await prisma.license.delete({ where: { id: licenseId } });
}

module.exports = {
  createLicense,
  bulkCreateLicenses,
  listLicenses,
  verifyLicense,
  banLicense,
  unbanLicense,
  deleteLicense,
};
