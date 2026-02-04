// @ts-nocheck
/**
 * NotificationSettings Model with Schema Definition
 * 
 * Single source of truth for NotificationSettings entity schema.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class NotificationSettings extends BaseModel {
  constructor(data = {}) {
    super(data);

    // Auto-initialize all fields from schema
    NotificationSettings.schema.initializeFromData(this, data);
  }

  /**
   * @override
   */
  static get tableName() {
    return 'notification_setting';
  }

  /**
   * @override
   */
  static get primaryKey() {
    return 'notification_setting_id';
  }

  /**
   * @override
   */
  static get schema() {
    return defineSchema({
      notification_setting_id: field({
        type: FieldTypes.INTEGER,
        primaryKey: true,
        readOnly: true,
        label: 'Notification Setting ID'
      }),
      tenant_id: field({
        type: FieldTypes.INTEGER,
        required: true,
        label: 'Tenant ID',
        description: 'The tenant this setting belongs to'
      }),
      meter_health_check_time: field({
        type: FieldTypes.STRING,
        required: true,
        label: 'Meter Health Check Time',
        description: 'Time for meter health checks (HH:MM format)',
        defaultValue: ''
      }),
      daily_meter_health_email_time: field({
        type: FieldTypes.STRING,
        required: true,
        label: 'Daily Meter Health Email Time',
        description: 'Time for daily meter health email delivery',
        defaultValue: ''
      }),
      email_template_id: field({
        type: FieldTypes.INTEGER,
        required: false,
        label: 'Email Template ID',
        description: 'ID of the email template to use for notifications'
      }),
      created_at: field({
        type: FieldTypes.TIMESTAMP,
        readOnly: true,
        label: 'Created At',
        description: 'When the settings were created'
      }),
      updated_at: field({
        type: FieldTypes.TIMESTAMP,
        readOnly: true,
        label: 'Updated At',
        description: 'When the settings were last updated'
      })
    });
  }

  /**
   * Get notification settings for a tenant
   */
  static async getByTenant(tenantId) {
    const db = require('../config/database');
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = $1 LIMIT 1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new this(result.rows[0]);
  }

  /**
   * Create or update notification settings for a tenant
   */
  static async upsertForTenant(tenantId, updates) {
    const db = require('../config/database');
    const now = new Date().toISOString();

    const result = await db.query(
      `INSERT INTO ${this.tableName} 
       (tenant_id, meter_health_check_time, daily_meter_health_email_time, email_template_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (tenant_id) DO UPDATE SET
         meter_health_check_time = EXCLUDED.meter_health_check_time,
         daily_meter_health_email_time = EXCLUDED.daily_meter_health_email_time,
         email_template_id = EXCLUDED.email_template_id,
         updated_at = $6
       RETURNING *`,
      [
        tenantId,
        updates.meter_health_check_time || '',
        updates.daily_meter_health_email_time || '',
        updates.email_template_id || null,
        now,
        now
      ]
    );

    return new this(result.rows[0]);
  }

  /**
   * Update notification settings for a tenant
   */
  static async updateForTenant(tenantId, updates) {
    const db = require('../config/database');
    const now = new Date().toISOString();

    const current = await this.getByTenant(tenantId);
    if (!current) {
      throw new Error('Notification settings not found for tenant');
    }

    const result = await db.query(
      `UPDATE ${this.tableName}
       SET meter_health_check_time = $1,
           daily_meter_health_email_time = $2,
           email_template_id = $3,
           updated_at = $4
       WHERE tenant_id = $5
       RETURNING *`,
      [
        updates.meter_health_check_time !== undefined ? updates.meter_health_check_time : current.meter_health_check_time,
        updates.daily_meter_health_email_time !== undefined ? updates.daily_meter_health_email_time : current.daily_meter_health_email_time,
        updates.email_template_id !== undefined ? updates.email_template_id : current.email_template_id,
        now,
        tenantId
      ]
    );

    return new this(result.rows[0]);
  }

  /**
   * Delete notification settings for a tenant
   */
  static async deleteForTenant(tenantId) {
    const db = require('../config/database');
    const result = await db.query(
      `DELETE FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
    );
    return result.rowCount > 0;
  }
}

module.exports = NotificationSettings;
