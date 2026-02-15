/**
 * Reports routes - Hono worker
 * CRUD for reports, history, and email logs.
 */

import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

// Simple cron validation
function isValidCronExpression(expr: string): boolean {
  if (!expr || typeof expr !== 'string') return false;
  const parts = expr.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 7;
}

// Simple email validation
function validateEmailList(emails: string[]): { isValid: boolean; invalidEmails: string[] } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalid = emails.filter((e) => !emailRegex.test(e));
  return { isValid: invalid.length === 0, invalidEmails: invalid };
}

// POST / - Create a new report
app.post('/', async (c) => {
  try {
    const { name, type, schedule, recipients, config } = await c.req.json();
    const errors: string[] = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) errors.push('Report name is required');
    else if (name.length > 255) errors.push('Report name must not exceed 255 characters');

    if (!type || typeof type !== 'string' || type.trim().length === 0) errors.push('Report type is required');
    if (!schedule || !isValidCronExpression(schedule)) errors.push('Report schedule must be a valid cron expression');

    if (!Array.isArray(recipients) || recipients.length === 0) {
      errors.push('At least one recipient is required');
    } else {
      const emailValidation = validateEmailList(recipients);
      if (!emailValidation.isValid) errors.push(`Invalid emails: ${emailValidation.invalidEmails.join(', ')}`);
    }

    if (errors.length > 0) {
      return c.json({ success: false, message: 'Validation failed', errors }, 400);
    }

    const now = new Date();
    const result = await query(
      c.env,
      `INSERT INTO public.report (name, type, schedule, recipients, config, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING report_id, name, type, schedule, recipients, config, active , created_at, updated_at`,
      [name.trim(), type.trim(), schedule.trim(), JSON.stringify(recipients), JSON.stringify(config || {}), true, now, now]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Failed to create report' }, 500);
    }

    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error: any) {
    if (error.code === '23505') return c.json({ success: false, message: 'Report name already exists' }, 409);
    if (error.code === '23502') return c.json({ success: false, message: 'Missing required fields' }, 400);
    console.error('Error creating report:', error);
    return c.json({ success: false, message: 'Failed to create report' }, 500);
  }
});

// GET / - Retrieve all reports with pagination
app.get('/', async (c) => {
  try {
    const qs = c.req.query();
    let page = parseInt(qs.page || '1') || 1;
    let limit = parseInt(qs.limit || '10') || 10;
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    const offset = (page - 1) * limit;

    const countResult = await query(c.env, 'SELECT COUNT(*) as total FROM public.report');
    const total = parseInt(countResult.rows[0].total, 10);

    const result = await query(
      c.env,
      `SELECT report_id, name, type, schedule, recipients, config, active , created_at, updated_at
       FROM public.report ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return c.json({
      success: true,
      data: {
        items: result.rows,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error retrieving reports:', error);
    return c.json({ success: false, message: 'Failed to retrieve reports' }, 500);
  }
});

// GET /:id - Retrieve a specific report
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (isNaN(Number(id))) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const result = await query(
      c.env,
      `SELECT report_id, name, type, schedule, recipients, config, active, created_at, updated_at
       FROM public.report WHERE report_id = $1`,
      [id]
    );

    if (result.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error retrieving report:', error);
    return c.json({ success: false, message: 'Failed to retrieve report' }, 500);
  }
});

// PUT /:id - Update a report
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (isNaN(Number(id))) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const existing = await query(c.env, 'SELECT report_id FROM public.report WHERE report_id = $1', [id]);
    if (existing.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    const { name, type, schedule, recipients, config } = await c.req.json();
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) return c.json({ success: false, message: 'Validation failed', errors: ['Report name must be a non-empty string'] }, 400);
      if (name.length > 255) return c.json({ success: false, message: 'Validation failed', errors: ['Report name must not exceed 255 characters'] }, 400);
      updates.push(`name = $${paramCount}`); values.push(name.trim()); paramCount++;
    }

    if (type !== undefined) {
      if (typeof type !== 'string' || type.trim().length === 0) return c.json({ success: false, message: 'Validation failed', errors: ['Report type must be a non-empty string'] }, 400);
      updates.push(`type = $${paramCount}`); values.push(type.trim()); paramCount++;
    }

    if (schedule !== undefined) {
      if (!isValidCronExpression(schedule)) return c.json({ success: false, message: 'Validation failed', errors: ['Invalid cron expression'] }, 400);
      updates.push(`schedule = $${paramCount}`); values.push(schedule.trim()); paramCount++;
    }

    if (recipients !== undefined) {
      if (!Array.isArray(recipients) || recipients.length === 0) return c.json({ success: false, message: 'Validation failed', errors: ['Recipients must be a non-empty array'] }, 400);
      const emailValidation = validateEmailList(recipients);
      if (!emailValidation.isValid) return c.json({ success: false, message: 'Validation failed', errors: [`Invalid emails: ${emailValidation.invalidEmails.join(', ')}`] }, 400);
      updates.push(`recipients = $${paramCount}`); values.push(JSON.stringify(recipients)); paramCount++;
    }

    if (config !== undefined) {
      if (typeof config !== 'object' || config === null) return c.json({ success: false, message: 'Validation failed', errors: ['Config must be an object'] }, 400);
      updates.push(`config = $${paramCount}`); values.push(JSON.stringify(config)); paramCount++;
    }

    if (updates.length === 0) {
      const result = await query(c.env, 'SELECT * FROM public.report WHERE report_id = $1', [id]);
      return c.json({ success: true, data: result.rows[0] });
    }

    updates.push(`updated_at = $${paramCount}`); values.push(new Date()); paramCount++;
    values.push(id);

    const result = await query(
      c.env,
      `UPDATE public.report SET ${updates.join(', ')} WHERE report_id = $${paramCount} RETURNING report_id, name, type, schedule, recipients, config, active, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) return c.json({ success: false, message: 'Failed to update report' }, 500);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') return c.json({ success: false, message: 'Report name already exists' }, 409);
    console.error('Error updating report:', error);
    return c.json({ success: false, message: 'Failed to update report' }, 500);
  }
});

