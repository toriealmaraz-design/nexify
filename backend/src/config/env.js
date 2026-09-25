/**
 * Nexify Backend — Environment Variable Loader
 * Validates and exports all required env vars with sensible defaults.
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Validate required variables
const required = ['JWT_SECRET'];
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.warn(`[ENV] Missing required variables: ${missing.join(', ')}`);
  console.warn('[ENV] Using development defaults where available.');
}

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET is required in production') })() : 'nexify-dev-secret-change-in-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },

  platform: {
    feeRate: parseFloat(process.env.PLATFORM_FEE_RATE || '0.10'),
    labFeeRate: parseFloat(process.env.LAB_PLATFORM_FEE_RATE || '0.15'),
    defaultAffiliateRate: parseFloat(process.env.DEFAULT_AFFILIATE_RATE || '0.30'),
  },

  nexa: {
    llmProvider: process.env.NEXA_LLM_PROVIDER || 'local',
    apiKey: process.env.NEXA_API_KEY || '',
  },

  payment: {
    gatewaySecret: process.env.PAYMENT_GATEWAY_SECRET || 'dev-gateway-secret',
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback',
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || '',
      teamId: process.env.APPLE_TEAM_ID || '',
      keyId: process.env.APPLE_KEY_ID || '',
      privateKey: process.env.APPLE_PRIVATE_KEY || '',
    },
  },

  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};
