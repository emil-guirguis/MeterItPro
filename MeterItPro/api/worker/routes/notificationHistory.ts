/**
 * Notification History routes - Hono worker
 */

import { Hono } from 'hono';
import { Env, execQuery } from '../db';

import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

// GET / - List notification history for tenant
app.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const qs = c.req.query();
    const limit = Math.min(parseInt(qs.limit || '50') || 50, 200);
    const offset = parseInt(qs.offset || '0') || 0;
    const meterId = qs.meter_id ? parseInt(qs.meter_id) : undefined;

    let whereClause = 'WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (meterId) {
      whereClause += ` AND meter_id = $${paramIndex}`;
      params.push(meterId);
      paramIndex++;
    }

    const result = await execQuery(
      c.env,
      `SELECT notification_history_id, tenant_id, notification_rule_id, users_id, meter_id, title, description, status, sent_at, created_at
       FROM public.notification_history
       ${whereClause}
       ORDER BY sent_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const countResult = await execQuery(
      c.env,
      `SELECT COUNT(*) as count FROM public.notification_history ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const history = result.rows.map((row) => ({
      ...row,
      id: String(row.notification_history_id),
    }));

    return c.json({ success: true, data: { history, total, limit, offset } });
  } catch (error: any) {
    logError('Error fetching notification history:', error);
    return c.json({ success: false, message: 'Failed to fetch notification history' }, 500);
  }
});

// GET /meter/:meterId - Get notification history for a specific meter (last 24 hours)
app.get('/meter/:meterId', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const meterId = c.req.param('meterId');

    if (isNaN(Number(meterId))) {
      return c.json({ success: false, message: 'Invalid meter ID' }, 400);
    }

    // Get notifications for this meter in the last 24 hours
    const result = await execQuery(
      c.env,
      `SELECT notification_history_id, notification_rule_id, title, description, status, sent_at
       FROM public.notification_history
       WHERE tenant_id = $1 AND meter_id = $2 AND sent_at >= NOW() - INTERVAL '24 hours'
       ORDER BY sent_at DESC`,
      [tenantId, meterId]
    );

    return c.json({
      success: true,
      data: {
        notifications: result.rows.map((row) => ({
          ...row,
          id: String(row.notification_history_id),
        })),
      },
    });
  } catch (error: any) {
    logError('Error fetching meter notification history:', error);
    return c.json({ success: false, message: 'Failed to fetch meter notification history' }, 500);
  }
});

// POST / - Record a notification in history
app.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const {
      notification_rule_id,
      users_id,
      meter_id,
      title,
      description,
      status = 'sent',
    } = body;

    if (!title) {
      return c.json({ success: false, message: 'Title is required' }, 400);
    }

    const result = await execQuery(
      c.env,
      `INSERT INTO public.notification_history
       (tenant_id, notification_rule_id, users_id, meter_id, title, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING notification_history_id, tenant_id, notification_rule_id, users_id, meter_id, title, description, status, sent_at, created_at`,
      [tenantId, notification_rule_id || null, users_id || null, meter_id || null, title, description || null, status]
    );

    return c.json(
      {
        success: true,
        data: { history: { ...result.rows[0], id: String(result.rows[0].notification_history_id) } },
      },
      201
    );
  } catch (error: any) {
    logError('Error recording notification history:', error);
    return c.json({ success: false, message: 'Failed to record notification history' }, 500);
  }
});

export default app;