// DELETE /:id - Delete a report
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (isNaN(Number(id))) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const existing = await query(c.env, 'SELECT report_id, name FROM public.report WHERE report_id = $1', [id]);
    if (existing.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    await query(c.env, 'DELETE FROM public.report WHERE report_id = $1', [id]);
    return c.json({ success: true, message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return c.json({ success: false, message: 'Failed to delete report' }, 500);
  }
});

// PATCH /:id/toggle - Toggle the active status
app.patch('/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id');
    if (isNaN(Number(id))) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const getResult = await query(c.env, 'SELECT report_id, name, active FROM public.report WHERE report_id = $1', [id]);
    if (getResult.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    const newActive = !getResult.rows[0].active;
    const result = await query(
      c.env,
      'UPDATE public.report SET active = $1, updated_at = $2 WHERE report_id = $3 RETURNING report_id, name, active, updated_at',
      [newActive, new Date(), id]
    );

    if (result.rows.length === 0) return c.json({ success: false, message: 'Failed to toggle report status' }, 500);

    return c.json({
      success: true,
      data: {
        id: result.rows[0].report_id,
        name: result.rows[0].name,
        active: result.rows[0].active,
        updated_at: result.rows[0].updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error toggling report status:', error);
    return c.json({ success: false, message: 'Failed to toggle report status' }, 500);
  }
});

// GET /:id/history - Get report execution history
app.get('/:id/history', async (c) => {
  try {
    const id = c.req.param('id');
    if (isNaN(Number(id))) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const qs = c.req.query();
    let page = parseInt(qs.page || '1') || 1;
    let limit = parseInt(qs.limit || '10') || 10;
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    const offset = (page - 1) * limit;

    const reportCheck = await query(c.env, 'SELECT report_id FROM public.report WHERE report_id = $1', [id]);
    if (reportCheck.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    let countSql = 'SELECT COUNT(*) as total FROM public.report_history WHERE report_id = $1';
    let historySql = 'SELECT report_history_id, report_id, executed_at, status, error_message, created_at FROM public.report_history WHERE report_id = $1';
    const countParams: any[] = [id];
    const historyParams: any[] = [id];

    if (qs.startDate) {
      const start = new Date(qs.startDate);
      if (isNaN(start.getTime())) return c.json({ success: false, message: 'Invalid startDate format' }, 400);
      countSql += ' AND executed_at >= $2';
      historySql += ' AND executed_at >= $2';
      countParams.push(start);
      historyParams.push(start);
    }

    if (qs.endDate) {
      const end = new Date(qs.endDate);
      if (isNaN(end.getTime())) return c.json({ success: false, message: 'Invalid endDate format' }, 400);
      const idx = countParams.length + 1;
      countSql += ` AND executed_at < $${idx}`;
      historySql += ` AND executed_at < $${idx}`;
      countParams.push(end);
      historyParams.push(end);
    }

    const countResult = await query(c.env, countSql, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const paramIdx = historyParams.length + 1;
    historySql += ` ORDER BY executed_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    historyParams.push(limit, offset);

    const historyResult = await query(c.env, historySql, historyParams);

    return c.json({
      success: true,
      data: {
        history: historyResult.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    console.error('Error retrieving report history:', error);
    return c.json({ success: false, message: 'Failed to retrieve report history' }, 500);
  }
});

// GET /:id/history/:historyId/emails - Get email logs for a report execution
app.get('/:id/history/:historyId/emails', async (c) => {
  try {
    const id = c.req.param('id');
    const historyId = c.req.param('historyId');

    if (isNaN(Number(id)) || isNaN(Number(historyId))) {
      return c.json({ success: false, message: 'Invalid report ID or history ID format' }, 400);
    }

    const reportCheck = await query(c.env, 'SELECT report_id FROM public.report WHERE report_id = $1', [id]);
    if (reportCheck.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    const historyCheck = await query(c.env, 'SELECT report_history_id FROM public.report_history WHERE report_history_id = $1 AND report_id = $2', [historyId, id]);
    if (historyCheck.rows.length === 0) return c.json({ success: false, message: 'History entry not found' }, 404);

    const result = await query(
      c.env,
      `SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
       FROM public.report_email_logs WHERE report_history_id = $1 ORDER BY sent_at DESC`,
      [historyId]
    );

    return c.json({ success: true, data: { emails: result.rows } });
  } catch (error: any) {
    console.error('Error retrieving email logs:', error);
    return c.json({ success: false, message: 'Failed to retrieve email logs' }, 500);
  }
});

export default app;
