const prisma = require('../utils/prisma');
const { hashPassword, verifyPassword } = require('../utils/password');
const { createAccessToken, createRefreshToken, verifyToken } = require('../utils/jwt');

/**
 * Register a new user.
 * @param {{ username: string, email: string, password: string }} data
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
async function register({ username, email, password }) {
  // Check existing
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    throw new Error(existing.username === username ? 'Username already taken.' : 'Email already registered.');
  }

  const passwordHash = await hashPassword(password);

  // First user becomes admin
  const userCount = await prisma.user.count();
  const role = userCount === 0 ? 'ADMIN' : 'USER';

  const user = await prisma.user.create({
    data: { username, email, passwordHash, role },
    select: { id: true, username: true, email: true, role: true, createdAt: true },
  });

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  return { user, accessToken, refreshToken };
}

/**
 * Login with username/email and password.
 * @param {{ login: string, password: string }} data
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
async function login({ login, password }) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: login }, { email: login }],
    },
  });

  if (!user) {
    throw new Error('Invalid credentials.');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated.');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials.');
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using refresh token.
 * @param {string} refreshTokenStr
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
async function refresh(refreshTokenStr) {
  const decoded = verifyToken(refreshTokenStr);
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token.');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, username: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new Error('User not found or deactivated.');
  }

  const accessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);

  return { accessToken, refreshToken: newRefreshToken };
}

/**
 * Get user profile by ID.
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { applications: true } },
    },
  });

  if (!user) throw new Error('User not found.');
  return user;
}

/**
 * Update user password.
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 */
async function updatePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new Error('Current password is incorrect.');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

module.exports = { register, login, refresh, getProfile, updatePassword };
