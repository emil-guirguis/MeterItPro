/**
 * Notification Rules routes - Hono worker
 */

import { Hono } from 'hono';
import { Env, execQuery } from '../db';

import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';
import { runNotificationRule } from '../notificationRunner';

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

    const result = await execQuery(
      c.env,
      `SELECT notification_rule_id, tenant_id, name, description, rule_type, active, threshold_hours, demand_threshold, schedule_cron, meter_selections, created_at, updated_at
       FROM public.notification_rule
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const countResult = await execQuery(
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

    const ruleResult = await execQuery(
      c.env,
      `SELECT notification_rule_id, tenant_id, name, description, rule_type, active, threshold_hours, demand_threshold, schedule_cron, meter_selections, created_at, updated_at
       FROM public.notification_rule
       WHERE notification_rule_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (ruleResult.rows.length === 0) {
      return c.json({ success: false, message: 'Rule not found' }, 404);
    }

    const rule = ruleResult.rows[0];

    // Get recipients
    const recipientsResult = await execQuery(
      c.env,
      `SELECT notification_rule_recipient_id, email_address
       FROM public.notification_rule_recipient
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
      threshold_hours,
      demand_threshold,
      schedule_cron = '0 * * * *',
      recipients = [],
      meter_selections,
    } = body;

    if (!name) {
      return c.json({ success: false, message: 'Rule name is required' }, 400);
    }

    // Create the rule
    const meterSelectionsJson = meter_selections !== undefined
      ? (typeof meter_selections === 'string' ? meter_selections : JSON.stringify(meter_selections))
      : null;

    const ruleResult = await execQuery(
      c.env,
      `INSERT INTO public.notification_rule
       (tenant_id, name, description, rule_type, active, threshold_hours, demand_threshold, schedule_cron, created_by, meter_selections)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING notification_rule_id, tenant_id, name, description, rule_type, active, threshold_hours, demand_threshold, schedule_cron, meter_selections, created_at, updated_at`,
      [tenantId, name, description || null, rule_type, true, threshold_hours || null, demand_threshold || null, schedule_cron, userId, meterSelectionsJson]
    );

    const rule = ruleResult.rows[0];
    const ruleId = rule.notification_rule_id;

    // Add recipients
    for (const recipient of recipients) {
      if (!recipient.email_address) continue;
      await execQuery(
        c.env,
        `INSERT INTO public.notification_rule_recipient
         (notification_rule_id, email_address)
         VALUES ($1, $2)
         ON CONFLICT (notification_rule_id, email_address) DO NOTHING`,
        [ruleId, recipient.email_address]
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

    if (isNaN(Number(id))) {
      return c.json({ success: false, message: 'Invalid rule ID' }, 400);
    }

    const body = await c.req.json();
    const { name, description, rule_type, active, threshold_hours, demand_threshold, schedule_cron, recipients, meter_selections } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) { updates.push(`name = $${paramCount}`); values.push(name); paramCount++; }
    if (description !== undefined) { updates.push(`description = $${paramCount}`); values.push(description || null); paramCount++; }
    if (rule_type !== undefined) { updates.push(`rule_type = $${paramCount}`); values.push(rule_type); paramCount++; }
    if (active !== undefined) { updates.push(`active = $${paramCount}`); values.push(active); paramCount++; }
    if (threshold_hours !== undefined) { updates.push(`threshold_hours = $${paramCount}`); values.push(threshold_hours || null); paramCount++; }
    if (demand_threshold !== undefined) { updates.push(`demand_threshold = $${paramCount}`); values.push(demand_threshold || null); paramCount++; }
    if (schedule_cron !== undefined) { updates.push(`schedule_cron = $${paramCount}`); values.push(schedule_cron); paramCount++; }
    if (meter_selections !== undefined) {
      const ms = meter_selections === null ? null : (typeof meter_selections === 'string' ? meter_selections : JSON.stringify(meter_selections));
      updates.push(`meter_selections = $${paramCount}`); values.push(ms); paramCount++;
    }

    if (updates.length === 0 && recipients === undefined) {
      return c.json({ success: false, message: 'No fields to update' }, 400);
    }

    let updateResult;
    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id, tenantId);
      updateResult = await execQuery(
        c.env,
        `UPDATE public.notification_rule
         SET ${updates.join(', ')}
         WHERE notification_rule_id = $${paramCount} AND tenant_id = $${paramCount + 1}
         RETURNING notification_rule_id, tenant_id, name, description, rule_type, active, threshold_hours, demand_threshold, schedule_cron, meter_selections, created_at, updated_at`,
        values
      );

      if (updateResult.rows.length === 0) {
        return c.json({ success: false, message: 'Rule not found' }, 404);
      }
    } else {
      updateResult = await execQuery(
        c.env,
        `SELECT notification_rule_id, tenant_id, name, description, rule_type, active, threshold_hours, demand_threshold, schedule_cron, meter_selections, created_at, updated_at
         FROM public.notification_rule WHERE notification_rule_id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      if (updateResult.rows.length === 0) {
        return c.json({ success: false, message: 'Rule not found' }, 404);
      }
    }

    // Update recipients if provided
    if (recipients !== undefined) {
      const recipientList: any[] = Array.isArray(recipients) ? recipients : [];
      await execQuery(c.env, 'DELETE FROM public.notification_rule_recipient WHERE notification_rule_id = $1', [id]);
      for (const recipient of recipientList) {
        if (!recipient.email_address) continue;
        await execQuery(
          c.env,
          `INSERT INTO public.notification_rule_recipient (notification_rule_id, email_address)
           VALUES ($1, $2)
           ON CONFLICT (notification_rule_id, email_address) DO NOTHING`,
          [id, recipient.email_address]
        );
      }
    }

    return c.json({ success: true, data: { rule: updateResult.rows[0] } });
  } catch (error: any) {
    logError('Error updating notification rule:', error);
    return c.json({ success: false, message: 'Failed to update notification rule' }, 500);
  }
});

// GET /:id/history - Get notification history for a rule
app.get('/:id/history', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    if (isNaN(Number(id))) {
      return c.json({ success: false, message: 'Invalid rule ID' }, 400);
    }

    const qs = c.req.query();
    let page = parseInt(qs.page || '1') || 1;
    let limit = parseInt(qs.limit || '20') || 20;
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;
    const offset = (page - 1) * limit;

    const countResult = await execQuery(
      c.env,
      `SELECT COUNT(*) as total FROM public.notification_history WHERE notification_rule_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const result = await execQuery(
      c.env,
      `SELECT notification_history_id, title, description, status, sent_at, created_at
       FROM public.notification_history
       WHERE notification_rule_id = $1 AND tenant_id = $2
       ORDER BY sent_at DESC
       LIMIT $3 OFFSET $4`,
      [id, tenantId, limit, offset]
    );

    return c.json({
      success: true,
      data: {
        history: result.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    logError('Error fetching notification rule history:', error);
    return c.json({ success: false, message: 'Failed to fetch notification rule history' }, 500);
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

    const result = await execQuery(
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

// POST /:id/run - Run a notification rule immediately
app.post('/:id/run', async (c) => {
  try {
    const id = c.req.param('id');
    await runNotificationRule(c.env, id);
    return c.json({ success: true, message: 'Notification rule executed.' });
  } catch (error: any) {
    const msg = error?.message ?? 'Failed to run notification rule';
    if (msg.includes('not found or inactive')) {
      return c.json({ success: false, message: msg }, 404);
    }
    logError('Error running notification rule:', error);
    return c.json({ success: false, message: msg }, 500);
  }
});

export default app;
