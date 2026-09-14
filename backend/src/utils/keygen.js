const { v4: uuidv4 } = require('uuid');

/**
 * Generate a license key in XXXXX-XXXXX-XXXXX-XXXXX format.
 * Uses uppercase alphanumeric characters.
 * @returns {string}
 */
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 5;
  const parts = [];

  for (let s = 0; s < segments; s++) {
    let segment = '';
    for (let i = 0; i < segmentLength; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }

  return parts.join('-');
}

/**
 * Generate a unique app ID.
 * @returns {string}
 */
function generateAppId() {
  return `app_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
}

/**
 * Generate a unique app secret.
 * @returns {string}
 */
function generateAppSecret() {
  return `secret_${uuidv4().replace(/-/g, '')}`;
}

/**
 * Generate an activation token.
 * @returns {string}
 */
function generateActivationToken() {
  return `act_${uuidv4().replace(/-/g, '')}`;
}

module.exports = { generateLicenseKey, generateAppId, generateAppSecret, generateActivationToken };
