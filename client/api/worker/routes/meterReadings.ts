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

    // Build WHERE clause
    let whereClause = 'WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (meterId !== undefined && meterId !== '') {
      whereClause += ` AND meter_id = $${paramCount}`;
      params.push(parseInt(meterId));
      paramCount++;
    }

    if (meterElementId !== undefined && meterElementId !== '') {
      whereClause += ` AND meter_element_id = $${paramCount}`;
      params.push(parseInt(meterElementId));
      paramCount++;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM meter_reading ${whereClause}`;
    console.log('[MeterReadings] Count SQL:', countSql);
    console.log('[MeterReadings] Count Params:', params);

    const countResult = await query(c.env, countSql, params.slice(0, paramCount - 1));
    const total = parseInt(countResult.rows?.[0]?.count || '0');

    // Get paginated data
    const dataSql = `SELECT * FROM meter_reading ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const dataParams = [...params, pageSize, skip];

    console.log('[MeterReadings] Data SQL:', dataSql);
    console.log('[MeterReadings] Data Params:', dataParams);

    const result = await query(c.env, dataSql, dataParams);
    const items = result.rows || [];

    const totalPages = Math.ceil(total / pageSize) || 1;
    const hasMore = page < totalPages;

    return c.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasMore,
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

// GET /consumption - Get aggregated consumption data for graph display
app.get('/consumption', requirePermission('meter:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Unauthorized: tenant context required' }, 401);
    }

    const qs = c.req.query();
    const meterId = qs.meterId ? parseInt(qs.meterId) : null;
    const meterElementId = qs.meterElementId ? parseInt(qs.meterElementId) : null;
    const timePeriod = qs.timePeriod || 'today';
    const startDate = qs.startDate;
    const endDate = qs.endDate;
    const tzOffset = qs.tzOffset ? parseInt(qs.tzOffset) : 0; // minutes offset from UTC, e.g. +300 for UTC+5

    if (!meterId || !meterElementId || !startDate || !endDate) {
      return c.json({ success: false, message: 'meterId, meterElementId, startDate and endDate are required' }, 400);
    }

    // $4 = tzOffset (int), $5 = startDate, $6 = endDate
    const params: any[] = [tenantId, meterId, meterElementId, tzOffset, startDate, endDate];
    let sql: string;

    if (timePeriod === 'today') {
      sql = `
        SELECT
          EXTRACT(HOUR FROM (created_at + ($4::int * INTERVAL '1 minute')))::int AS label_key,
          SUM(calculated_kwh) AS calculated_kwh
        FROM meter_reading
        WHERE tenant_id = $1
          AND meter_id = $2
          AND meter_element_id = $3
          AND created_at >= $5::timestamptz
          AND created_at <= $6::timestamptz
        GROUP BY 1
        ORDER BY 1
      `;
    } else if (timePeriod === 'weekly' || timePeriod === 'monthly') {
      sql = `
        SELECT
          (created_at + ($4::int * INTERVAL '1 minute'))::date::text AS label_key,
          SUM(calculated_kwh) AS calculated_kwh
        FROM meter_reading
        WHERE tenant_id = $1
          AND meter_id = $2
          AND meter_element_id = $3
          AND (created_at + ($4::int * INTERVAL '1 minute')) >= $5::timestamptz
          AND (created_at + ($4::int * INTERVAL '1 minute')) <= $6::timestamptz
        GROUP BY 1
        ORDER BY 1
      `;
    } else {
      // yearly - group by local month
      sql = `
        SELECT
          EXTRACT(MONTH FROM (created_at + ($4::int * INTERVAL '1 minute')))::int AS label_key,
          SUM(calculated_kwh) AS calculated_kwh
        FROM meter_reading
        WHERE tenant_id = $1
          AND meter_id = $2
          AND meter_element_id = $3
          AND (created_at + ($4::int * INTERVAL '1 minute')) >= $5::timestamptz
          AND (created_at + ($4::int * INTERVAL '1 minute')) <= $6::timestamptz
        GROUP BY 1
        ORDER BY 1
      `;
    }

    const result = await query(c.env, sql, params);
    return c.json({ success: true, data: result.rows || [] });
  } catch (error: any) {
    logError('[MeterReadings] Error fetching consumption data:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch consumption data',
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
