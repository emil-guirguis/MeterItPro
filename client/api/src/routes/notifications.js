/**
 * Notification Routes
 * 
 * REST API endpoints for notification operations:
 * - GET /api/notifications - List notifications for tenant
 * - GET /api/notifications/count - Get notification count for tenant
 * - POST /api/notifications - Create a notification
 * - DELETE /api/notifications/:id - Delete individual notification
 * - DELETE /api/notifications - Delete all notifications for tenant
 * - GET /api/notifications/meter/:meterId - Get notifications for a meter
 * - GET /api/notifications/meter/:meterId/element/:elementId - Get notifications for a meter element
 */

const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const Notification = require('../models/NotificationWithSchema');
const { authenticateToken } = require('../middleware/auth');

// Middleware to require authentication
router.use(authenticateToken);

/**
 * GET /api/notifications
 * List all notifications for the tenant with pagination
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found in token',
        code: 'MISSING_TENANT_ID'
      });
    }

    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const offset = parseInt(req.query.offset) || 0;

    const result = await NotificationService.listNotifications(tenantId, limit, offset);

    res.json({
      success: true,
      data: {
        notifications: result.notifications,
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list notifications',
      code: 'LIST_NOTIFICATIONS_ERROR'
    });
  }
});

/**
 * GET /api/notifications/count
 * Get count of notifications for the tenant
 */
router.get('/count', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found in token',
        code: 'MISSING_TENANT_ID'
      });
    }

    const count = await NotificationService.getNotificationCount(tenantId);

    res.json({
      success: true,
      data: {
        count
      }
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/count:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notification count',
      code: 'GET_COUNT_ERROR'
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found in token',
        code: 'MISSING_TENANT_ID'
      });
    }

    const { notification_type, description } = req.body;

    const notification = await NotificationService.createNotification(
      tenantId,
      notification_type,
      description
    );

    if (!notification) {
      return res.status(409).json({
        success: false,
        error: 'Notification already exists for this type',
        code: 'DUPLICATE_NOTIFICATION'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Error in POST /api/notifications:', error);

    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: error.code || 'DUPLICATE_NOTIFICATION'
      });
    }

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create notification',
      code: 'CREATE_NOTIFICATION_ERROR'
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await NotificationService.deleteNotification(id);

    res.json({
      success: true,
      data: {
        deleted: deleted
      }
    });
  } catch (error) {
    console.error('Error in DELETE /api/notifications/:id:', error);

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: error.message,
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete notification',
      code: 'DELETE_NOTIFICATION_ERROR'
    });
  }
});

/**
 * DELETE /api/notifications
 * Delete all notifications for the tenant
 */
router.delete('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found in token',
        code: 'MISSING_TENANT_ID'
      });
    }

    const deletedCount = await NotificationService.deleteAllNotifications(tenantId);

    res.json({
      success: true,
      data: {
        deleted_count: deletedCount
      }
    });
  } catch (error) {
    console.error('Error in DELETE /api/notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete all notifications',
      code: 'DELETE_ALL_ERROR'
    });
  }
});

/**
 * GET /api/notifications/meter/:meterId
 * Get notifications by type for a tenant
 */
router.get('/type/:type', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found in token',
        code: 'MISSING_TENANT_ID'
      });
    }

    const { type } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await Notification.getByType(tenantId, type, limit, offset);

    res.json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/type/:type:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notifications by type',
      code: 'GET_TYPE_NOTIFICATIONS_ERROR'
    });
  }
});

/**
 * DELETE /api/notifications/type/:type
 * Delete notifications by type for a tenant
 */
router.delete('/type/:type', async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found in token',
        code: 'MISSING_TENANT_ID'
      });
    }

    const { type } = req.params;
    const deletedCount = await NotificationService.deleteNotificationsByType(tenantId, type);

    res.json({
      success: true,
      data: {
        deleted_count: deletedCount
      }
    });
  } catch (error) {
    console.error('Error in DELETE /api/notifications/type/:type:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete notifications by type',
      code: 'DELETE_TYPE_ERROR'
    });
  }
});

module.exports = router;
