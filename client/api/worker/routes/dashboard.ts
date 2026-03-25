/**
 * Dashboard routes - Hono worker
 * Card CRUD, readings queries, power column discovery.
 */

import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { findAll, findById, create, update, remove } from '../crud';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

const VALID_METER_READING_COLUMNS = new Set([
  'active_energy','active_energy_export','apparent_energy','apparent_energy_export',
  'apparent_power','apparent_power_phase_a','apparent_power_phase_b','apparent_power_phase_c',
  'current','current_line_a','current_line_b','current_line_c','frequency',
  'maximum_demand_real','power','power_factor','power_factor_phase_a','power_factor_phase_b',
  'power_factor_phase_c','power_phase_a','power_phase_b','power_phase_c',
  'reactive_energy','reactive_energy_export','reactive_power','reactive_power_phase_a',
  'reactive_power_phase_b','reactive_power_phase_c','voltage_a_b','voltage_a_n',
  'voltage_b_c','voltage_b_n','voltage_c_a','voltage_c_n','voltage_p_n','voltage_p_p',
  'voltage_thd','voltage_thd_phase_a','voltage_thd_phase_b','voltage_thd_phase_c',
]);

app.use('*', authenticateToken);


// GET /cards - Retrieve all dashboard cards for the tenant
app.get('/cards', requirePermission('dashboard:read'), async (c) => {
  try {
    const qs = c.req.query();
    const page = parseInt(qs.page || '1') || 1;
    const limit = parseInt(qs.limit || '25') || 25;
    const tenantId = c.get('tenantId');

    if (!tenantId) {
      return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);
    }

    const where: Record<string, any> = {};
    if (qs.search) {
      where.card_name = qs.search;
    }

    const result = await findAll(c.env, {
      table: 'dashboard',
      primaryKey: 'dashboard_id',
      tenantId,
      page,
      limit,
      where,
      search: qs.search || undefined,
      searchFields: ['card_name'],
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder,
    });

    console.log('[Dashboard] GET /cards - Raw database rows:', result.rows.map((c: any) => ({ id: c.dashboard_id, grid_x: c.grid_x, grid_y: c.grid_y })));

    const items = result.rows.map((card: any, index: number) => {
      const cardIndex = (page - 1) * limit + index;
      return {
        ...card,
        dashboard_id: card.dashboard_id || card.id,
        grid_x: card.grid_x ?? 0,
        grid_y: card.grid_y ?? cardIndex * 520,
        grid_w: card.grid_w ?? 500,
        grid_h: card.grid_h ?? 500,
      };
    });

    return c.json({
      success: true,
      data: {
        items,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (error: any) {
    logError('Error fetching cards', error);
    return c.json({ success: false, message: 'Failed to fetch dashboard cards' }, 500);
  }
});

// GET /cards/:id - Retrieve a single dashboard card
app.get('/cards/:id', requirePermission('dashboard:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const card = await findById(c.env, 'dashboard', 'dashboard_id', c.req.param('id'), tenantId);
    if (!card) return c.json({ success: false, message: 'Dashboard card not found' }, 404);

    return c.json({
      success: true,
      data: {
        ...card,
        dashboard_id: card.dashboard_id,
        grid_x: card.grid_x ?? 0,
        grid_y: card.grid_y ?? 0,
        grid_w: card.grid_w ?? 500,
        grid_h: card.grid_h ?? 500,
      },
    });
  } catch (error: any) {
    logError('Error fetching card', error);
    return c.json({ success: false, message: 'Failed to fetch dashboard card' }, 500);
  }
});

// GET /cards/:id/data - Retrieve aggregated data for a dashboard card
app.get('/cards/:id/data', requirePermission('dashboard:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const card = await findById(c.env, 'dashboard', 'dashboard_id', c.req.param('id'), tenantId);
    if (!card) return c.json({ success: false, message: 'Dashboard card not found' }, 404);

    // Parse selected_columns — DB may return as array (jsonb) or string (text)
    let rawColumns = card.selected_columns;
    if (typeof rawColumns === 'string') {
      try { rawColumns = JSON.parse(rawColumns); } catch { rawColumns = []; }
    }
    const selectedColumns: string[] = (Array.isArray(rawColumns) ? rawColumns : [])
      .map((col: string) => columnNameMapping[col.toLowerCase()] || col.toLowerCase())
      .filter((col: string) => VALID_METER_READING_COLUMNS.has(col))
      .filter((col, idx, arr) => arr.indexOf(col) === idx);

    if (selectedColumns.length === 0) {
      return c.json({ success: true, data: { card_id: card.dashboard_id, aggregated_values: {}, grouped_data: [] } });
    }

    // Calculate time frame based on time_frame_type
    const now = new Date();
    let startDate: Date;
    const timeFrameType = card.time_frame_type || 'last_month';
    if (timeFrameType === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeFrameType === 'this_month_to_date') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeFrameType === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (timeFrameType === 'since_installation') {
      startDate = new Date('2000-01-01');
    } else if (timeFrameType === 'custom' && card.custom_start_date) {
      startDate = new Date(card.custom_start_date);
    } else {
      // last_month default
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    }
    const endDate = (timeFrameType === 'custom' && card.custom_end_date) ? new Date(card.custom_end_date) : now;

    // Aggregation type — used for both aggregated_values and grouped_data
    const rawAggType = (card.aggregation_type || 'avg').toLowerCase();
    const aggFn = rawAggType === 'min' ? 'MIN' : rawAggType === 'max' ? 'MAX' : 'AVG';

    // Aggregate values - return values with selected column names that match visualization expectations
    const aggColsForAgg = selectedColumns.map((col: string) => `${aggFn}("${col}") as "${col}", AVG("${col}") as "avg_${col}", MIN("${col}") as "min_${col}", MAX("${col}") as "max_${col}"`).join(', ');
    const aggSql = `SELECT ${aggColsForAgg} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4`;
    console.log('[Dashboard] aggSql:', aggSql);
    console.log('[Dashboard] aggSql params:', [tenantId, card.meter_element_id, startDate, endDate]);
    const aggResult = await query(c.env, aggSql, [tenantId, card.meter_element_id, startDate, endDate]);

    // Grouped data — respect grouping_type and aggregation_type
    const groupCols = selectedColumns.map((col: string) => `${aggFn}("${col}") as "${col}"`).join(', ');
    const groupingType = card.grouping_type || 'daily';
    let groupSql: string;
    if (groupingType === 'total') {
      groupSql = `SELECT ${groupCols} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4`;
    } else if (groupingType === 'hourly') {
      groupSql = `SELECT DATE(created_at) as date, EXTRACT(HOUR FROM created_at) as hour, ${groupCols} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at) ORDER BY date, hour`;
    } else if (groupingType === 'weekly') {
      groupSql = `SELECT DATE_TRUNC('week', created_at) as week_start, ${groupCols} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 GROUP BY DATE_TRUNC('week', created_at) ORDER BY week_start`;
    } else if (groupingType === 'monthly') {
      groupSql = `SELECT DATE_TRUNC('month', created_at) as month_start, ${groupCols} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 GROUP BY DATE_TRUNC('month', created_at) ORDER BY month_start`;
    } else {
      // daily (default)
      groupSql = `SELECT DATE(created_at) as date, ${groupCols} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 GROUP BY DATE(created_at) ORDER BY date`;
    }
    console.log('[Dashboard] groupSql:', groupSql);
    console.log('[Dashboard] groupSql params:', [tenantId, card.meter_element_id, startDate, endDate]);
    const groupResult = await query(c.env, groupSql, [tenantId, card.meter_element_id, startDate, endDate]);

    return c.json({
      success: true,
      data: {
        card_id: card.dashboard_id,
        card_name: card.card_name,
        meter_element_id: card.meter_element_id,
        time_frame: {
          type: card.time_frame_type || 'last_30_days',
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        selected_columns: selectedColumns,
        aggregated_values: aggResult.rows[0] || {},
        grouped_data: groupResult.rows,
        grouping_type: card.grouping_type || 'daily',
        visualization_type: card.visualization_type,
      },
    });
  } catch (error: any) {
    logError('Error fetching aggregated data', error);
    return c.json({ success: false, message: 'Failed to fetch aggregated card data' }, 500);
  }
});

// POST /cards - Create a new dashboard card
app.post('/cards', requirePermission('dashboard:create'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const user = c.get('user');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const body = await c.req.json();

    // Validate meter belongs to tenant
    if (body.meter_id) {
      const meter = await findById(c.env, 'meter', 'meter_id', body.meter_id, tenantId);
      if (!meter) return c.json({ success: false, message: 'Meter not found', errors: [{ field: 'meter_id', message: 'Meter does not exist' }] }, 400);
    }

    // Validate meter element
    if (body.meter_element_id) {
      const me = await findById(c.env, 'meter_element', 'meter_element_id', body.meter_element_id);
      if (!me) return c.json({ success: false, message: 'Meter element not found', errors: [{ field: 'meter_element_id', message: 'Meter element does not exist' }] }, 400);
      if (Number(me.meter_id) !== Number(body.meter_id)) {
        return c.json({ success: false, message: 'Validation failed', errors: [{ field: 'meter_element_id', message: 'Meter element does not belong to the selected meter' }] }, 400);
      }
    }

    // Validate selected columns
    if (!body.selected_columns || (Array.isArray(body.selected_columns) && body.selected_columns.length === 0)) {
      return c.json({ success: false, message: 'Validation failed', errors: [{ field: 'selected_columns', message: 'At least one power column must be selected' }] }, 400);
    }

    // Determine grid position
    const existingCards = await findAll(c.env, {
      table: 'dashboard',
      primaryKey: 'dashboard_id',
      tenantId,
      limit: 1000,
    });

    const nextIndex = existingCards.rows.length;

    const cardData = {
      ...body,
      selected_columns: Array.isArray(body.selected_columns) ? JSON.stringify(body.selected_columns) : body.selected_columns,
      tenant_id: tenantId,
      created_by_users_id: user?.users_id,
      grid_x: body.grid_x !== undefined ? body.grid_x : 0,
      grid_y: body.grid_y !== undefined ? body.grid_y : nextIndex * 520,
      grid_w: body.grid_w !== undefined ? body.grid_w : 500,
      grid_h: body.grid_h !== undefined ? body.grid_h : 500,
    };

    const card = await create(c.env, 'dashboard', cardData);

    return c.json({
      success: true,
      data: {
        ...card,
        dashboard_id: card.dashboard_id,
      },
    }, 201);
  } catch (error: any) {
    logError('Error creating card', error);
    return c.json({ success: false, message: 'Failed to create dashboard card' }, 500);
  }
});

// PUT /cards/:id - Update a dashboard card
app.put('/cards/:id', requirePermission('dashboard:update'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const card = await findById(c.env, 'dashboard', 'dashboard_id', c.req.param('id'), tenantId);
    if (!card) return c.json({ success: false, message: 'Dashboard card not found' }, 404);

    const body = await c.req.json();

    console.log('[Dashboard] PUT /cards/:id - Request body:', body);

    // Validate selected columns if provided
    if (body.selected_columns !== undefined) {
      if (!Array.isArray(body.selected_columns) || body.selected_columns.length === 0) {
        return c.json({ success: false, message: 'Validation failed', errors: [{ field: 'selected_columns', message: 'At least one power column must be selected' }] }, 400);
      }
    }

    // Remove protected fields
    delete body.tenant_id;
    delete body.created_by_users_id;

    if (Array.isArray(body.selected_columns)) {
      body.selected_columns = JSON.stringify(body.selected_columns);
    }

    console.log('[Dashboard] PUT /cards/:id - Body after processing:', body);
    const updated = await update(c.env, 'dashboard', 'dashboard_id', c.req.param('id'), body);
    console.log('[Dashboard] PUT /cards/:id - Updated result:', updated);

    return c.json({
      success: true,
      data: {
        ...updated,
        dashboard_id: updated.dashboard_id,
        grid_x: updated.grid_x ?? 0,
        grid_y: updated.grid_y ?? 0,
        grid_w: updated.grid_w ?? 500,
        grid_h: updated.grid_h ?? 500,
      },
    });
  } catch (error: any) {
    logError('Error updating card', error);
    return c.json({ success: false, message: 'Failed to update dashboard card', error: error.message }, 500);
  }
});

