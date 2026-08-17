import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface GetNotificationsArgs {
  tenant_id: number;
  notification_type?: string;
  limit?: number;
  offset?: number;
}

export async function getNotifications(args: GetNotificationsArgs) {
  try {
    const { tenant_id, notification_type, limit = 100, offset = 0 } = args;

    if (!tenant_id) {
      throw new Error('Missing required field: tenant_id');
    }

    logger.info('Fetching notifications', { tenant_id, notification_type, limit, offset });

    let selectQuery = `
      SELECT notification_id, tenant_id, users_id, meter_id, meter_element_id,
             notification_type, severity, title, description, created_at
      FROM notification
      WHERE tenant_id = $1`;
    const params: any[] = [tenant_id];
    let paramIndex = 2;

    if (notification_type) {
      selectQuery += ` AND notification_type = $${paramIndex}`;
      params.push(notification_type);
      paramIndex++;
    }

    selectQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(selectQuery, params);

    let countQuery = `SELECT COUNT(*) as count FROM notification WHERE tenant_id = $1`;
    const countParams: any[] = [tenant_id];
    if (notification_type) {
      countQuery += ` AND notification_type = $2`;
      countParams.push(notification_type);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    logger.info('Notifications fetched successfully', {
      tenant_id,
      count: result.rows.length,
      total,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: { notifications: result.rows, total, limit, offset },
          }),
        },
      ],
    };
  } catch (error) {
    logger.error('Error fetching notifications', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
