/**
 * Auth Routes — /api/v1/auth
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } = require('../middleware/validation');

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Google OAuth — redirect to Google, callback issues JWT and redirects to frontend
router.get('/google', (req, res, next) => {
  const { OAuth2Client } = require('google-auth-library');
  const config = require('../config/env');
  const client = new OAuth2Client({
    clientId: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
    redirectUri: config.oauth.google.redirectUri,
  });
  const url = client.generateAuthUrl({
    scope: ['email', 'profile'],
    access_type: 'offline',
    prompt: 'select_account',
  });
  return res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const { OAuth2Client } = require('google-auth-library');
  const config = require('../config/env');
  const client = new OAuth2Client({
    clientId: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
    redirectUri: config.oauth.google.redirectUri,
  });
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${config.app.frontendUrl || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
  try {
    const { tokens } = await client.getToken(code);
    req.oauth2Tokens = tokens;
    return authController.googleCallback(req, res);
  } catch (err) {
    return res.redirect(`${config.app.frontendUrl || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
});

// Apple sign-in
router.post('/apple', authController.appleCallback);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
