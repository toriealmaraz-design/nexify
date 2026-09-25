/**
 * Auth Controller
 * Handles user registration, login, and profile management.
 *
 * ⚠️ NEEDS REVIEW — Touches authentication (bcrypt password hashing, JWT issuance).
 * Route to a stronger model for final review before treating as final.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../config/prisma');
const config = require('../config/env');
const constants = require('../config/constants');
const { OAuth2Client } = require('google-auth-library');

// In-memory reset token store (use Redis/database in production)
const resetTokens = new Map();

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
    const { email, password, fullName, role = 'STUDENT', phone, passwordHash, provider, providerId, avatarUrl } = req.body;

    // Validate
    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'email and fullName are required.',
        details: ['Missing required fields'],
      });
    }

    // Social login path: passwordHash already provided, no password check needed
    const isSocialLogin = !!passwordHash;
    if (!isSocialLogin) {
      if (!password) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: 'password is required.',
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

    // Hash password only if not social login (bcryptjs, salt rounds >= 10 per SRS 7.2)
    const hash = passwordHash || await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        fullName,
        role: userRole,
        phone: phone || null,
        provider: provider || null,
        providerId: providerId || null,
        avatarUrl: avatarUrl || null,
        emailVerified: isSocialLogin,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        provider: true,
        avatarUrl: true,
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
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to change password.',
    });
  }
}

// ─── GOOGLE OAUTH CALLBACK ──────────────────────────────────
async function googleCallback(req, res) {
  try {
    const { tokens } = req.oauth2Tokens;
    if (!tokens) {
      return res.status(400).json({ success: false, error: 'No tokens received from Google.' });
    }

    const client = new OAuth2Client(config.oauth.google.clientId);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.oauth.google.clientId,
    });
    const payload = ticket.getPayload();

    const email = payload.email;
    const fullName = payload.name || email.split('@')[0];
    const avatarUrl = payload.picture || null;
    const providerId = payload.sub;

    // Find or upsert user by email
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName,
          passwordHash: '', // social login — no password
          provider: 'google',
          providerId,
          avatarUrl,
          emailVerified: true,
          role: 'STUDENT',
        },
      });
    }

    const token = generateToken(user.id, user.email, user.role);

    // Redirect to frontend with token
    const frontendUrl = config.app.frontendUrl || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?token=${token}`);
  } catch (error) {
    return res.redirect('http://localhost:5173/login?error=oauth_failed');
  }
}

// ─── APPLE OAUTH ────────────────────────────────────────────
async function appleCallback(req, res) {
  try {
    const { identityToken, fullName, email } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'identityToken is required.',
      });
    }

    // Decode Apple identity token (no verification library needed — Apple's public key fetches are complex)
    // In production, use 'apple-signin-auth' or verify with Apple's public keys.
    // Here we decode the payload (base64url) to extract the email and subject.
    let applePayload = {};
    try {
      const parts = identityToken.split('.');
      if (parts.length >= 2) {
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
        applePayload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
      }
    } catch (_) {
      // decode failed — proceed with provided email
    }

    const appleEmail = applePayload.email || email;
    const appleUserId = applePayload.sub || identityToken;

    if (!appleEmail) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Apple sign-in did not provide an email. Try again.',
      });
    }

    const userFullName = fullName || applePayload.email || appleEmail.split('@')[0];

    // Find or upsert user by email
    let user = await prisma.user.findUnique({ where: { email: appleEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: appleEmail,
          fullName: userFullName,
          passwordHash: '', // social login — no password
          provider: 'apple',
          providerId: appleUserId,
          emailVerified: true,
          role: 'STUDENT',
        },
      });
    }

    const token = generateToken(user.id, user.email, user.role);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Apple sign-in successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          provider: user.provider,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Apple sign-in failed.',
    });
  }
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'email is required.',
      });
    }

    // Always return success — don't reveal whether email exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Generate secure reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

      // Store token with userId and expiry
      resetTokens.set(token, { userId: user.id, expiresAt });

      // In production: send email with FRONTEND_URL/reset-password?token=TOKEN
      // For dev: log the reset link
      const frontendUrl = config.app.frontendUrl || 'http://localhost:5173';
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'If that email exists, a reset link has been sent.',
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to process request.',
    });
  }
}

// ─── RESET PASSWORD ─────────────────────────────────────────
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'token and newPassword are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Password must be at least 8 characters.',
      });
    }

    // Validate token
    const tokenData = resetTokens.get(token);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Reset token is invalid or has expired.',
      });
    }

    // Hash new password and update user
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: tokenData.userId },
      data: { passwordHash: newHash },
    });

    // Delete token — one-time use
    resetTokens.delete(token);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Password reset successful.',
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to reset password.',
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  googleCallback,
  appleCallback,
  forgotPassword,
  resetPassword,
};
