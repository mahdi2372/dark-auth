const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password with bcrypt (cost 12).
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, verifyPassword };
