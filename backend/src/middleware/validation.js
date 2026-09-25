/**
 * Input Validation Middleware
 * Uses express-validator to sanitize and validate request bodies.
 */

const { body, validationResult } = require('express-validator');

/**
 * Collect validation errors from request and return 400 if any.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Invalid input.',
      details: errors.array().map(e => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
}

/**
 * Sanitize common string fields: trim + escape HTML.
 */
const sanitize = [
  body('*').trim().escape(),
];

// ─── Register Validation ────────────────────────────
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('fullName').trim().isLength({ min: 1, max: 100 }).withMessage('fullName is required (max 100 chars).'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('role').optional().isIn(['ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT']).withMessage('Invalid role.'),
  sanitize,
  validate,
];

// ─── Login Validation ───────────────────────────────
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  sanitize,
  validate,
];

// ─── Forgot Password Validation ─────────────────────
const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  sanitize,
  validate,
];

// ─── Reset Password Validation ──────────────────────
const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  sanitize,
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};