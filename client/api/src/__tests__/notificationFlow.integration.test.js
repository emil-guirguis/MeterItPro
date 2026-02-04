/**
 * Integration Tests for Notification Flow
 * 
 * Tests the end-to-end notification system including:
 * - Notification creation
 * - Notification retrieval
 * - Notification clearing
 * - Count accuracy
 */

const NotificationService = require('../services/NotificationService');
const db = require('../config/database');

// Mock database
jest.mock('../config/database');

describe('Notification Flow - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Notification Flow', () => {
    it('should create, retrieve, and clear notifications', async () => {
      const meterId = '550e8400-e29b-41d4-a716-446655440000';
      const elementId = 'temperature';
      const notificationType = 'failing';

      // Mock database responses
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // Check for duplicates
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          meter_id: meterId,
          element_id: elementId,
          notification_type: notificationType,
          created_at: new Date().toISOString(),
          cleared: false
        }]
      }); // Create notification
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          meter_id: meterId,
          element_id: elementId,
          notification_type: notificationType,
          created_at: new Date().toISOString(),
          cleared: false
        }]
      }); // Get notifications
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // Delete notification

      // Create notification
      const notification = await NotificationService.createNotification(
        meterId,
        elementId,
        notificationType
      );

      expect(notification).toBeDefined();
      expect(notification.meter_id).toBe(meterId);
      expect(notification.element_id).toBe(elementId);
      expect(notification.notification_type).toBe(notificationType);

      // Get notifications
      const result = await NotificationService.listNotifications(100, 0);
      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);

      // Clear notification
      const cleared = await NotificationService.clearNotification(notification.id);
      expect(cleared).toBe(true);
    });

    it('should prevent duplicate notifications', async () => {
      const meterId = '550e8400-e29b-41d4-a716-446655440000';
      const elementId = 'temperature';
      const notificationType = 'failing';

      // Mock database - first call returns existing notification
      db.query.mockResolvedValueOnce({
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          meter_id: meterId,
          element_id: elementId,
          notification_type: notificationType,
          cleared: false
        }]
      });

      // Try to create duplicate
      const notification = await NotificationService.createIfNotExists(
        meterId,
        elementId,
        notificationType
      );

      // Should return null for duplicate
      expect(notification).toBeNull();
    });

    it('should maintain accurate notification count', async () => {
      // Mock database - return count
      db.query.mockResolvedValueOnce({
        rows: [{ count: '5' }]
      });

      const count = await NotificationService.getNotificationCount();
      expect(count).toBe(5);
    });

    it('should clear all notifications', async () => {
      // Mock database - delete all
      db.query.mockResolvedValueOnce({ rowCount: 5 });

      const deletedCount = await NotificationService.clearAllNotifications();
      expect(deletedCount).toBe(5);
    });
  });

  describe('Notification Validation', () => {
    it('should reject invalid notification type', async () => {
      const meterId = '550e8400-e29b-41d4-a716-446655440000';
      const elementId = 'temperature';
      const invalidType = 'invalid';

      await expect(
        NotificationService.createNotification(meterId, elementId, invalidType)
      ).rejects.toThrow('Invalid notification_type');
    });

    it('should reject missing required fields', async () => {
      await expect(
        NotificationService.createNotification('', 'element', 'failing')
      ).rejects.toThrow('Missing required fields');
    });
  });

  describe('Notification Retrieval', () => {
    it('should retrieve notifications for specific meter', async () => {
      const meterId = '550e8400-e29b-41d4-a716-446655440000';

      db.query.mockResolvedValueOnce({
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          meter_id: meterId,
          element_id: 'temperature',
          notification_type: 'failing',
          created_at: new Date().toISOString(),
          cleared: false
        }]
      });

      const notifications = await NotificationService.getNotificationsForMeter(meterId);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].meter_id).toBe(meterId);
    });

    it('should retrieve notifications for specific element', async () => {
      const meterId = '550e8400-e29b-41d4-a716-446655440000';
      const elementId = 'temperature';

      db.query.mockResolvedValueOnce({
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          meter_id: meterId,
          element_id: elementId,
          notification_type: 'failing',
          created_at: new Date().toISOString(),
          cleared: false
        }]
      });

      const notifications = await NotificationService.getNotificationsForElement(meterId, elementId);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].element_id).toBe(elementId);
    });
  });
});
