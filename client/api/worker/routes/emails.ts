/**
 * Email routes - Hono worker
 * Send operations return 501 (nodemailer not available on Workers).
 * CRUD-like operations (logs, stats, tracking) use raw SQL.
 */

import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, requirePermission, AuthVariables } from '../middleware';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

// POST /send - 501 Not Implemented
app.post('/send', requirePermission('email:send'), (c) => {
  return c.json({ success: false, message: 'Email sending not yet supported on this deployment' }, 501);
});

// POST /send-raw - 501 Not Implemented
app.post('/send-raw', requirePermission('email:send'), (c) => {
  return c.json({ success: false, message: 'Email sending not yet supported on this deployment' }, 501);
});

// POST /send-with-attachment - 501 Not Implemented
app.post('/send-with-attachment', (c) => {
  return c.json({ success: false, message: 'Email sending with attachments not yet supported on this deployment' }, 501);
});

// POST /send-bulk - 501 Not Implemented
app.post('/send-bulk', requirePermission('email:send'), (c) => {
  return c.json({ success: false, message: 'Bulk email sending not yet supported on this deployment' }, 501);
});

// GET /delivery-stats - Get email delivery statistics
app.get('/delivery-stats', requirePermission('email:read'), async (c) => {
  try {
    const result = await query(
      c.env,
      `SELECT
        status,
        COUNT(*) as count
       FROM email_logs
       GROUP BY status
       ORDER BY status`
    );

    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching delivery stats:', error);
    return c.json({ success: false, message: 'Failed to fetch delivery statistics' }, 500);
  }
});

// GET /logs - Get email logs
app.get('/logs', requirePermission('email:read'), async (c) => {
  try {
    const qs = c.req.query();
    const page = parseInt(qs.page || '1') || 1;
    const limit = parseInt(qs.limit || '20') || 20;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        el.*,
        et.name as template_name
      FROM email_logs el
      LEFT JOIN email_template et ON el.template_id = et.email_template_id
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 0;

    if (qs.status) {
      paramCount++;
      sql += ` AND el.status = $${paramCount}`;
      values.push(qs.status);
    }

    if (qs.startDate) {
      paramCount++;
      sql += ` AND el.created_at >= $${paramCount}`;
      values.push(qs.startDate);
    }

    if (qs.endDate) {
      paramCount++;
      sql += ` AND el.created_at <= $${paramCount}`;
      values.push(qs.endDate);
    }

    if (qs.search) {
      paramCount++;
      sql += ` AND (el.recipient ILIKE $${paramCount} OR el.subject ILIKE $${paramCount})`;
      values.push(`%${qs.search}%`);
    }

    // Count query
    const countSql = sql.replace(
      'SELECT \n        el.*,\n        et.name as template_name',
      'SELECT COUNT(*)'
    );
    const countResult = await query(c.env, countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Paginated query
    sql += ' ORDER BY el.created_at DESC';
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    values.push(limit);
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    values.push(offset);

    const result = await query(c.env, sql, values);
    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching email logs:', error);
    return c.json({ success: false, message: 'Failed to fetch email logs' }, 500);
  }
});

// GET /track/open/:trackingId - Track email opens (returns 1x1 transparent pixel)
app.get('/track/open/:trackingId', async (c) => {
  try {
    const trackingId = c.req.param('trackingId');

    await query(
      c.env,
      `UPDATE email_logs
       SET opened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE tracking_id = $1 AND opened_at IS NULL`,
      [trackingId]
    );
  } catch (error) {
    console.error('Error tracking email open:', error);
  }

  // Return 1x1 transparent pixel
  const pixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const pixelBytes = Uint8Array.from(atob(pixelBase64), (ch) => ch.charCodeAt(0));

  return new Response(pixelBytes, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(pixelBytes.length),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
});

// POST /notifications/trigger - 501 Not Implemented
app.post('/notifications/trigger', requirePermission('notification:send'), (c) => {
  return c.json({ success: false, message: 'Notification triggering not yet supported on this deployment' }, 501);
});

// GET /notifications/status - 501 Not Implemented
app.get('/notifications/status', requirePermission('notification:read'), (c) => {
  return c.json({ success: false, message: 'Notification scheduler not available on this deployment' }, 501);
});

// GET /notifications/logs - Get notification logs
app.get('/notifications/logs', requirePermission('notification:read'), async (c) => {
  try {
    const qs = c.req.query();
    const page = parseInt(qs.page || '1') || 1;
    const limit = parseInt(qs.limit || '20') || 20;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        nl.*,
        et.name as template_name
      FROM notification_logs nl
      LEFT JOIN email_template et ON nl.template_id = et.email_template_id
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 0;

    if (qs.type) {
      paramCount++;
      sql += ` AND nl.type = $${paramCount}`;
      values.push(qs.type);
    }

    if (qs.status) {
      paramCount++;
      sql += ` AND nl.status = $${paramCount}`;
      values.push(qs.status);
    }

    if (qs.startDate) {
      paramCount++;
      sql += ` AND nl.created_at >= $${paramCount}`;
      values.push(qs.startDate);
    }

    if (qs.endDate) {
      paramCount++;
      sql += ` AND nl.created_at <= $${paramCount}`;
      values.push(qs.endDate);
    }

    // Count
    const countSql = sql.replace(
      'SELECT \n        nl.*,\n        et.name as template_name',
      'SELECT COUNT(*)'
    );
    const countResult = await query(c.env, countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Data
    sql += ' ORDER BY nl.created_at DESC';
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    values.push(limit);
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    values.push(offset);

    const result = await query(c.env, sql, values);
    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching notification logs:', error);
    return c.json({ success: false, message: 'Failed to fetch notification logs' }, 500);
  }
});

export default app;
