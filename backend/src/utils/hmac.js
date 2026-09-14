const crypto = require('crypto');
const config = require('../config');

/**
 * Create an HMAC-SHA256 signature for a payload.
 * @param {string} payload — stringified data to sign
 * @returns {string} hex-encoded signature
 */
function createSignature(payload) {
  return crypto
    .createHmac('sha256', config.hmac.secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify an HMAC-SHA256 signature.
 * @param {string} payload — stringified data
 * @param {string} signature — hex-encoded signature to verify
 * @returns {boolean}
 */
function verifySignature(payload, signature) {
  const expected = createSignature(payload);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

module.exports = { createSignature, verifySignature };
