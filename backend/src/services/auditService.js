const prisma = require('../utils/prisma');

/**
 * Create an audit log entry.
 * @param {object} params
 * @param {string} [params.userId]
 * @param {string} params.action
 * @param {string} [params.resourceType]
 * @param {string} [params.resourceId]
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @param {object} [params.details]
 */
async function logAction({ userId, action, resourceType, resourceId, ipAddress, userAgent, details }) {
  return prisma.auditLog.create({
    data: { userId, action, resourceType, resourceId, ipAddress, userAgent, details },
  });
}

/**
 * Get audit logs with pagination and filtering.
 * @param {object} filters
 * @param {string} [filters.userId]
 * @param {string} [filters.action]
 * @param {string} [filters.resourceType]
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @returns {Promise<{ logs: object[], total: number, page: number, totalPages: number }>}
 */
async function getLogs({ userId, action, resourceType, page = 1, limit = 50 }) {
  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (resourceType) where.resourceType = resourceType;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { username: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
}

module.exports = { logAction, getLogs };