// DELETE /cards/:id - Delete a dashboard card
app.delete('/cards/:id', requirePermission('dashboard:delete'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const card = await findById(c.env, 'dashboard', 'dashboard_id', c.req.param('id'), tenantId);
    if (!card) return c.json({ success: false, message: 'Dashboard card not found' }, 404);

    await remove(c.env, 'dashboard', 'dashboard_id', c.req.param('id'));
    return c.json({ success: true, message: 'Dashboard card deleted successfully' });
  } catch (error: any) {
    logError('Error deleting card', error);
    return c.json({ success: false, message: 'Failed to delete dashboard card' }, 500);
  }
});

// GET /cards/:id/readings - Retrieve detailed meter readings for a card
app.get('/cards/:id/readings', requirePermission('dashboard:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const qs = c.req.query();
    const page = Math.max(1, parseInt(qs.page || '1') || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(qs.pageSize || '50') || 50));
    const sortBy = qs.sortBy || 'created_at';
    const sortOrder = (qs.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const card = await findById(c.env, 'dashboard', 'dashboard_id', c.req.param('id'), tenantId);
    if (!card) return c.json({ success: false, message: 'Dashboard card not found' }, 404);

    // Time frame
    const now = new Date();
    let startDate: Date;
    const timeFrameType = card.time_frame_type || 'last_month';
    if (timeFrameType === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeFrameType === 'this_month_to_date') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeFrameType === 'since_installation') {
      startDate = new Date('2000-01-01');
    } else if (timeFrameType === 'custom' && card.custom_start_date) {
      startDate = new Date(card.custom_start_date);
    } else {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    }
    const endDate = (timeFrameType === 'custom' && card.custom_end_date) ? new Date(card.custom_end_date) : now;

    let rawCols = card.selected_columns;
    if (typeof rawCols === 'string') { try { rawCols = JSON.parse(rawCols); } catch { rawCols = []; } }
    const selectedColumns: string[] = (Array.isArray(rawCols) ? rawCols : [])
      .map((col: string) => columnNameMapping[col.toLowerCase()] || col.toLowerCase())
      .filter((col: string) => VALID_METER_READING_COLUMNS.has(col))
      .filter((col, idx, arr) => arr.indexOf(col) === idx);
    const columnsList = ['meter_reading_id', 'created_at', ...selectedColumns];
    const validSortColumns = ['meter_reading_id', 'created_at', 'updated_at', 'meter_id', 'meter_element_id', ...selectedColumns];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

    // Count
    const countResult = await query(c.env,
      'SELECT COUNT(*) as total FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4',
      [tenantId, card.meter_element_id, startDate, endDate]
    );
    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / pageSize);

    // Data
    const sql = `SELECT ${columnsList.map((col) => `"${col}"`).join(', ')} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 ORDER BY "${safeSortBy}" ${sortOrder} LIMIT $5 OFFSET $6`;
    console.log('[Dashboard] readings sql:', sql);
    console.log('[Dashboard] readings params:', [tenantId, card.meter_element_id, startDate, endDate, pageSize, (page - 1) * pageSize]);
    const result = await query(c.env, sql, [tenantId, card.meter_element_id, startDate, endDate, pageSize, (page - 1) * pageSize]);

    return c.json({
      success: true,
      data: {
        items: result.rows,
        pagination: { page, pageSize, total, totalPages, hasMore: page < totalPages },
        metadata: {
          card_id: card.dashboard_id,
          card_name: card.card_name,
          meter_element_id: card.meter_element_id,
          time_frame: { type: card.time_frame_type || 'last_30_days', start: startDate.toISOString(), end: endDate.toISOString() },
          selected_columns: selectedColumns,
          sort_by: safeSortBy,
          sort_order: sortOrder,
        },
      },
    });
  } catch (error: any) {
    logError('Error fetching meter readings', error);
    return c.json({ success: false, message: 'Failed to fetch meter readings' }, 500);
  }
});

