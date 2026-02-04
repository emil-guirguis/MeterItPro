/**
 * Notification Service
 * 
 * Handles CRUD operations for notifications.
 * Provides methods for creating, reading, updating, and deleting notifications.
 */

const db = require('../config/database');
const Notification = require('../models/NotificationWithSchema');

class NotificationService {
  /**
   * Get all notifications for a tenant with pagination
   * @param {number} tenantId - The tenant ID
   * @param {number} limit - Maximum number of notifications to return
   * @param {number} offset - Number of notifications to skip
   * @returns {Promise<{notifications: Array, total: number}>}
   */
  static async listNotifications(tenantId, limit = 100, offset = 0) {
    try {
      const notifications = await Notification.getByTenant(tenantId, limit, offset);
      
      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM notification WHERE tenant_id = $1',
        [tenantId]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      return {
        notifications,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error listing notifications:', error);
      throw error;
    }
  }

  /**
   * Get count of notifications for a tenant
   * @param {number} tenantId - The tenant ID
   * @returns {Promise<number>}
   */
  static async getNotificationCount(tenantId) {
    try {
      return await Notification.getCountByTenant(tenantId);
    } catch (error) {
      console.error('Error getting notification count:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   * @param {number} tenantId - The tenant ID
   * @param {string} notificationType - The notification type
   * @param {string} description - The notification description
   * @returns {Promise<Notification|null>} - The created notification or null if duplicate
   */
  static async createNotification(tenantId, notificationType, description = '') {
    try {
      // Validate inputs
      if (!tenantId || !notificationType) {
        throw new Error('Missing required fields: tenant_id, notification_type');
      }

      // Check for duplicate
      const exists = await Notification.existsForType(tenantId, notificationType);
      if (exists) {
        const error = new Error('Notification already exists for this type');
        error.code = 'DUPLICATE_NOTIFICATION';
        error.statusCode = 409;
        throw error;
      }

      // Create notification
      const notification = new Notification({
        tenant_id: tenantId,
        notification_type: notificationType,
        description: description || null
      });

      return await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Delete a specific notification by ID
   * @param {number} notificationId - The notification ID
   * @returns {Promise<boolean>} - true if deleted, false if not found
   */
  static async deleteNotification(notificationId) {
    try {
      if (!notificationId) {
        throw new Error('Notification ID is required');
      }

      const deleted = await Notification.deleteById(notificationId);
      
      if (!deleted) {
        const error = new Error('Notification not found');
        error.statusCode = 404;
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a tenant
   * @param {number} tenantId - The tenant ID
   * @returns {Promise<number>} - Number of notifications deleted
   */
  static async deleteAllNotifications(tenantId) {
    try {
      const deletedCount = await Notification.deleteByTenant(tenantId);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  /**
   * Create a notification if it doesn't already exist (for agent use)
   * @param {number} tenantId - The tenant ID
   * @param {string} notificationType - The notification type
   * @param {string} description - The notification description
   * @returns {Promise<Notification|null>} - The created notification or null if duplicate
   */
  static async createIfNotExists(tenantId, notificationType, description = '') {
    try {
      return await Notification.createIfNotExists(tenantId, notificationType);
    } catch (error) {
      console.error('Error creating notification if not exists:', error);
      throw error;
    }
  }

  /**
   * Delete notifications by type for a tenant
   * @param {number} tenantId - The tenant ID
   * @param {string} notificationType - The notification type
   * @returns {Promise<number>} - Number of notifications deleted
   */
  static async deleteNotificationsByType(tenantId, notificationType) {
    try {
      return await Notification.deleteByType(tenantId, notificationType);
    } catch (error) {
      console.error('Error deleting notifications by type:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
