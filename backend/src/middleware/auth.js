const { verifyToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

/**
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches the user to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.type === 'refresh') {
      return res.status(401).json({ error: 'Access token required, not refresh token.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * Admin-only middleware. Must be used after authenticate.
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
