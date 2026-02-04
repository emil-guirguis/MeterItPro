/**
 * Notification Settings Routes
 * 
 * REST API endpoints for notification settings:
 * - GET /api/settings/notifications - Get current settings
 * - PUT /api/settings/notifications - Update settings
 */

const express = require('express');
const router = express.Router();
const NotificationSettingsService = require('../services/NotificationSettingsService');
const { authenticateToken } = require('../middleware/auth');

// Middleware to require authentication
router.use(authenticateToken);

/**
 * GET /api/settings/notifications
 * Get current notification settings
 */
router.get('/', async (req, res) => {
  try {
    const settings = await NotificationSettingsService.getSettings();

    res.json({
      success: true,
      data: {
        settings
      }
    });
  } catch (error) {
    console.error('Error in GET /api/settings/notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notification settings',
      code: 'GET_SETTINGS_ERROR'
    });
  }
});

/**
 * PUT /api/settings/notifications
 * Update notification settings
 */
router.put('/', async (req, res) => {
  try {
    const { health_check_cron, daily_email_cron, email_template_id, enabled } = req.body;

    // Validate cron expressions if provided
    if (health_check_cron && !NotificationSettingsService.validateCronExpression(health_check_cron)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid health_check_cron expression',
        code: 'INVALID_CRON_EXPRESSION'
      });
    }

    if (daily_email_cron && !NotificationSettingsService.validateCronExpression(daily_email_cron)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid daily_email_cron expression',
        code: 'INVALID_CRON_EXPRESSION'
      });
    }

    // Update settings
    const settings = await NotificationSettingsService.updateSettings({
      health_check_cron,
      daily_email_cron,
      email_template_id,
      enabled
    });

    res.json({
      success: true,
      data: {
        settings
      }
    });
  } catch (error) {
    console.error('Error in PUT /api/settings/notifications:', error);

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code || 'INVALID_REQUEST'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update notification settings',
      code: 'UPDATE_SETTINGS_ERROR'
    });
  }
});

module.exports = router;
