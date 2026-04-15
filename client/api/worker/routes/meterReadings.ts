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
    const filterParams: any[] = [tenantId];
    let paramCount = 2;

    if (meterId !== undefined && meterId !== '') {
      whereClause += ` AND meter_id = $${paramCount}`;
      filterParams.push(parseInt(meterId));
      paramCount++;
    }

    if (meterElementId !== undefined && meterElementId !== '') {
      whereClause += ` AND meter_element_id = $${paramCount}`;
      filterParams.push(parseInt(meterElementId));
      paramCount++;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM meter_reading ${whereClause}`;
    const countResult = await query(c.env, countSql, filterParams);
    const total = parseInt(countResult.rows?.[0]?.count || '0');

    // Get paginated data
    const dataSql = `SELECT * FROM meter_reading ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const dataParams = [...filterParams, pageSize, skip];

    const result = await query(c.env, dataSql, dataParams);
    const items = result.rows || [];

    const totalPages = Math.ceil(total / pageSize) || 1;

    return c.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages,
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

// GET /demand - Get aggregated demand (kW) data for graph display
app.get('/demand', requirePermission('meter:read'), async (c) => {
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
    const tzOffset = qs.tzOffset ? parseInt(qs.tzOffset) : 0;

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
          SUM(kw) AS power
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
          SUM(kw) AS power
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
      sql = `
        SELECT
          EXTRACT(MONTH FROM (created_at + ($4::int * INTERVAL '1 minute')))::int AS label_key,
          SUM(kw) AS power
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
    logError('[MeterReadings] Error fetching demand data:', error);
    return c.json({ success: false, message: 'Failed to fetch demand data', error: error.message }, 500);
  }
});

// GET /virtual-consumption - Aggregated consumption summed across all meter_virtual components
app.get('/virtual-consumption', requirePermission('meter:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Unauthorized: tenant context required' }, 401);
    }

    const qs = c.req.query();
    const meterId = qs.meterId ? parseInt(qs.meterId) : null;
    const timePeriod = qs.timePeriod || 'today';
    const startDate = qs.startDate;
    const endDate = qs.endDate;
    const tzOffset = qs.tzOffset ? parseInt(qs.tzOffset) : 0;
    const excludeIds: number[] = qs.excludeIds
      ? qs.excludeIds.split(',').map(Number).filter((n) => !isNaN(n))
      : [];

    if (!meterId || !startDate || !endDate) {
      return c.json({ success: false, message: 'meterId, startDate and endDate are required' }, 400);
    }

    // $1 = tenantId, $2 = meterId (virtual), $3 = tzOffset, $4 = startDate, $5 = endDate
    const params: any[] = [tenantId, meterId, tzOffset, startDate, endDate];
    let excludeClause = '';
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map((_, i) => `$${params.length + 1 + i}`).join(', ');
      excludeClause = `AND mv.select_meter_element_id NOT IN (${placeholders})`;
      params.push(...excludeIds);
    }
    let sql: string;

    if (timePeriod === 'today') {
      sql = `
        SELECT
          EXTRACT(HOUR FROM (mr.created_at + ($3::int * INTERVAL '1 minute')))::int AS label_key,
          SUM(mr.calculated_kwh) AS calculated_kwh
        FROM meter_reading mr
        JOIN public.meter_virtual mv
          ON mv.selected_meter_id = mr.meter_id
          AND mv.select_meter_element_id = mr.meter_element_id
        WHERE mr.tenant_id = $1
          AND mv.meter_id = $2
          ${excludeClause}
          AND mr.created_at >= $4::timestamptz
          AND mr.created_at <= $5::timestamptz
        GROUP BY 1
        ORDER BY 1
      `;
    } else if (timePeriod === 'weekly' || timePeriod === 'monthly') {
      sql = `
        SELECT
          (mr.created_at + ($3::int * INTERVAL '1 minute'))::date::text AS label_key,
          SUM(mr.calculated_kwh) AS calculated_kwh
        FROM meter_reading mr
        JOIN public.meter_virtual mv
          ON mv.selected_meter_id = mr.meter_id
          AND mv.select_meter_element_id = mr.meter_element_id
        WHERE mr.tenant_id = $1
          AND mv.meter_id = $2
          ${excludeClause}
          AND (mr.created_at + ($3::int * INTERVAL '1 minute')) >= $4::timestamptz
          AND (mr.created_at + ($3::int * INTERVAL '1 minute')) <= $5::timestamptz
        GROUP BY 1
        ORDER BY 1
      `;
    } else {
      sql = `
        SELECT
          EXTRACT(MONTH FROM (mr.created_at + ($3::int * INTERVAL '1 minute')))::int AS label_key,
          SUM(mr.calculated_kwh) AS calculated_kwh
        FROM meter_reading mr
        JOIN public.meter_virtual mv
          ON mv.selected_meter_id = mr.meter_id
          AND mv.select_meter_element_id = mr.meter_element_id
        WHERE mr.tenant_id = $1
          AND mv.meter_id = $2
          ${excludeClause}
          AND (mr.created_at + ($3::int * INTERVAL '1 minute')) >= $4::timestamptz
          AND (mr.created_at + ($3::int * INTERVAL '1 minute')) <= $5::timestamptz
        GROUP BY 1
        ORDER BY 1
      `;
    }

    const result = await query(c.env, sql, params);
    return c.json({ success: true, data: result.rows || [] });
  } catch (error: any) {
    logError('[MeterReadings] Error fetching virtual consumption data:', error);
    return c.json({ success: false, message: 'Failed to fetch virtual consumption data', error: error.message }, 500);
  }
});

// GET /virtual-demand - Aggregated demand (kW) summed across all meter_virtual components
app.get('/virtual-demand', requirePermission('meter:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Unauthorized: tenant context required' }, 401);
    }

    const qs = c.req.query();
    const meterId = qs.meterId ? parseInt(qs.meterId) : null;
    const timePeriod = qs.timePeriod || 'today';
    const startDate = qs.startDate;
    const endDate = qs.endDate;
    const tzOffset = qs.tzOffset ? parseInt(qs.tzOffset) : 0;
    const excludeIds: number[] = qs.excludeIds
      ? qs.excludeIds.split(',').map(Number).filter((n) => !isNaN(n))
      : [];

    if (!meterId || !startDate || !endDate) {
      return c.json({ success: false, message: 'meterId, startDate and endDate are required' }, 400);
    }

    // $1 = tenantId, $2 = meterId (virtual), $3 = tzOffset, $4 = startDate, $5 = endDate
    const params: any[] = [tenantId, meterId, tzOffset, startDate, endDate];
    let excludeClause = '';
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map((_, i) => `$${params.length + 1 + i}`).join(', ');
      excludeClause = `AND mv.select_meter_element_id NOT IN (${placeholders})`;
      params.push(...excludeIds);
    }
    let sql: string;

    if (timePeriod === 'today') {
      sql = `
        SELECT
          EXTRACT(HOUR FROM (mr.created_at + ($3::int * INTERVAL '1 minute')))::int AS label_key,
          SUM(mr.kw) AS power
        FROM meter_reading mr
        JOIN public.meter_virtual mv
          ON mv.selected_meter_id = mr.meter_id
          AND mv.select_meter_element_id = mr.meter_element_id
        WHERE mr.tenant_id = $1
          AND mv.meter_id = $2
          ${excludeClause}
          AND mr.created_at >= $4::timestamptz
          AND mr.created_at <= $5::timestamptz
        GROUP BY 1
        ORDER BY 1
      `;
    } else if (timePeriod === 'weekly' || timePeriod === 'monthly') {
      sql = `
        SELECT
          (mr.created_at + ($3::int * INTERVAL '1 minute'))::date::text AS label_key,
          SUM(mr.kw) AS power
        FROM meter_reading mr
        JOIN public.meter_virtual mv
          ON mv.selected_meter_id = mr.meter_id
          AND mv.select_meter_element_id = mr.meter_element_id
        WHERE mr.tenant_id = $1
          AND mv.meter_id = $2
          ${excludeClause}
          AND (mr.created_at + ($3::int * INTERVAL '1 minute')) >= $4::timestamptz
          AND (mr.created_at + ($3::int * INTERVAL '1 minute')) <= $5::timestamptz
        GROUP BY 1
        ORDER BY 1
      `;
    } else {
      sql = `
        SELECT
          EXTRACT(MONTH FROM (mr.created_at + ($3::int * INTERVAL '1 minute')))::int AS label_key,
          SUM(mr.kw) AS power
        FROM meter_reading mr
        JOIN public.meter_virtual mv
          ON mv.selected_meter_id = mr.meter_id
          AND mv.select_meter_element_id = mr.meter_element_id
        WHERE mr.tenant_id = $1
          AND mv.meter_id = $2
          ${excludeClause}
          AND (mr.created_at + ($3::int * INTERVAL '1 minute')) >= $4::timestamptz
          AND (mr.created_at + ($3::int * INTERVAL '1 minute')) <= $5::timestamptz
        GROUP BY 1
        ORDER BY 1
      `;
    }

    const result = await query(c.env, sql, params);
    return c.json({ success: true, data: result.rows || [] });
  } catch (error: any) {
    logError('[MeterReadings] Error fetching virtual demand data:', error);
    return c.json({ success: false, message: 'Failed to fetch virtual demand data', error: error.message }, 500);
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

    const sql = `SELECT mr.*, m.serial_number FROM meter_reading mr LEFT JOIN meter m ON mr.meter_id = m.meter_id WHERE mr.tenant_id = $1 AND mr.meter_id = $2 AND mr.meter_element_id = $3 ORDER BY mr.created_at DESC LIMIT 1`;

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

// GET /virtual-last - Get summed latest readings for a virtual meter
app.get('/virtual-last', requirePermission('meter:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Unauthorized: tenant context required' }, 401);
    }

    const qs = c.req.query();
    const meterId = qs.meterId;

    if (!meterId) {
      return c.json({ success: false, message: 'meterId is required' }, 400);
    }

    // Get meter info and sum of latest readings from all virtual meter components
    const sql = `
      SELECT
        m.meter_id,
        m.name AS meter_name,
        m.installation_date,
        COALESCE(SUM(latest.kwh), 0) AS total_kwh,
        MAX(latest.created_at) AS last_reading_date
      FROM public.meter m
      LEFT JOIN public.meter_virtual mv ON mv.meter_id = m.meter_id
      LEFT JOIN LATERAL (
        SELECT mr.kwh, mr.created_at
        FROM public.meter_reading mr
        WHERE mr.meter_element_id = mv.select_meter_element_id
          AND mr.tenant_id = $1
        ORDER BY mr.created_at DESC
        LIMIT 1
      ) latest ON true
      WHERE m.meter_id = $2
        AND m.tenant_id = $1
      GROUP BY m.meter_id, m.name, m.installation_date
    `;

    const result = await query(c.env, sql, [tenantId, parseInt(meterId)]);

    if (!result.rows || result.rows.length === 0) {
      return c.json({ success: false, message: 'Virtual meter not found' }, 404);
    }

    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    logError('[MeterReadings] Error fetching virtual meter last reading:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch virtual meter reading',
      error: error.message,
    }, 500);
  }
});

// GET /virtual-components-last - Per-component latest kWh for a virtual meter
app.get('/virtual-components-last', requirePermission('meter:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Unauthorized: tenant context required' }, 401);
    }

    const qs = c.req.query();
    const meterId = qs.meterId;

    if (!meterId) {
      return c.json({ success: false, message: 'meterId is required' }, 400);
    }

    const sql = `
      SELECT
        mv.select_meter_element_id,
        COALESCE(latest.kwh, 0) AS kwh
      FROM public.meter_virtual mv
      LEFT JOIN LATERAL (
        SELECT mr.kwh
        FROM public.meter_reading mr
        WHERE mr.meter_element_id = mv.select_meter_element_id
          AND mr.tenant_id = $1
        ORDER BY mr.created_at DESC
        LIMIT 1
      ) latest ON true
      WHERE mv.meter_id = $2
    `;

    const params = [tenantId, parseInt(meterId)];
    const result = await query(c.env, sql, params);
    return c.json({ success: true, data: result.rows || [] });
  } catch (error: any) {
    logError('[MeterReadings] Error fetching virtual component readings:', error);
    return c.json({ success: false, message: 'Failed to fetch virtual component readings', error: error.message }, 500);
  }
});

export default app;
