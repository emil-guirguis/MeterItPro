/**
 * Notifications routes - Hono worker
 */

import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

// GET /count - Count of visible notifications for current user
app.get('/count', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('user').users_id;

    const result = await query(
      c.env,
      `SELECT COUNT(*) as count FROM public.notification
       WHERE tenant_id = $1 AND (users_id IS NULL OR users_id = $2)`,
      [tenantId, userId]
    );

    const count = parseInt(result.rows[0].count, 10);
    return c.json({ success: true, data: { count } });
  } catch (error: any) {
    logError('Error counting notifications:', error);
    return c.json({ success: false, message: 'Failed to count notifications' }, 500);
  }
});

// GET / - List notifications for current user
app.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('user').users_id;
    const qs = c.req.query();
    const limit = Math.min(parseInt(qs.limit || '100') || 100, 200);
    const offset = parseInt(qs.offset || '0') || 0;

    const result = await query(
      c.env,
      `SELECT notification_id, tenant_id, users_id, meter_id, meter_element_id,
              notification_type, severity, title, description, created_at
       FROM public.notification
       WHERE tenant_id = $1 AND (users_id IS NULL OR users_id = $2)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [tenantId, userId, limit, offset]
    );

    const countResult = await query(
      c.env,
      `SELECT COUNT(*) as count FROM public.notification
       WHERE tenant_id = $1 AND (users_id IS NULL OR users_id = $2)`,
      [tenantId, userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const notifications = result.rows.map((row) => ({
      ...row,
      id: String(row.notification_id),
    }));

    return c.json({ success: true, data: { notifications, total, limit, offset } });
  } catch (error: any) {
    logError('Error fetching notifications:', error);
    return c.json({ success: false, message: 'Failed to fetch notifications' }, 500);
  }
});

// POST / - Create a notification
app.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const {
      meter_id,
      meter_element_id,
      notification_type,
      severity = 'warning',
      title,
      description,
      users_id,
    } = body;

    if (!notification_type || !title) {
      return c.json({ success: false, message: 'notification_type and title are required' }, 400);
    }

    const result = await query(
      c.env,
      `INSERT INTO public.notification
         (tenant_id, users_id, meter_id, meter_element_id, notification_type, severity, title, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING notification_id, tenant_id, users_id, meter_id, meter_element_id,
                 notification_type, severity, title, description, created_at`,
      [
        tenantId,
        users_id || null,
        meter_id || null,
        meter_element_id || null,
        notification_type,
        severity,
        title,
        description || null,
      ]
    );

    const row = result.rows[0];
    return c.json(
      { success: true, data: { notification: { ...row, id: String(row.notification_id) } } },
      201
    );
  } catch (error: any) {
    logError('Error creating notification:', error);
    return c.json({ success: false, message: 'Failed to create notification' }, 500);
  }
});

// DELETE /:id - Hard delete a specific notification (scoped to tenant)
app.delete('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    if (isNaN(Number(id))) {
      return c.json({ success: false, message: 'Invalid notification ID' }, 400);
    }

    const result = await query(
      c.env,
      `DELETE FROM public.notification WHERE notification_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if ((result.rowCount ?? 0) === 0) {
      return c.json({ success: false, message: 'Notification not found' }, 404);
    }

    return c.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    logError('Error deleting notification:', error);
    return c.json({ success: false, message: 'Failed to delete notification' }, 500);
  }
});

// DELETE / - Hard delete all visible notifications for current user
app.delete('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('user').users_id;

    const result = await query(
      c.env,
      `DELETE FROM public.notification
       WHERE tenant_id = $1 AND (users_id IS NULL OR users_id = $2)`,
      [tenantId, userId]
    );

    const deletedCount = result.rowCount ?? 0;
    return c.json({ success: true, data: { deleted_count: deletedCount } });
  } catch (error: any) {
    logError('Error deleting all notifications:', error);
    return c.json({ success: false, message: 'Failed to delete notifications' }, 500);
  }
});

export default app;
