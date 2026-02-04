// @ts-nocheck
/**
 * Notification Model with Schema Definition
 * 
 * Single source of truth for Notification entity schema.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Notification extends BaseModel {
  constructor(data = {}) {
    super(data);

    // Auto-initialize all fields from schema
    Notification.schema.initializeFromData(this, data);
  }

  /**
   * @override
   */
  static get tableName() {
    return 'notification';
  }

  /**
   * @override
   */
  static get primaryKey() {
    return 'notification_id';
  }

  /**
   * @override
   */
  static get schema() {
    return defineSchema({
      notification_id: field({
        type: FieldTypes.INTEGER,
        primaryKey: true,
        readOnly: true,
        label: 'Notification ID'
      }),
      tenant_id: field({
        type: FieldTypes.INTEGER,
        required: true,
        label: 'Tenant ID',
        description: 'The tenant this notification belongs to'
      }),
      notification_type: field({
        type: FieldTypes.STRING,
        required: true,
        label: 'Notification Type',
        description: 'Type of notification (e.g., meter_health, alert, system)'
      }),
      description: field({
        type: FieldTypes.TEXT,
        required: false,
        label: 'Description',
        description: 'Detailed description of the notification'
      }),
      created_at: field({
        type: FieldTypes.TIMESTAMP,
        readOnly: true,
        label: 'Created At',
        description: 'When the notification was created'
      })
    });
  }

  /**
   * Get all notifications for a tenant
   */
  static async getByTenant(tenantId, limit = 100, offset = 0) {
    const db = require('../config/database');
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    return result.rows.map(row => new this(row));
  }

  /**
   * Get notifications by type for a tenant
   */
  static async getByType(tenantId, notificationType, limit = 100, offset = 0) {
    const db = require('../config/database');
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1 AND notification_type = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [tenantId, notificationType, limit, offset]
    );
    return result.rows.map(row => new this(row));
  }

  /**
   * Get count of notifications for a tenant
   */
  static async getCountByTenant(tenantId) {
    const db = require('../config/database');
    const result = await db.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if a notification already exists for a type
   */
  static async existsForType(tenantId, notificationType) {
    const db = require('../config/database');
    const result = await db.query(
      `SELECT notification_id FROM ${this.tableName} WHERE tenant_id = $1 AND notification_type = $2 LIMIT 1`,
      [tenantId, notificationType]
    );
    return result.rows.length > 0;
  }

  /**
   * Create a notification if it doesn't already exist
   */
  static async createIfNotExists(tenantId, notificationType) {
    const exists = await this.existsForType(tenantId, notificationType);
    if (exists) {
      return null; // Duplicate prevention
    }

    const notification = new this({
      tenant_id: tenantId,
      notification_type: notificationType
    });

    return await notification.save();
  }

  /**
   * Delete a notification by ID
   */
  static async deleteById(notificationId) {
    const db = require('../config/database');
    const result = await db.query(
      `DELETE FROM ${this.tableName} WHERE notification_id = $1`,
      [notificationId]
    );
    return result.rowCount > 0;
  }

  /**
   * Delete all notifications for a tenant
   */
  static async deleteByTenant(tenantId) {
    const db = require('../config/database');
    const result = await db.query(
      `DELETE FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
    );
    return result.rowCount;
  }

  /**
   * Delete notifications by type for a tenant
   */
  static async deleteByType(tenantId, notificationType) {
    const db = require('../config/database');
    const result = await db.query(
      `DELETE FROM ${this.tableName} WHERE tenant_id = $1 AND notification_type = $2`,
      [tenantId, notificationType]
    );
    return result.rowCount;
  }
}

module.exports = Notification;
