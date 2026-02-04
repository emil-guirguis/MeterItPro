/**
 * Centralized Cron Schedule Constants
 * 
 * Single source of truth for all notification-related cron schedules.
 * These constants define the default schedules used by the notification system.
 */

const CRON_CONSTANTS = {
  NOTIFICATION_HEALTH_CHECK: {
    DEFAULT: '0 */2 * * *', // Every 2 hours
    DESCRIPTION: 'Meter health check schedule - runs every 2 hours'
  },
  NOTIFICATION_DAILY_EMAIL: {
    DEFAULT: '0 9 * * *', // 9 AM daily
    DESCRIPTION: 'Daily email notification schedule - runs at 9 AM every day'
  }
};

/**
 * Get a cron schedule by key, with optional override
 * @param {string} key - The key to look up in CRON_CONSTANTS
 * @param {string} [override] - Optional override value
 * @returns {string} The cron schedule string
 */
const getCronSchedule = (key, override) => {
  if (override) {
    return override;
  }

  // Try to find the constant by key
  const constant = Object.values(CRON_CONSTANTS).find(c => c.DEFAULT === key);
  return constant?.DEFAULT || key;
};

/**
 * Validate a cron expression
 * Basic validation - checks for 5 or 6 fields
 * @param {string} cronExpression - The cron expression to validate
 * @returns {boolean} true if valid, false otherwise
 */
const isValidCronExpression = (cronExpression) => {
  if (!cronExpression || typeof cronExpression !== 'string') {
    return false;
  }

  const parts = cronExpression.trim().split(/\s+/);
  
  // Cron expressions should have 5 or 6 fields
  // 5 fields: minute hour day month dayOfWeek
  // 6 fields: second minute hour day month dayOfWeek
  if (parts.length !== 5 && parts.length !== 6) {
    return false;
  }

  // Basic validation: each field should be a number, *, /, -, or ,
  const validFieldPattern = /^[\d\*\/\-,]+$/;
  return parts.every(part => validFieldPattern.test(part));
};

/**
 * Get all default cron schedules
 * @returns {Object} Object with all default schedules
 */
const getDefaultSchedules = () => {
  return {
    healthCheck: CRON_CONSTANTS.NOTIFICATION_HEALTH_CHECK.DEFAULT,
    dailyEmail: CRON_CONSTANTS.NOTIFICATION_DAILY_EMAIL.DEFAULT
  };
};

module.exports = {
  CRON_CONSTANTS,
  getCronSchedule,
  isValidCronExpression,
  getDefaultSchedules
};
