/**
 * Nexify Platform — Frontend Configuration
 * Centralized API base URL and asset paths.
 */

// API base — proxied through Vite in development
export const API_BASE = '/api/v1';

// Branding asset map — mirrors SystemAsset keys
export const BRAND_ASSETS = {
  LOGO_MAIN:       '/assets/branding/logo-main.svg',
  LOGO_MAIN_LIGHT: '/assets/branding/logo-main-light.svg',
  LOGO_NEXA:       '/assets/branding/logo-nexa.svg',
  PLACEHOLDER_COURSE: '/assets/branding/placeholder-course.jpg',
  PLACEHOLDER_AVATAR: '/assets/branding/placeholder-avatar.png',
  MOM_TN:  '/assets/branding/icons/icon-momo-mtn.svg',
  MOM_TELECEL: '/assets/branding/icons/icon-momo-telecel.svg',
  MOM_AT:  '/assets/branding/icons/icon-momo-at.svg',
};

// Platform fees (mirror backend constants)
export const PLATFORM_FEES = {
  DIGITAL: 0.10,
  IN_PERSON_LAB: 0.15,
};

// Payment channel display config
export const PAYMENT_CHANNELS = {
  MOMO_MTN: {
    label: 'MTN MoMo',
    color: '#ffcc00',
    icon: BRAND_ASSETS.MOM_TN,
  },
  MOMO_TELECEL: {
    label: 'Telecel Cash',
    color: '#e60000',
    icon: BRAND_ASSETS.MOM_TELECEL,
  },
  MOMO_AT: {
    label: 'AT Money',
    color: '#003399',
    icon: BRAND_ASSETS.MOM_AT,
  },
  CARD_SIMULATED: {
    label: 'Card (Simulated)',
    color: '#1e293b',
    icon: null,
  },
};
