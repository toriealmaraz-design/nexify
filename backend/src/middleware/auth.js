/**
 * NEXIFY AUTH MIDDLEWARE
 * JWT Authentication & Verification Guard
 *
 * ⚠️ NEEDS REVIEW — Touches authentication.
 * This middleware validates JWT bearer tokens on protected routes.
 * Route to a stronger model for final review before treating as final.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Authentication middleware — verifies JWT and attaches user to request.
 * Apply to any route that requires a logged-in user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'UNAUTHORIZED',
      message: 'Authentication token is required.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'TOKEN_EXPIRED',
        message: 'The authentication token has expired.',
      });
    }
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'INVALID_TOKEN',
      message: 'The authentication token is invalid.',
    });
  }
}

/**
 * Optional auth — does not reject, but attaches user if token present.
 * Useful for public endpoints that enrich response when user is logged in.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    } catch {
      // Silently ignore — no authenticated user
    }
  }
  next();
}

module.exports = { authenticate, optionalAuth };
