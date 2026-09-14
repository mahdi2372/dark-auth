const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Create a JWT access token.
 * @param {{ id: string, username: string, role: string }} payload
 * @returns {string}
 */
function createAccessToken(payload) {
  return jwt.sign(
    { id: payload.id, username: payload.username, role: payload.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Create a JWT refresh token.
 * @param {{ id: string }} payload
 * @returns {string}
 */
function createRefreshToken(payload) {
  return jwt.sign(
    { id: payload.id, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {object}
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { createAccessToken, createRefreshToken, verifyToken };