// GET /cards/:id/readings/export - Export readings as CSV
app.get('/cards/:id/readings/export', requirePermission('dashboard:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const qs = c.req.query();
    const sortBy = qs.sortBy || 'created_at';
    const sortOrder = (qs.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const card = await findById(c.env, 'dashboard', 'dashboard_id', c.req.param('id'), tenantId);
    if (!card) return c.json({ success: false, message: 'Dashboard card not found' }, 404);

    const now = new Date();
    let startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    if (card.custom_start_date) startDate = new Date(card.custom_start_date);
    const endDate = card.custom_end_date ? new Date(card.custom_end_date) : now;

    let rawColsExp = card.selected_columns;
    if (typeof rawColsExp === 'string') { try { rawColsExp = JSON.parse(rawColsExp); } catch { rawColsExp = []; } }
    const selectedColumns: string[] = (Array.isArray(rawColsExp) ? rawColsExp : [])
      .map((col: string) => columnNameMapping[col.toLowerCase()] || col.toLowerCase())
      .filter((col: string) => VALID_METER_READING_COLUMNS.has(col))
      .filter((col, idx, arr) => arr.indexOf(col) === idx);
    const columnsList = ['meter_reading_id', 'created_at', ...selectedColumns];
    const validSortColumns = ['meter_reading_id', 'created_at', ...selectedColumns];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

    const sql = `SELECT ${columnsList.map((col) => `"${col}"`).join(', ')} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 ORDER BY "${safeSortBy}" ${sortOrder}`;
    console.log('[Dashboard] export sql:', sql);
    console.log('[Dashboard] export params:', [tenantId, card.meter_element_id, startDate, endDate]);
    const result = await query(c.env, sql, [tenantId, card.meter_element_id, startDate, endDate]);

    // Build CSV
    const escapeCSV = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = columnsList.map((col) => col.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    const metadata = [
      ['Meter Reading Export'],
      ['Card Name', card.card_name],
      ['Meter Element ID', card.meter_element_id],
      ['Time Frame', `${startDate.toISOString()} to ${endDate.toISOString()}`],
      ['Export Date', new Date().toISOString()],
      ['Total Records', result.rows.length],
      [],
    ];

    const csvRows = [
      ...metadata.map((row: any[]) => row.map(escapeCSV).join(',')),
      headers.join(','),
      ...result.rows.map((row: any) => columnsList.map((col) => escapeCSV(row[col])).join(',')),
    ];

    const csv = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${(card.card_name || 'export').replace(/\s+/g, '_')}_${timestamp}.csv`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    logError('Error exporting meter readings', error);
    return c.json({ success: false, message: 'Failed to export meter readings' }, 500);
  }
});

// GET /meters - Retrieve all meters for the tenant
app.get('/meters', authenticateToken, async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const result = await query(
      c.env,
      'SELECT meter_id as id, name FROM meter WHERE tenant_id = $1 ORDER BY name ASC',
      [tenantId]
    );

    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    logError('Error fetching meters', error);
    return c.json({ success: false, message: 'Failed to fetch meters' }, 500);
  }
});

// GET /meters/:meterId/elements - Retrieve meter elements
app.get('/meters/:meterId/elements', authenticateToken, async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const meterId = parseInt(c.req.param('meterId'));
    if (isNaN(meterId)) return c.json({ success: false, message: 'Invalid meter ID' }, 400);

    console.log('[DASHBOARD] GET /meters/:meterId/elements - meterId:', meterId, 'tenantId from context:', tenantId, 'type:', typeof tenantId);

    // Verify meter belongs to tenant
    const meterResult = await query(c.env, 'SELECT meter_id, tenant_id FROM meter WHERE meter_id = $1', [meterId]);
    if (meterResult.rows.length === 0) return c.json({ success: false, message: 'Meter not found' }, 404);

    console.log('[DASHBOARD] Meter found - meterResult.tenant_id:', meterResult.rows[0].tenant_id, 'type:', typeof meterResult.rows[0].tenant_id, 'user tenantId:', tenantId, 'type:', typeof tenantId);

    if (Number(meterResult.rows[0].tenant_id) !== Number(tenantId)) return c.json({ success: false, message: 'You do not have permission to access this meter' }, 403);

    const result = await query(
      c.env,
      'SELECT meter_element_id, meter_id, element, name FROM meter_element WHERE meter_id = $1 AND tenant_id = $2 ORDER BY element ASC',
      [meterId, tenantId]
    );

    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    logError('Error fetching meter elements', error);
    return c.json({ success: false, message: 'Failed to fetch meter elements' }, 500);
  }
});

// Mapping of register names to actual meter_reading column names
const columnNameMapping: Record<string, string> = {
  // Energy totals
  'kwh': 'active_energy',
  'kvarh': 'reactive_energy',
  'kvah': 'apparent_energy',
  'active_energy': 'active_energy',
  'reactive_energy': 'reactive_energy',
  'apparent_energy': 'apparent_energy',
  'active_energy_export': 'active_energy_export',
  'reactive_energy_export': 'reactive_energy_export',
  'apparent_energy_export': 'apparent_energy_export',
  // Power
  'kw': 'power',
  'kvar': 'reactive_power',
  'kva': 'apparent_power',
  'total_active_power': 'power',
  'total_reactive_power': 'reactive_power',
  'total_apparent_power': 'apparent_power',
  'power': 'power',
  'reactive_power': 'reactive_power',
  'apparent_power': 'apparent_power',
  // Phase power
  'phase_a_power': 'power_phase_a',
  'phase_b_power': 'power_phase_b',
  'phase_c_power': 'power_phase_c',
  'power_phase_a': 'power_phase_a',
  'power_phase_b': 'power_phase_b',
  'power_phase_c': 'power_phase_c',
  'apparent_power_phase_a': 'apparent_power_phase_a',
  'apparent_power_phase_b': 'apparent_power_phase_b',
  'apparent_power_phase_c': 'apparent_power_phase_c',
  'reactive_power_phase_a': 'reactive_power_phase_a',
  'reactive_power_phase_b': 'reactive_power_phase_b',
  'reactive_power_phase_c': 'reactive_power_phase_c',
  // Current
  'ia': 'current_line_a',
  'ib': 'current_line_b',
  'ic': 'current_line_c',
  'phase_a_current': 'current_line_a',
  'phase_b_current': 'current_line_b',
  'phase_c_current': 'current_line_c',
  'current': 'current',
  'current_line_a': 'current_line_a',
  'current_line_b': 'current_line_b',
  'current_line_c': 'current_line_c',
  // Voltage
  'va': 'voltage_a_n',
  'vb': 'voltage_b_n',
  'vc': 'voltage_c_n',
  'vab': 'voltage_a_b',
  'vbc': 'voltage_b_c',
  'vca': 'voltage_c_a',
  'phase_a_voltage': 'voltage_a_n',
  'phase_b_voltage': 'voltage_b_n',
  'phase_c_voltage': 'voltage_c_n',
  'voltage_a_n': 'voltage_a_n',
  'voltage_b_n': 'voltage_b_n',
  'voltage_c_n': 'voltage_c_n',
  'voltage_a_b': 'voltage_a_b',
  'voltage_b_c': 'voltage_b_c',
  'voltage_c_a': 'voltage_c_a',
  'voltage_p_n': 'voltage_p_n',
  'voltage_p_p': 'voltage_p_p',
  // Power factor
  'pf': 'power_factor',
  'power_factor': 'power_factor',
  'power_factor_phase_a': 'power_factor_phase_a',
  'power_factor_phase_b': 'power_factor_phase_b',
  'power_factor_phase_c': 'power_factor_phase_c',
  // Other
  'hz': 'frequency',
  'frequency': 'frequency',
  'maximum_demand_real': 'maximum_demand_real',
  'voltage_thd': 'voltage_thd',
  'voltage_thd_phase_a': 'voltage_thd_phase_a',
  'voltage_thd_phase_b': 'voltage_thd_phase_b',
  'voltage_thd_phase_c': 'voltage_thd_phase_c',
};

// GET /power-columns - Get all registers associated with a device via meterId
app.get('/power-columns', requirePermission('dashboard:read'), async (c) => {
  try {
    const meterId = c.req.query('deviceId');
    if (!meterId) {
      return c.json({ success: false, message: 'deviceId parameter is required' }, 400);
    }

    const sql = `
      SELECT DISTINCT r.name
      FROM register r
      JOIN device_register dr ON r.register_id = dr.register_id
      JOIN meter m ON m.device_id = dr.device_id
      WHERE m.meter_id = $1
      ORDER BY r.name ASC
    `;

    console.log('[Dashboard] power-columns sql:', sql);
    console.log('[Dashboard] power-columns params:', [meterId]);

    const result = await query(c.env, sql, [meterId]);
    const columns = result.rows.map((r: any) => {
      const label = r.name.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { name: r.name, label, type: 'numeric' };
    });

    return c.json({
      success: true,
      data: columns,
      meta: { count: columns.length },
    });
  } catch (error: any) {
    logError('Error fetching power columns', error);
    return c.json({ success: false, message: 'Failed to fetch power columns' }, 500);
  }
});

// GET /power-columns/cache/invalidate
app.get('/power-columns/cache/invalidate', requirePermission('dashboard:admin'), (c) => {
  return c.json({ success: true, message: 'Power columns cache invalidated (no-op on worker)' });
});

// GET /power-columns/cache/stats
app.get('/power-columns/cache/stats', requirePermission('dashboard:read'), (c) => {
  return c.json({ success: true, data: { cached: false, message: 'No cache on worker deployment' } });
});

// GET /total-active-energy - Sum of active_energy from latest reading of each active meter element
app.get('/total-active-energy', requirePermission('dashboard:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);
    }

    const sql = `
      SELECT COALESCE(SUM(latest_readings.active_energy), 0) AS total_active_energy
      FROM (
        SELECT DISTINCT ON (mr.meter_element_id)
          mr.active_energy
        FROM meter m
        JOIN meter_element me ON me.meter_id = m.meter_id
        JOIN meter_reading mr
          ON mr.meter_element_id = me.meter_element_id
          AND mr.tenant_id = $1
        WHERE m.tenant_id = $1
          AND m.active = true
        ORDER BY mr.meter_element_id, mr.created_at DESC
      ) AS latest_readings
    `;

    console.log('[Dashboard] Total Active Energy SQL:', sql);
    console.log('[Dashboard] Total Active Energy Params:', [tenantId]);

    const result = await query(c.env, sql, [tenantId]);
    const totalActiveEnergy = parseFloat(result.rows?.[0]?.total_active_energy || '0');

    return c.json({
      success: true,
      data: {
        total_active_energy: totalActiveEnergy,
      },
    });
  } catch (error: any) {
    logError('Error fetching total active energy', error);
    return c.json({ success: false, message: 'Failed to fetch total active energy' }, 500);
  }
});

// GET /total-power - Sum of power from latest reading of each active meter element
app.get('/total-power', requirePermission('dashboard:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);
    }

    const sql = `
      SELECT COALESCE(SUM(latest_readings.power), 0) AS total_power
      FROM (
        SELECT DISTINCT ON (mr.meter_element_id)
          mr.power
        FROM meter m
        JOIN meter_element me ON me.meter_id = m.meter_id
        JOIN meter_reading mr
          ON mr.meter_element_id = me.meter_element_id
          AND mr.tenant_id = $1
        WHERE m.tenant_id = $1
          AND m.active = true
        ORDER BY mr.meter_element_id, mr.created_at DESC
      ) AS latest_readings
    `;

    console.log('[Dashboard] Total Power SQL:', sql);
    console.log('[Dashboard] Total Power Params:', [tenantId]);

    const result = await query(c.env, sql, [tenantId]);
    const totalPower = parseFloat(result.rows?.[0]?.total_power || '0');

    return c.json({
      success: true,
      data: {
        total_power: totalPower,
      },
    });
  } catch (error: any) {
    logError('Error fetching total power', error);
    return c.json({ success: false, message: 'Failed to fetch total power' }, 500);
  }
});

export default app;
