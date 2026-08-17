import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface DeleteNotificationArgs {
  notification_id: number;
}

export async function deleteNotification(args: DeleteNotificationArgs) {
  try {
    const { notification_id } = args;

    if (!notification_id) {
      throw new Error('Missing required field: notification_id');
    }

    logger.info('Deleting notification', { notification_id });

    const result = await db.query(
      `DELETE FROM notification WHERE notification_id = $1`,
      [notification_id]
    );

    if (result.rowCount === 0) {
      logger.warn('Notification not found', { notification_id });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Notification not found',
              code: 'NOT_FOUND',
            }),
          },
        ],
      };
    }

    logger.info('Notification deleted successfully', { notification_id });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              deleted: true,
              notification_id,
            },
          }),
        },
      ],
    };
  } catch (error) {
    logger.error('Error deleting notification', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
