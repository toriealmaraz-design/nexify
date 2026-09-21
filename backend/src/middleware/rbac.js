/**
 * NEXIFY RBAC MIDDLEWARE
 * Role-Based Access Control Guard
 *
 * ⚠️ NEEDS REVIEW — Touches authentication/authorization.
 * Enforces role-based permissions on API endpoints.
 * Route to a stronger model for final review before treating as final.
 */

const constants = require('../config/constants');

/**
 * Role permission checker — defines which roles can access which endpoint groups.
 *
 * Permission matrix (from 03_SAD.md Section 5.2):
 * ┌─────────────────────────────┬─────────┬──────────┬───────────┬────────┐
 * │ Endpoint Group              │ STUDENT │ CREATOR  │ AFFILIATE │ ADMIN  │
 * ├─────────────────────────────┼─────────┼──────────┼───────────┼────────┤
 * │ GET /api/courses/published  │   ✅    │    ✅    │    ✅     │   ✅   │
 * │ POST /api/courses           │   ❌    │    ✅    │    ❌     │   ✅   │
 * │ PUT /api/courses/:id/status │   ❌    │    ❌    │    ❌     │   ✅   │
 * │ GET /api/affiliates/links   │   ❌    │    ❌    │    ✅     │   ✅   │
 * │ GET /api/admin/metrics      │   ❌    │    ❌    │    ❌     │   ✅   │
 * │ POST /api/admin/branding    │   ❌    │    ❌    │    ❌     │   ✅   │
 * └─────────────────────────────┴─────────┴──────────┴───────────┴────────┘
 */

const ROLE_PERMISSIONS = {
  // Course CRUD
  'course:create':    ['CREATOR', 'ADMIN'],
  'course:publish':   ['ADMIN'],
  'course:read_all':  ['ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT'],
  'course:read_own':  ['ADMIN', 'CREATOR'],

  // Order / Checkout
  'order:create':     ['ADMIN', 'CREATOR', 'STUDENT'],
  'order:read_own':   ['ADMIN', 'STUDENT'],
  'order:read_all':   ['ADMIN'],

  // Affiliate
  'affiliate:manage': ['ADMIN', 'AFFILIATE'],
  'affiliate:read':   ['ADMIN', 'AFFILIATE'],
  'affiliate:dashboard': ['ADMIN', 'AFFILIATE'],

  // Admin
  'admin:staging':    ['ADMIN'],
  'admin:metrics':    ['ADMIN'],
  'admin:assets':     ['ADMIN'],
  'admin:users':      ['ADMIN'],

  // Nexa
  'nexa:chat':        ['ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT'],
};

/**
 * RBAC Guard — checks if the authenticated user's role has permission.
 * @param {string} permission - The permission key to check (e.g. 'course:create')
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    const allowedRoles = ROLE_PERMISSIONS[permission];
    if (!allowedRoles) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        error: 'CONFIG_ERROR',
        message: `Unknown permission: ${permission}`,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}.`,
      });
    }

    next();
  };
}

/**
 * Role-specific guard — only allows the specified role(s).
 * @param  {...string} roles - Roles allowed to access (e.g. requireRole('ADMIN'))
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: `This endpoint requires one of: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = { requirePermission, requireRole, ROLE_PERMISSIONS };
