/**
 * Revenue Splitter — Mathematical Engine for GH₵ Revenue Partitioning
 *
 * ⚠ NEEDS REVIEW — Touches revenue splits / financial math.
 * This module executes the precise revenue split formula. Route to a stronger
 * model for final review before treating as final.
 *
 * Formula (from SRS 4.3 / PRD 5.3):
 *   Platform Fee = Total Paid × Platform Rate
 *   Distributable Pool = Total Paid - Platform Fee
 *   Affiliate Share = Distributable Pool × Course Affiliate Rate (if aff code present)
 *   Creator Share = Distributable Pool - Affiliate Share
 */

/**
 * Calculate the full revenue split for an order.
 *
 * @param {Object} params
 * @param {number} params.totalPaidGhs - Total amount paid in GH₵
 * @param {number} params.platformFeeRate - Platform fee rate (e.g. 0.10 for 10%)
 * @param {number} params.affiliateRate - Course affiliate commission rate (e.g. 0.30 for 30%)
 * @param {boolean} params.affiliatePresent - Whether an affiliate code was present
 * @returns {Object} Split breakdown
 */
function calculateRevenueSplit({
  totalPaidGhs,
  platformFeeRate,
  affiliateRate = 0,
  affiliatePresent = false,
}) {
  // Step 1: Platform fee
  const platformFeeGhs = totalPaidGhs * platformFeeRate;

  // Step 2: Distributable pool
  const distributablePool = totalPaidGhs - platformFeeGhs;

  // Step 3: Affiliate share (only if affiliate code present)
  let affiliateShareGhs = 0;
  if (affiliatePresent && affiliateRate > 0) {
    affiliateShareGhs = distributablePool * affiliateRate;
  }

  // Step 4: Creator share
  const creatorShareGhs = distributablePool - affiliateShareGhs;

  return {
    totalPaidGhs,
    platformFeeGhs: Math.round(platformFeeGhs * 100) / 100,
    distributablePool: Math.round(distributablePool * 100) / 100,
    affiliateShareGhs: Math.round(affiliateShareGhs * 100) / 100,
    creatorShareGhs: Math.round(creatorShareGhs * 100) / 100,
    // Verification: everything should add up
    _verification: platformFeeGhs + creatorShareGhs + affiliateShareGhs,
  };
}

/**
 * Format a GH₵ amount for display.
 * @param {number} amount
 * @returns {string} Formatted string like "GH₵ 285.00"
 */
function formatGhs(amount) {
  return `GH₵ ${(Math.round(amount * 100) / 100).toFixed(2)}`;
}

/**
 * Calculate platform fee for a given course type.
 * @param {string} courseType - 'DIGITAL' or 'IN_PERSON_LAB'
 * @param {number} [platformFeeOverride] - Optional per-course override
 * @param {number} [digitalRate=0.10] - Default digital rate
 * @param {number} [labRate=0.15] - Default lab rate
 * @returns {number} Fee rate to apply
 */
function getPlatformFeeRate(courseType, platformFeeOverride, digitalRate = 0.10, labRate = 0.15) {
  if (platformFeeOverride != null && platformFeeOverride > 0) {
    return platformFeeOverride;
  }
  return courseType === 'IN_PERSON_LAB' ? labRate : digitalRate;
}

module.exports = {
  calculateRevenueSplit,
  formatGhs,
  getPlatformFeeRate,
};
