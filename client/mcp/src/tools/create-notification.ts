import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface CreateNotificationArgs {
  tenant_id: number;
  notification_type: string;
  title: string;
  severity?: string;
  description?: string;
  meter_id?: number | null;
  meter_element_id?: number | null;
  users_id?: number | null;
}

export async function createNotification(args: CreateNotificationArgs) {
  try {
    const {
      tenant_id,
      notification_type,
      title,
      severity = 'warning',
      description,
      meter_id = null,
      meter_element_id = null,
      users_id = null,
    } = args;

    if (!tenant_id || !notification_type || !title) {
      throw new Error('Missing required fields: tenant_id, notification_type, title');
    }

    logger.info('Creating notification', { tenant_id, notification_type });

    // Check if notification already exists for this tenant + type + meter + element
    const existingResult = await db.query(
      `SELECT notification_id FROM notification
       WHERE tenant_id = $1
         AND notification_type = $2
         AND (meter_id IS NOT DISTINCT FROM $3)
         AND (meter_element_id IS NOT DISTINCT FROM $4)
       LIMIT 1`,
      [tenant_id, notification_type, meter_id, meter_element_id]
    );

    if (existingResult.rows.length > 0) {
      logger.warn('Notification already exists', { tenant_id, notification_type, meter_id, meter_element_id });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Notification already exists for this type',
              code: 'DUPLICATE_NOTIFICATION',
            }),
          },
        ],
      };
    }

    const result = await db.query(
      `INSERT INTO notification
         (tenant_id, users_id, meter_id, meter_element_id, notification_type, severity, title, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING notification_id, tenant_id, users_id, meter_id, meter_element_id,
                 notification_type, severity, title, description, created_at`,
      [tenant_id, users_id, meter_id, meter_element_id, notification_type, severity, title, description || null]
    );

    const notification = result.rows[0];

    logger.info('Notification created successfully', {
      notification_id: notification.notification_id,
      tenant_id,
      notification_type,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, data: { notification } }),
        },
      ],
    };
  } catch (error) {
    logger.error('Error creating notification', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
