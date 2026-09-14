const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General API rate limiter — 100 requests per minute by default.
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

/**
 * Stricter rate limiter for auth endpoints — 10 per minute by default.
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

/**
 * Client API rate limiter — 30 per minute for activation/verify endpoints.
 */
const clientLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many client requests, please try again later.' },
});

module.exports = { generalLimiter, authLimiter, clientLimiter };
