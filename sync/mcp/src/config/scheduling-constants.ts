/**
 * Centralized Scheduling Constants
 * 
 * All cron expressions and scheduling intervals are defined here for easy configuration.
 * This ensures consistency across the application and makes it simple to adjust timing.
 */

/**
 * BACnet Collection Interval
 *
 * How often to collect meter readings from BACnet devices
 * Default: 5 minutes (for debugging)
 *
 * Used by: BACnetMeterReadingAgent
 * Environment variable: BACNET_COLLECTION_INTERVAL_SECONDS
 */
export const CRON_METER_READ = minutesToCronEvery(5);

/**
 * BACnet Upload Interval
 *
 * How often to upload collected meter readings to the remote Client System
 * Default: 6 minutes (for debugging)
 *
 * Used by: BACnetMeterReadingAgent, MeterReadingUploadManager
 * Environment variable: BACNET_UPLOAD_INTERVAL_MINUTES
 * Cron expression: 0 [every 6 minutes] * * * (every 6 minutes at minute 0)
 */
export const CRON_SYNC_TO_REMOTE = minutesToCronEvery(6);

/**
 * Remote to Local Sync Interval
 * 
 * How often to download meter and tenant configuration from remote to local database
 * This includes:
 * - Tenant data sync
 * - Meter device sync
 * - Device register sync
 * 
 * Default: 45 minutes
 * 
 * Used by: RemoteToLocalSyncAgent
 * Environment variable: REMOTE_TO_LOCAL_SYNC_INTERVAL_MINUTES
 * Cron expression: 0 [every 45 minutes] * * * (every 45 minutes at minute 0)
 */
export const CRON_REMOTE_TO_LOCAL = minutesToCronEvery(45);

/**
 * Meter Reading Cleanup Interval
 * 
 * How often to delete meter readings older than 2 months
 * Default: Daily at 2 AM
 * 
 * Used by: MeterReadingCleanupAgent
 * Environment variable: METER_READING_CLEANUP_CRON
 * Cron expression: "0 2 * * *" (every day at 2 AM)
 */
export const CRON_METER_READING_CLEANUP = "0 2 * * *";
/**
 * Converts a number of minutes to a cron expression that runs every X minutes
 * @param minutes - Number of minutes between executions (1-59 recommended)
 * @returns cron expression string
 * @example
 */
export function minutesToCronEvery(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) {
    throw new Error("Minutes must be an integer between 1 and 60");
  }

  if (minutes === 60) {
    return "0 * * * *"; // every hour
  }

  if (minutes === 1) {
    return "* * * * *"; // every minute
  }

  return `*/${minutes} * * * *`;
}

/**
 * Creates a cron that starts at a specific minute past the hour
 * and then repeats every X minutes
 * 
 * @example
 * minutesToCronWithOffset(10, 3)  // "10,13,16,19,22,25,28,31,34,37,40,43,46,49,52,55,58 * * * *"
 */
export function minutesToCronWithOffset(startMinute: number, everyMinutes: number): string {
  if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute > 59) {
    throw new Error("Start minute must be between 0-59");
  }
  if (!Number.isInteger(everyMinutes) || everyMinutes < 1 || everyMinutes > 60) {
    throw new Error("Interval must be between 1-60 minutes");
  }

  const minutesList: number[] = [];
  let current = startMinute;

  while (current <= 59) {
    minutesList.push(current);
    current += everyMinutes;
  }

  if (minutesList.length === 0) {
    throw new Error("No valid minutes found with given parameters");
  }

  return `${minutesList.join(",")} * * * *`;
}

/**
 * Most common convenience function - every X minutes starting from minute 0
 */
export function everyXMinutesCron(minutes: number): string {
  return minutesToCronEvery(minutes);
}

/**
 * Get BACnet collection interval in seconds from environment or default
 */
export function getBACnetCollectionIntervalSeconds(): number {
  const envValue = process.env.BACNET_COLLECTION_INTERVAL_SECONDS;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  // Default: 10 minutes = 600 seconds
  return 600;
}

/**
 * Get BACnet upload cron expression from environment or default
 */
export function getBACnetUploadCronExpression(): string {
  const envValue = process.env.BACNET_UPLOAD_CRON;
  if (envValue) {
    return envValue;
  }
  
  // Fall back to old env var for backward compatibility
  const oldEnvValue = process.env.UPLOAD_INTERVAL_MINUTES;
  if (oldEnvValue) {
    const minutes = parseInt(oldEnvValue, 10);
    if (!isNaN(minutes) && minutes > 0) {
      return minutesToCronEvery(minutes);
    }
  }
  
  return CRON_SYNC_TO_REMOTE;
}

/**
 * Get Remote to Local sync cron expression from environment or default
 */
export function getRemoteToLocalSyncCronExpression(): string {
  const envValue = process.env.REMOTE_TO_LOCAL_SYNC_CRON;
  if (envValue) {
    return envValue;
  }
  
  // Fall back to old env var for backward compatibility
  const oldEnvValue = process.env.METER_SYNC_INTERVAL_MINUTES;
  if (oldEnvValue) {
    const minutes = parseInt(oldEnvValue, 10);
    if (!isNaN(minutes) && minutes > 0) {
      return minutesToCronEvery(minutes);
    }
  }
  
  return CRON_REMOTE_TO_LOCAL;
}

/**
 * Get Remote to Local sync interval in minutes from environment or default
 * Used by RemoteToLocalSyncAgent for backward compatibility
 */
export function getRemoteToLocalSyncIntervalMinutes(): number {
  const envValue = process.env.METER_SYNC_INTERVAL_MINUTES;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  // Default: 45 minutes
  return 45;
}
