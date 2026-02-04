/**
 * Centralized Cron Schedule Constants
 * 
 * Single source of truth for all notification-related cron schedules.
 * These constants define the default schedules used by the notification system.
 */

export const CRON_CONSTANTS = {
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
 * @param key - The key to look up in CRON_CONSTANTS
 * @param override - Optional override value
 * @returns The cron schedule string
 */
export const getCronSchedule = (key: string, override?: string): string => {
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
 * @param cronExpression - The cron expression to validate
 * @returns true if valid, false otherwise
 */
export const isValidCronExpression = (cronExpression: string): boolean => {
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
 * @returns Object with all default schedules
 */
export const getDefaultSchedules = () => {
  return {
    healthCheck: CRON_CONSTANTS.NOTIFICATION_HEALTH_CHECK.DEFAULT,
    dailyEmail: CRON_CONSTANTS.NOTIFICATION_DAILY_EMAIL.DEFAULT
  };
};
