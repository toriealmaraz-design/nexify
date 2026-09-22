/**
 * Nexify Platform — Global Constants & Fee Rates
 * Centralized platform-wide constants referenced across controllers.
 */

const { platform } = require('./env');

module.exports = {
  // Payment channels
  PAYMENT_CHANNELS: {
    MOMO_MTN: 'MOMO_MTN',
    MOMO_TELECEL: 'MOMO_TELECEL',
    MOMO_AT: 'MOMO_AT',
    CARD_SIMULATED: 'CARD_SIMULATED',
  },

  // Course types
  COURSE_TYPES: {
    DIGITAL: 'DIGITAL',
    IN_PERSON_LAB: 'IN_PERSON_LAB',
  },

  // Course statuses
  COURSE_STATUSES: {
    DRAFT: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    PUBLISHED: 'PUBLISHED',
    REJECTED: 'REJECTED',
  },

  // Seat statuses (September 2026)
  SEAT_STATUSES: {
    LOCKED: 'LOCKED',
    WAITLISTED: 'WAITLISTED',
    CONFIRMED: 'CONFIRMED',
    RELEASED: 'RELEASED',
  },

  // Commission statuses (September 2026)
  COMMISSION_STATUSES: {
    PENDING: 'PENDING',
    CLEARED: 'CLEARED',
    FLAGGED: 'FLAGGED',
  },

  // Revenue split defaults
  PLATFORM_FEE_RATE: platform.feeRate,        // 10% digital default
  LAB_PLATFORM_FEE_RATE: platform.labFeeRate, // 15% in-person lab default
  DEFAULT_AFFILIATE_RATE: platform.defaultAffiliateRate, // 30% default

  // Commission clearing
  REFUND_WINDOW_HOURS: 7 * 24, // 7 days

  // Min payout threshold
  MIN_PAYOUT_THRESHOLD_GHS: 50.00,

  // Idempotency window (seconds)
  IDEMPOTENCY_WINDOW_SECONDS: 300, // 5 minutes

  // Seat hold timeout (seconds)
  SEAT_HOLD_TIMEOUT_SECONDS: 900, // 15 minutes

  // certs explicitly out of scope per PRD Section 3.2
  CERTIFICATES_ENABLED: false,

  // Nexa LLM Providers
  NEXA_LLM_PROVIDERS: {
    OPENAI: 'OPENAI',
    OLLAMA: 'OLLAMA',
    GROQ: 'GROQ',
    LMSTUDIO: 'LMSTUDIO',
    AZURE: 'AZURE',
    GEMINI: 'GEMINI',
    CLAUDE: 'CLAUDE',
  },

  NEXA_PROVIDER_DEFAULTS: {
    OPENAI:  { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    OLLAMA:  { baseUrl: 'http://localhost:11434', model: 'llama3' },
    GROQ:    { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile' },
    LMSTUDIO:{ baseUrl: 'http://localhost:1234/v1', model: '' },
    AZURE:   { baseUrl: '', model: '' },
    GEMINI:  { baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-1.5-flash' },
    CLAUDE:  { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-haiku-20241107' },
  },
};
