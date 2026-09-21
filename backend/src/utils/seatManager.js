/**
 * Seat Manager — In-Memory & DB Reservation State Manager
 *
 * Handles physical lab seat locking, release, and waitlist logic.
 * (REQ-GRO-03: Physical Lab Seat Reservation State Machine)
 *
 * Seat hold timeout: 900 seconds (15 minutes)
 * Max seats check: bookedSeats < maxSeats
 */

const constants = require('../config/constants');

/**
 * Check if a physical lab course has available seats.
 * @param {Object} course - Course object with maxSeats, bookedSeats, type
 * @returns {Object} { available: boolean, booked: number, max: number, remaining: number }
 */
function checkSeatAvailability(course) {
  if (course.type !== 'IN_PERSON_LAB') {
    return { available: true, booked: 0, max: 0, remaining: 0, isPhysicalLab: false };
  }

  const maxSeats = course.maxSeats || 0;
  const bookedSeats = course.bookedSeats || 0;
  const remaining = Math.max(0, maxSeats - bookedSeats);

  return {
    available: bookedSeats < maxSeats,
    booked: bookedSeats,
    max: maxSeats,
    remaining,
    isPhysicalLab: true,
    percentFull: maxSeats > 0 ? (bookedSeats / maxSeats) * 100 : 0,
  };
}

/**
 * Get the color threshold for the seat progress bar.
 * @param {number} percentFull - 0-100
 * @returns {string} 'emerald' | 'amber' | 'red'
 */
function getSeatColorThreshold(percentFull) {
  if (percentFull < 70) return 'emerald';
  if (percentFull < 90) return 'amber';
  return 'red';
}

/**
 * Calculate seat hold expiration timestamp.
 * @param {number} [holdDurationSeconds=900] - Seat hold duration
 * @returns {Date} Expiration timestamp
 */
function getSeatHoldExpiration(holdDurationSeconds = constants.SEAT_HOLD_TIMEOUT_SECONDS) {
  return new Date(Date.now() + holdDurationSeconds * 1000);
}

/**
 * Check if a seat hold has expired.
 * @param {Date} holdStartedAt - When the seat hold was initiated
 * @param {number} [holdDurationSeconds=900]
 * @returns {boolean} True if hold has expired
 */
function isSeatHoldExpired(holdStartedAt, holdDurationSeconds = constants.SEAT_HOLD_TIMEOUT_SECONDS) {
  const expiration = new Date(holdStartedAt.getTime() + holdDurationSeconds * 1000);
  return Date.now() > expiration.getTime();
}

/**
 * Format seat availability for display.
 * @param {Object} seatInfo - Output from checkSeatAvailability
 * @returns {string} Human-readable seat status string
 */
function formatSeatStatus(seatInfo) {
  if (!seatInfo.isPhysicalLab) return '';

  if (!seatInfo.available) {
    return 'Cohort Full — Join Waitlist';
  }

  return `${seatInfo.booked} / ${seatInfo.max} Seats Reserved (${seatInfo.remaining} Remaining)`;
}

module.exports = {
  checkSeatAvailability,
  getSeatColorThreshold,
  getSeatHoldExpiration,
  isSeatHoldExpired,
  formatSeatStatus,
};
