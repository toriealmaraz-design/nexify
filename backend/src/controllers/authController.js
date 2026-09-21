/**
 * Auth Controller
 * Handles user registration, login, and profile management.
 *
 * ⚠️ NEEDS REVIEW — Touches authentication (bcrypt password hashing, JWT issuance).
 * Route to a stronger model for final review before treating as final.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');
const config = require('../config/env');
const constants = require('../config/constants');

// ─── Helper: Generate JWT ──────────────────────────────────
function generateToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// ─── REGISTER ──────────────────────────────────────────────
async function register(req, res) {
  try {
    const { email, password, fullName, role = 'STUDENT', phone } = req.body;

    // Validate
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'email, password, and fullName are required.',
        details: ['Missing required fields'],
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Password must be at least 8 characters.',
      });
    }

    // Check for existing email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        error: 'CONFLICT',
        message: 'Registration failed. Please try again.',
      });
    }

    // Validate role
    const validRoles = ['ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT'];
    const userRole = validRoles.includes(role) ? role : 'STUDENT';

    // Hash password (bcryptjs, salt rounds ≥ 10 per SRS 7.2)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: generateUuid(),
        email,
        passwordHash,
        fullName,
        role: userRole,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    // Generate JWT
    const token = generateToken(user.id, user.email, user.role);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User account created successfully.',
      data: { token, user },
    });

  } catch (error) {
    console.error('[REGISTER ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create user account.',
    });
  }
}

// ─── LOGIN ─────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'email and password are required.',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT
    const token = generateToken(user.id, user.email, user.role);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Authentication successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication failed.',
    });
  }
}

// ─── ME (Profile) ──────────────────────────────────────────
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile data retrieved.',
      data: user,
    });

  } catch (error) {
    console.error('[ME ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve profile.',
    });
  }
}

// ─── UPDATE PROFILE ────────────────────────────────────────
async function updateProfile(req, res) {
  try {
    const { fullName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        fullName: fullName || undefined,
        phone: phone || undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile updated.',
      data: user,
    });

  } catch (error) {
    console.error('[UPDATE PROFILE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update profile.',
    });
  }
}

// ─── CHANGE PASSWORD ───────────────────────────────────────
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'currentPassword and newPassword are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'New password must be at least 8 characters.',
      });
    }

    // Verify current password
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validCurrent) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Current password is incorrect.',
      });
    }

    // Hash and update
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newHash },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Password changed successfully.',
    });

  } catch (error) {
    console.error('[CHANGE PASSWORD ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to change password.',
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
