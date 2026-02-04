/**
 * Notification Settings Service
 * 
 * Handles configuration and persistence of notification system settings.
 */

const NotificationSettings = require('../models/NotificationSettingsWithSchema');
const { isValidCronExpression } = require('../constants/cronConstants');

class NotificationSettingsService {
  /**
   * Get current notification settings
   * @returns {Promise<NotificationSettings>}
   */
  static async getSettings() {
    try {
      return await NotificationSettings.getCurrent();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  }

  /**
   * Update notification settings
   * @param {Object} updates - The settings to update
   * @returns {Promise<NotificationSettings>}
   */
  static async updateSettings(updates) {
    try {
      // Validate cron expressions if provided
      if (updates.health_check_cron && !isValidCronExpression(updates.health_check_cron)) {
        const error = new Error('Invalid health_check_cron expression');
        error.statusCode = 400;
        error.code = 'INVALID_CRON_EXPRESSION';
        throw error;
      }

      if (updates.daily_email_cron && !isValidCronExpression(updates.daily_email_cron)) {
        const error = new Error('Invalid daily_email_cron expression');
        error.statusCode = 400;
        error.code = 'INVALID_CRON_EXPRESSION';
        throw error;
      }

      // Update settings
      const settings = await NotificationSettings.updateSettings(updates);

      console.log('✅ Notification settings updated:', {
        health_check_cron: settings.health_check_cron,
        daily_email_cron: settings.daily_email_cron,
        enabled: settings.enabled
      });

      return settings;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Validate a cron expression
   * @param {string} cronExpression - The cron expression to validate
   * @returns {boolean}
   */
  static validateCronExpression(cronExpression) {
    return isValidCronExpression(cronExpression);
  }

  /**
   * Reset settings to defaults
   * @returns {Promise<NotificationSettings>}
   */
  static async resetToDefaults() {
    try {
      const { CRON_CONSTANTS } = require('../constants/cronConstants');

      const settings = await NotificationSettings.updateSettings({
        health_check_cron: CRON_CONSTANTS.NOTIFICATION_HEALTH_CHECK.DEFAULT,
        daily_email_cron: CRON_CONSTANTS.NOTIFICATION_DAILY_EMAIL.DEFAULT,
        enabled: true
      });

      console.log('✅ Notification settings reset to defaults');
      return settings;
    } catch (error) {
      console.error('Error resetting notification settings:', error);
      throw error;
    }
  }
}

module.exports = NotificationSettingsService;
