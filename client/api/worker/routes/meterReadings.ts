/**
 * Meter Readings routes - Hono worker
 */

import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

// GET / - Get all meter readings with filtering
app.get('/', requirePermission('meter:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Unauthorized: tenant context required' }, 401);
    }

    const qs = c.req.query();
    const page = parseInt(qs.page || '1') || 1;
    const pageSize = parseInt(qs.pageSize || '20') || 20;
    const skip = (page - 1) * pageSize;
    const meterId = qs.meterId;
    const meterElementId = qs.meterElementId;

    let sql = 'SELECT * FROM meter_reading WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (meterId !== undefined && meterId !== '') {
      sql += ` AND meter_id = $${paramCount}`;
      params.push(parseInt(meterId));
      paramCount++;
    }

    if (meterElementId !== undefined && meterElementId !== '') {
      sql += ` AND meter_element_id = $${paramCount}`;
      params.push(parseInt(meterElementId));
      paramCount++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(pageSize);
    params.push(skip);

    const result = await query(c.env, sql, params);
    const items = result.rows || [];

    return c.json({
      success: true,
      data: {
        items,
        total: items.length,
        page,
        pageSize,
        totalPages: Math.ceil(items.length / pageSize) || 1,
        hasMore: false,
      },
    });
  } catch (error: any) {
    logError('[MeterReadings] Error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch meter readings',
      error: error.message,
    }, 500);
  }
});

// GET /last - Get the last meter reading with meter details
app.get('/last', requirePermission('meter:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Unauthorized: tenant context required' }, 401);
    }

    const qs = c.req.query();
    const meterId = qs.meterId;
    const meterElementId = qs.meterElementId;

    if (!meterId || !meterElementId) {
      return c.json({ success: false, message: 'meterId and meterElementId are required' }, 400);
    }

    const sql = `
      SELECT
        mr.*,
        m.name as meter_name,
        m.serial_number,
        m.ip as meter_ip,
        m.port as meter_port,
        m.protocol as meter_protocol,
        m.notes as meter_notes,
        me.name as element_name,
        me.element
      FROM meter_reading mr
      LEFT JOIN meter m ON mr.meter_id = m.meter_id
      LEFT JOIN meter_element me ON mr.meter_element_id = me.meter_element_id
      WHERE mr.tenant_id = $1
        AND mr.meter_id = $2
        AND mr.meter_element_id = $3
      ORDER BY mr.created_at DESC
      LIMIT 1
    `;

    const params = [tenantId, parseInt(meterId), parseInt(meterElementId)];
    const result = await query(c.env, sql, params);
    const reading = result.rows && result.rows.length > 0 ? result.rows[0] : null;

    if (!reading) {
      return c.json({ success: false, message: 'No readings found for this meter element' }, 404);
    }

    return c.json({ success: true, data: reading });
  } catch (error: any) {
    logError('[MeterReadings] Error fetching last reading:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch last meter reading',
      error: error.message,
    }, 500);
  }
});

export default app;
