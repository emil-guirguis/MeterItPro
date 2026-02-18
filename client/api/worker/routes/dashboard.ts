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

app.use('*', authenticateToken);

// --- Known power columns (static list in lieu of PowerColumnDiscoveryService) ---
const POWER_COLUMNS = [
  'active_energy', 'active_energy_export', 'apparent_energy', 'apparent_energy_export',
  'apparent_power', 'apparent_power_phase_a', 'apparent_power_phase_b', 'apparent_power_phase_c',
  'current', 'current_line_a', 'current_line_b', 'current_line_c',
  'frequency', 'maximum_demand_real', 'power', 'power_factor',
  'power_factor_phase_a', 'power_factor_phase_b', 'power_factor_phase_c',
  'power_phase_a', 'power_phase_b', 'power_phase_c',
  'reactive_energy', 'reactive_energy_export', 'reactive_power',
  'reactive_power_phase_a', 'reactive_power_phase_b', 'reactive_power_phase_c',
  'voltage_a_b', 'voltage_a_n', 'voltage_b_c', 'voltage_b_n',
  'voltage_c_a', 'voltage_c_n', 'voltage_p_n', 'voltage_p_p',
  'voltage_thd', 'voltage_thd_phase_a', 'voltage_thd_phase_b', 'voltage_thd_phase_c',
];

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

    const selectedColumns: string[] = Array.isArray(card.selected_columns) ? card.selected_columns : [];
    if (selectedColumns.length === 0) {
      return c.json({ success: true, data: { card_id: card.dashboard_id, aggregated_values: {}, grouped_data: [] } });
    }

    // Calculate time frame (simplified)
    const now = new Date();
    let startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30); // default last 30 days

    if (card.custom_start_date) startDate = new Date(card.custom_start_date);
    const endDate = card.custom_end_date ? new Date(card.custom_end_date) : now;

    // Aggregate values
    const aggCols = selectedColumns.map((col: string) => `AVG("${col}") as "avg_${col}", MIN("${col}") as "min_${col}", MAX("${col}") as "max_${col}"`).join(', ');
    const aggSql = `SELECT ${aggCols} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4`;
    const aggResult = await query(c.env, aggSql, [tenantId, card.meter_element_id, startDate, endDate]);

    // Grouped data (daily)
    const groupCols = selectedColumns.map((col: string) => `AVG("${col}") as "${col}"`).join(', ');
    const groupSql = `SELECT DATE(created_at) as date, ${groupCols} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 GROUP BY DATE(created_at) ORDER BY DATE(created_at)`;
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
      if (me.meter_id !== body.meter_id) {
        return c.json({ success: false, message: 'Validation failed', errors: [{ field: 'meter_element_id', message: 'Meter element does not belong to the selected meter' }] }, 400);
      }
    }

    // Validate selected columns
    if (!body.selected_columns || (Array.isArray(body.selected_columns) && body.selected_columns.length === 0)) {
      return c.json({ success: false, message: 'Validation failed', errors: [{ field: 'selected_columns', message: 'At least one power column must be selected' }] }, 400);
    }

    const invalidCols = (body.selected_columns || []).filter((col: string) => !POWER_COLUMNS.includes(col));
    if (invalidCols.length > 0) {
      return c.json({ success: false, message: 'Validation failed', errors: [{ field: 'selected_columns', message: `Invalid columns: ${invalidCols.join(', ')}` }] }, 400);
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

    // Validate selected columns if provided
    if (body.selected_columns !== undefined) {
      if (!Array.isArray(body.selected_columns) || body.selected_columns.length === 0) {
        return c.json({ success: false, message: 'Validation failed', errors: [{ field: 'selected_columns', message: 'At least one power column must be selected' }] }, 400);
      }
      const invalidCols = body.selected_columns.filter((col: string) => !POWER_COLUMNS.includes(col));
      if (invalidCols.length > 0) {
        return c.json({ success: false, message: 'Validation failed', errors: [{ field: 'selected_columns', message: `Invalid columns: ${invalidCols.join(', ')}` }] }, 400);
      }
    }

    // Remove protected fields
    delete body.tenant_id;
    delete body.created_by_users_id;

    const updated = await update(c.env, 'dashboard', 'dashboard_id', c.req.param('id'), body);

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
    return c.json({ success: false, message: 'Failed to update dashboard card' }, 500);
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
    let startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    if (card.custom_start_date) startDate = new Date(card.custom_start_date);
    const endDate = card.custom_end_date ? new Date(card.custom_end_date) : now;

    const selectedColumns: string[] = Array.isArray(card.selected_columns) ? card.selected_columns : [];
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

    const selectedColumns: string[] = Array.isArray(card.selected_columns) ? card.selected_columns : [];
    const columnsList = ['meter_reading_id', 'created_at', ...selectedColumns];
    const validSortColumns = ['meter_reading_id', 'created_at', ...selectedColumns];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

    const sql = `SELECT ${columnsList.map((col) => `"${col}"`).join(', ')} FROM meter_reading WHERE tenant_id = $1 AND meter_element_id = $2 AND created_at >= $3 AND created_at <= $4 ORDER BY "${safeSortBy}" ${sortOrder}`;
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
app.get('/meters', requirePermission('dashboard:read'), async (c) => {
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
app.get('/meters/:meterId/elements', requirePermission('dashboard:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'User must have a valid tenant_id' }, 400);

    const meterId = parseInt(c.req.param('meterId'));
    if (isNaN(meterId)) return c.json({ success: false, message: 'Invalid meter ID' }, 400);

    // Verify meter belongs to tenant
    const meterResult = await query(c.env, 'SELECT meter_id, tenant_id FROM meter WHERE meter_id = $1', [meterId]);
    if (meterResult.rows.length === 0) return c.json({ success: false, message: 'Meter not found' }, 404);
    if (meterResult.rows[0].tenant_id !== tenantId) return c.json({ success: false, message: 'You do not have permission to access this meter' }, 403);

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

// GET /power-columns - Discover available power columns
app.get('/power-columns', requirePermission('dashboard:read'), async (c) => {
  try {
    // Try to discover columns dynamically from information_schema
    const result = await query(
      c.env,
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'meter_reading'
         AND data_type IN ('numeric', 'double precision', 'real', 'integer', 'bigint')
         AND column_name NOT IN ('meter_reading_id', 'tenant_id', 'meter_id', 'meter_element_id')
       ORDER BY ordinal_position`
    );

    const columns = result.rows.length > 0
      ? result.rows.map((r: any) => ({
          name: r.column_name,
          label: r.column_name.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          type: 'numeric',
        }))
      : POWER_COLUMNS.map((col) => ({
          name: col,
          label: col.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          type: 'numeric',
        }));

    return c.json({
      success: true,
      data: columns,
      meta: { count: columns.length },
    });
  } catch (error: any) {
    logError('Error discovering power columns', error);
    return c.json({ success: false, message: 'Failed to discover power columns' }, 500);
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

export default app;
