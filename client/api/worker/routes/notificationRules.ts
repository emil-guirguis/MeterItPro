/**
 * Notification Rules routes - Hono worker
 */

import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

// GET / - List all notification rules for tenant
app.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const qs = c.req.query();
    const limit = Math.min(parseInt(qs.limit || '100') || 100, 200);
    const offset = parseInt(qs.offset || '0') || 0;
    const active = qs.active ? qs.active === 'true' : undefined;

    let whereClause = 'WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (active !== undefined) {
      whereClause += ` AND active = $${paramIndex}`;
      params.push(active);
      paramIndex++;
    }

    const result = await query(
      c.env,
      `SELECT notification_rule_id, tenant_id, name, description, rule_type, active, threshold_hours, schedule_cron, created_at, updated_at
       FROM public.notification_rule
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      c.env,
      `SELECT COUNT(*) as count FROM public.notification_rule ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const rules = result.rows.map((row) => ({
      ...row,
      id: String(row.notification_rule_id),
    }));

    return c.json({ success: true, data: { rules, total, limit, offset } });
  } catch (error: any) {
    logError('Error fetching notification rules:', error);
    return c.json({ success: false, message: 'Failed to fetch notification rules' }, 500);
  }
});

// GET /:id - Get a specific notification rule with recipients and meters
app.get('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    if (isNaN(Number(id))) {
      return c.json({ success: false, message: 'Invalid rule ID' }, 400);
    }

    const ruleResult = await query(
      c.env,
      `SELECT notification_rule_id, tenant_id, name, description, rule_type, active, threshold_hours, schedule_cron, created_at, updated_at
       FROM public.notification_rule
       WHERE notification_rule_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (ruleResult.rows.length === 0) {
      return c.json({ success: false, message: 'Rule not found' }, 404);
    }

    const rule = ruleResult.rows[0];

    // Get recipients
    const recipientsResult = await query(
      c.env,
      `SELECT notification_rule_recipient_id, users_id, receive_email, email_address
       FROM public.notification_rule_recipient
       WHERE notification_rule_id = $1`,
      [id]
    );

    // Get meters
    const metersResult = await query(
      c.env,
      `SELECT notification_rule_meter_id, meter_id
       FROM public.notification_rule_meter
       WHERE notification_rule_id = $1`,
      [id]
    );

    return c.json({
      success: true,
      data: {
        rule: {
          ...rule,
          id: String(rule.notification_rule_id),
          recipients: recipientsResult.rows,
          meters: metersResult.rows,
        },
      },
    });
  } catch (error: any) {
    logError('Error fetching notification rule:', error);
    return c.json({ success: false, message: 'Failed to fetch notification rule' }, 500);
  }
});

// POST / - Create a new notification rule
app.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const userId = c.get('user').users_id;
    const body = await c.req.json();
    const {
      name,
      description,
      rule_type = 'custom',
      enabled = true,
      threshold_hours,
      schedule_cron = '0 * * * *',
      recipients = [],
      meter_ids = [],
    } = body;

    if (!name) {
      return c.json({ success: false, message: 'Rule name is required' }, 400);
    }

    // Create the rule
    const ruleResult = await query(
      c.env,
      `INSERT INTO public.notification_rule
       (tenant_id, name, description, rule_type, active, threshold_hours, schedule_cron, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING notification_rule_id, tenant_id, name, description, rule_type, active, threshold_hours, schedule_cron, created_at, updated_at`,
      [tenantId, name, description || null, rule_type, true, threshold_hours || null, schedule_cron, userId]
    );

    const rule = ruleResult.rows[0];
    const ruleId = rule.notification_rule_id;

    // Add recipients
    for (const recipient of recipients) {
      await query(
        c.env,
        `INSERT INTO public.notification_rule_recipient
         (notification_rule_id, users_id, receive_email, email_address)
         VALUES ($1, $2, $3, $4)`,
        [ruleId, recipient.users_id, recipient.receive_email !== false, recipient.email_address || null]
      );
    }

    // Add meters
    for (const meterId of meter_ids) {
      await query(
        c.env,
        `INSERT INTO public.notification_rule_meter
         (notification_rule_id, meter_id)
         VALUES ($1, $2)`,
        [ruleId, meterId]
      );
    }

    return c.json(
      {
        success: true,
        data: {
          rule: {
            ...rule,
            id: String(rule.notification_rule_id),
            recipients,
            meters: meter_ids.map((id) => ({ meter_id: id })),
          },
        },
      },
      201
    );
  } catch (error: any) {
    logError('Error creating notification rule:', error);
    return c.json({ success: false, message: 'Failed to create notification rule' }, 500);
  }
});

// PUT /:id - Update a notification rule
app.put('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const {
      name,
      description,
      active,
      threshold_hours,
      schedule_cron,
      recipients = [],
      meter_ids = [],
    } = body;

    if (isNaN(Number(id))) {
      return c.json({ success: false, message: 'Invalid rule ID' }, 400);
    }

    // Update the rule
    const updateResult = await query(
      c.env,
      `UPDATE public.notification_rule
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           active = COALESCE($3, active),
           threshold_hours = COALESCE($4, threshold_hours),
           schedule_cron = COALESCE($5, schedule_cron),
           updated_at = CURRENT_TIMESTAMP
       WHERE notification_rule_id = $6 AND tenant_id = $7
       RETURNING notification_rule_id, tenant_id, name, description, rule_type, active, threshold_hours, schedule_cron, created_at, updated_at`,
      [name || null, description || null, active !== undefined ? active : null, threshold_hours || null, schedule_cron || null, id, tenantId]
    );

    if (updateResult.rows.length === 0) {
      return c.json({ success: false, message: 'Rule not found' }, 404);
    }

    // Update recipients
    await query(c.env, 'DELETE FROM public.notification_rule_recipient WHERE notification_rule_id = $1', [id]);
    for (const recipient of recipients) {
      await query(
        c.env,
        `INSERT INTO public.notification_rule_recipient
         (notification_rule_id, users_id, receive_email, email_address)
         VALUES ($1, $2, $3, $4)`,
        [id, recipient.users_id, recipient.receive_email !== false, recipient.email_address || null]
      );
    }

    // Update meters
    await query(c.env, 'DELETE FROM public.notification_rule_meter WHERE notification_rule_id = $1', [id]);
    for (const meterId of meter_ids) {
      await query(
        c.env,
        `INSERT INTO public.notification_rule_meter
         (notification_rule_id, meter_id)
         VALUES ($1, $2)`,
        [id, meterId]
      );
    }

    return c.json({ success: true, data: { rule: updateResult.rows[0] } });
  } catch (error: any) {
    logError('Error updating notification rule:', error);
    return c.json({ success: false, message: 'Failed to update notification rule' }, 500);
  }
});

// DELETE /:id - Delete a notification rule
app.delete('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    if (isNaN(Number(id))) {
      return c.json({ success: false, message: 'Invalid rule ID' }, 400);
    }

    const result = await query(
      c.env,
      `DELETE FROM public.notification_rule WHERE notification_rule_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if ((result.rowCount ?? 0) === 0) {
      return c.json({ success: false, message: 'Rule not found' }, 404);
    }

    return c.json({ success: true, message: 'Notification rule deleted' });
  } catch (error: any) {
    logError('Error deleting notification rule:', error);
    return c.json({ success: false, message: 'Failed to delete notification rule' }, 500);
  }
});

export default app;
