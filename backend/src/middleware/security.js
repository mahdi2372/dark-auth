const helmet = require('helmet');
const cors = require('cors');
const config = require('../config');

/**
 * Configure CORS middleware.
 */
function configureCors() {
  return cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-HMAC-Signature'],
  });
}

/**
 * Configure Helmet for secure HTTP headers.
 */
function configureHelmet() {
  return helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
}

module.exports = { configureCors, configureHelmet };
