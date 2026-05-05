/**
 * Reports routes - Hono worker
 * CRUD for reports, history, and email logs.
 * Field list is driven by reportSchema � add/rename a field in the schema only.
 */

import { Hono } from 'hono';
import { Env, execQuery } from '../db';

import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';
import { runReport, previewReport, generateDemandReport } from '../reportRunner';
import { create, update, findAll, findById } from '../crud';
import { parsePagination, parseNumericId, extractBodyData, isValidCronExpression, validateEmailList } from '../routeHelpers';
import { reportSchema } from './reportSchema';
import { queryConsumption, queryDemand, queryVirtualConsumption, queryVirtualDemand, getDateRange, TimePeriod } from '../meterQueryHelpers';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

// POST / - Create a new report
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const errors: string[] = [];

    if (!body.name?.trim()) errors.push('Report name is required');
    else if (body.name.length > 255) errors.push('Report name must not exceed 255 characters');
    if (!body.type?.trim()) errors.push('Report type is required');
    if (!body.cron || !isValidCronExpression(body.cron)) errors.push('A valid schedule is required');
    const toList: string[] = Array.isArray(body.recipients?.to) ? body.recipients.to : [];
    if (toList.length === 0) errors.push('At least one recipient is required');
    else { const ev = validateEmailList(toList); if (!ev.isValid) errors.push(`Invalid emails: ${ev.invalidEmails.join(', ')}`); }

    if (errors.length > 0) return c.json({ success: false, message: 'Validation failed', errors }, 400);

    const data = extractBodyData(body, reportSchema);
    if (data.active === undefined) data.active = true;
    data.tenant_id = c.get('tenantId');
    data.created_at = new Date();
    data.updated_at = new Date();

    const row = await create(c.env, 'report', data);
    return c.json({ success: true, data: row }, 201);
  } catch (error: any) {
    if (error.code === '23505') return c.json({ success: false, message: 'Report name already exists' }, 409);
    logError('Error creating report:', error);
    return c.json({ success: false, message: 'Failed to create report' }, 500);
  }
});

// GET / - Retrieve all reports with pagination
app.get('/', async (c) => {
  try {
    const qs = c.req.query();
    const { page, limit } = parsePagination(qs, { limit: 10 });
    const result = await findAll(c.env, {
      table: 'report',
      primaryKey: 'report_id',
      page,
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    return c.json({
      success: true,
      data: { items: result.rows, total: result.pagination.total, page: result.pagination.page, pageSize: result.pagination.pageSize, totalPages: result.pagination.totalPages },
    });
  } catch (error: any) {
    logError('Error retrieving reports:', error);
    return c.json({ success: false, message: 'Failed to retrieve reports' }, 500);
  }
});

// GET /:id - Retrieve a specific report
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (parseNumericId(id) === null) return c.json({ success: false, message: 'Invalid report ID format' }, 400);
    const row = await findById(c.env, 'report', 'report_id', id);
    if (!row) return c.json({ success: false, message: 'Report not found' }, 404);
    return c.json({ success: true, data: row });
  } catch (error: any) {
    logError('Error retrieving report:', error);
    return c.json({ success: false, message: 'Failed to retrieve report' }, 500);
  }
});

// PUT /:id - Update a report
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (parseNumericId(id) === null) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const existing = await findById(c.env, 'report', 'report_id', id);
    if (!existing) return c.json({ success: false, message: 'Report not found' }, 404);

    const body = await c.req.json();
    const errors: string[] = [];
    if (body.name !== undefined) {
      if (!body.name?.trim()) errors.push('Report name must be non-empty');
      else if (body.name.length > 255) errors.push('Report name must not exceed 255 characters');
    }
    if (body.cron !== undefined && !isValidCronExpression(body.cron)) errors.push('Invalid cron expression');
    // if (body.recipients !== undefined) {
    //   const toList: string[] = Array.isArray(body.recipients?.to) ? body.recipients.to : [];
    //   if (toList.length === 0) errors.push('At least one recipient is required');
    //   else { const ev = validateEmailList(toList); if (!ev.isValid) errors.push(`Invalid emails: ${ev.invalidEmails.join(', ')}`); }
    // }
    if (errors.length > 0) return c.json({ success: false, message: 'Validation failed', errors }, 400);

    const data = extractBodyData(body, reportSchema);
    if (Object.keys(data).length === 0) return c.json({ success: true, data: existing });

    const row = await update(c.env, 'report', 'report_id', id, data);
    if (!row) return c.json({ success: false, message: 'Failed to update report' }, 500);
    return c.json({ success: true, data: row });
  } catch (error: any) {
    if (error.code === '23505') return c.json({ success: false, message: 'Report name already exists' }, 409);
    logError('Error updating report:', error);
    return c.json({ success: false, message: 'Failed to update report' }, 500);
  }
});

// DELETE /:id - Delete a report
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (parseNumericId(id) === null) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const existing = await execQuery(c.env, 'SELECT report_id, name FROM public.report WHERE report_id = $1', [id]);
    if (existing.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    await execQuery(c.env, 'DELETE FROM public.report WHERE report_id = $1', [id]);
    return c.json({ success: true, message: 'Report deleted successfully' });
  } catch (error: any) {
    logError('Error deleting report:', error);
    return c.json({ success: false, message: 'Failed to delete report' }, 500);
  }
});

// PATCH /:id/toggle - Toggle the active status
app.patch('/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id');
    if (parseNumericId(id) === null) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const getResult = await execQuery(c.env, 'SELECT report_id, name, active FROM public.report WHERE report_id = $1', [id]);
    if (getResult.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    const newActive = !getResult.rows[0].active;
    const result = await execQuery(
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
    logError('Error toggling report status:', error);
    return c.json({ success: false, message: 'Failed to toggle report status' }, 500);
  }
});

// GET /:id/preview - Preview report as HTML (no emails sent)
app.get('/:id/preview', async (c) => {
  try {
    const id = c.req.param('id');
    if (parseNumericId(id) === null) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const html = await previewReport(c.env, Number(id), c.get('tenantId'));
    return c.html(html);
  } catch (error: any) {
    const msg = error?.message ?? 'Failed to preview report';
    if (msg.includes('not found')) {
      return c.json({ success: false, message: msg }, 404);
    }
    logError('Error previewing report:', error);
    return c.json({ success: false, message: msg }, 500);
  }
});

// POST /:id/run - Run a report immediately (sends emails via Cloudflare Email Workers)
app.post('/:id/run', async (c) => {
  try {
    const id = c.req.param('id');
    if (parseNumericId(id) === null) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    await runReport(c.env, Number(id));
    return c.json({ success: true, message: 'Report executed and emails sent.' });
  } catch (error: any) {
    const msg = error?.message ?? 'Failed to run report';
    if (msg.includes('not found or inactive')) {
      return c.json({ success: false, message: msg }, 404);
    }
    logError('Error running report:', error);
    return c.json({ success: false, message: msg }, 500);
  }
});

// GET /:id/history - Get report execution history
app.get('/:id/history', async (c) => {
  try {
    const id = c.req.param('id');
    if (parseNumericId(id) === null) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const qs = c.req.query();
    const { page, limit } = parsePagination(qs, { limit: 10 });
    const offset = (page - 1) * limit;

    const reportCheck = await execQuery(c.env, 'SELECT report_id FROM public.report WHERE report_id = $1', [id]);
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

    const countResult = await execQuery(c.env, countSql, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const paramIdx = historyParams.length + 1;
    historySql += ` ORDER BY executed_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    historyParams.push(limit, offset);

    const historyResult = await execQuery(c.env, historySql, historyParams);

    return c.json({
      success: true,
      data: {
        history: historyResult.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    logError('Error retrieving report history:', error);
    return c.json({ success: false, message: 'Failed to retrieve report history' }, 500);
  }
});

// GET /:id/history/:historyId/emails - Get email logs for a report execution
app.get('/:id/history/:historyId/emails', async (c) => {
  try {
    const id = c.req.param('id');
    const historyId = c.req.param('historyId');

    if (parseNumericId(id) === null || parseNumericId(historyId) === null) {
      return c.json({ success: false, message: 'Invalid report ID or history ID format' }, 400);
    }

    const reportCheck = await execQuery(c.env, 'SELECT report_id FROM public.report WHERE report_id = $1', [id]);
    if (reportCheck.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    const historyCheck = await execQuery(c.env, 'SELECT report_history_id FROM public.report_history WHERE report_history_id = $1 AND report_id = $2', [historyId, id]);
    if (historyCheck.rows.length === 0) return c.json({ success: false, message: 'History entry not found' }, 404);

    const result = await execQuery(
      c.env,
      `SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
       FROM public.report_email_logs WHERE report_history_id = $1 ORDER BY sent_at DESC`,
      [historyId]
    );

    return c.json({ success: true, data: { emails: result.rows } });
  } catch (error: any) {
    logError('Error retrieving email logs:', error);
    return c.json({ success: false, message: 'Failed to retrieve email logs' }, 500);
  }
});

// GET /:id/graph-data - Time-series graph data using the same query logic as the dashboard
app.get('/:id/graph-data', async (c) => {
  try {
    const id = c.req.param('id');
    if (parseNumericId(id) === null) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const qs = c.req.query();
    const tzOffset = qs.tzOffset ? parseInt(qs.tzOffset) : 0;
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'Unauthorized: tenant context required' }, 401);

    const reportResult = await execQuery(
      c.env,
      `SELECT report_id, name, type, time_frame, meter_selections FROM report WHERE report_id = $1`,
      [id]
    );
    if (reportResult.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    const report = reportResult.rows[0];
    const timeFrame: string = report.time_frame || 'monthly';
    const timePeriod = (['today', 'weekly', 'monthly', 'yearly'].includes(timeFrame) ? timeFrame : 'monthly') as TimePeriod;
    const { startDate, endDate } = getDateRange(timeFrame, qs.startDate, qs.endDate);
    const isDemand = report.type === 'demand';

    // Split meter_selections into virtual and physical meters
    const selections: any[] = Array.isArray(report.meter_selections) ? report.meter_selections : [];
    const allMeterIds = [...new Set(selections.map((s: any) => Number(s.meter_id)).filter(id => !isNaN(id) && id > 0))];

    const virtualIdRows = allMeterIds.length > 0
      ? (await execQuery(c.env, `SELECT DISTINCT meter_id FROM meter_virtual WHERE meter_id = ANY($1)`, [allMeterIds])).rows
      : [];
    const virtualMeterIdSet = new Set(virtualIdRows.map((r: any) => Number(r.meter_id)));

    const physicalPairs: Array<{ meterId: number; meterElementId: number }> = [];
    const virtualMeterIds: number[] = [];

    for (const sel of selections) {
      if (!sel.meter_id) continue;
      const meterId = Number(sel.meter_id);

      if (virtualMeterIdSet.has(meterId)) {
        virtualMeterIds.push(meterId);
      } else {
        if (sel.meter_element_ids && sel.meter_element_ids.length > 0) {
          for (const elId of sel.meter_element_ids) {
            physicalPairs.push({ meterId, meterElementId: Number(elId) });
          }
        } else {
          const els = await execQuery(c.env, `SELECT meter_element_id FROM meter_element WHERE meter_id = $1`, [meterId]);
          for (const el of els.rows) {
            physicalPairs.push({ meterId, meterElementId: Number(el.meter_element_id) });
          }
        }
      }
    }

    // Fetch display names for physical elements
    const elementIds = [...new Set(physicalPairs.map(p => p.meterElementId))];
    const nameRows = elementIds.length > 0
      ? (await execQuery(
          c.env,
          `SELECT me.meter_element_id,
                CONCAT(COALESCE(TRIM(m.name)), ' (', COALESCE(TRIM(me.element), '?'), ') ', COALESCE(me.name, '?')) AS meter_name
          FROM meter_element me
           JOIN meter m ON me.meter_id = m.meter_id
           WHERE me.meter_element_id = ANY($1)`,
          [elementIds]
        )).rows
      : [];
    const nameMap = new Map(nameRows.map((r: any) => [Number(r.meter_element_id), r]));

    // Fetch display names for virtual meters
    const virtualNameRows = virtualMeterIds.length > 0
      ? (await execQuery(c.env, `SELECT meter_id, name FROM meter WHERE meter_id = ANY($1)`, [virtualMeterIds])).rows
      : [];
    const virtualNameMap = new Map(virtualNameRows.map((r: any) => [Number(r.meter_id), r.name as string]));

    // Build meter_element_labels — physical elements use element_id; virtual meters use meter_id as surrogate key
    const meter_element_labels: Record<number, string> = {};
    for (const [id, row] of nameMap.entries()) {
      meter_element_labels[id] = row.meter_name ?? `Element ${id}`;
    }
    for (const [id, name] of virtualNameMap.entries()) {
      meter_element_labels[id] = name ?? `Virtual Meter ${id}`;
    }

    const dataColumn = isDemand ? 'power' : 'calculated_kwh';
    const unit       = isDemand ? 'kW'    : 'kWh';

    // Query each physical pair and flatten into grouped_data rows (same shape as dashboard)
    const grouped_data: Array<Record<string, any>> = [];
    await Promise.all(physicalPairs.map(async ({ meterId, meterElementId }) => {
      const params = { tenantId, meterId, meterElementId, timePeriod, startDate: startDate.toISOString(), endDate: endDate.toISOString(), tzOffset };
      const raw = isDemand
        ? (await queryDemand(c.env, params)).map(r => ({ label_key: r.label_key, [dataColumn]: Number(r.power) }))
        : (await queryConsumption(c.env, params)).map(r => ({ label_key: r.label_key, [dataColumn]: Number(r.calculated_kwh) }));

      for (const row of raw) {
        grouped_data.push({ ...row, meter_id: meterId, meter_element_id: meterElementId });
      }
    }));

    // Query each virtual meter — one aggregated series per virtual meter
    await Promise.all(virtualMeterIds.map(async (meterId) => {
      const params = { tenantId, meterId, timePeriod, startDate: startDate.toISOString(), endDate: endDate.toISOString(), tzOffset };
      const raw = isDemand
        ? (await queryVirtualDemand(c.env, params)).map(r => ({ label_key: r.label_key, [dataColumn]: Number(r.power) }))
        : (await queryVirtualConsumption(c.env, params)).map(r => ({ label_key: r.label_key, [dataColumn]: Number(r.calculated_kwh) }));

      for (const row of raw) {
        // Use meterId as surrogate meter_element_id so the pivot function assigns the right label
        grouped_data.push({ ...row, meter_id: meterId, meter_element_id: meterId });
      }
    }));

    // Sort by label_key so Visualization renders in time order
    grouped_data.sort((a, b) => String(a.label_key).localeCompare(String(b.label_key)));

    return c.json({
      success: true,
      data: {
        grouped_data,
        selected_columns: [dataColumn],
        grouping_type: timePeriod === 'today' ? 'hourly' : timePeriod === 'yearly' ? 'monthly' : 'daily',
        meter_element_labels,
        column_units: { [dataColumn]: unit },
        aggregated_values: {},
        timeFrame,
        timePeriod,
        startDate: startDate.toISOString(),
        endDate:   endDate.toISOString(),
      },
    });
  } catch (error: any) {
    logError('Error fetching report graph data:', error);
    return c.json({ success: false, message: 'Failed to fetch report graph data' }, 500);
  }
});

// GET /:id/demand-data - Return raw demand data as JSON for in-browser preview
app.get('/:id/demand-data', async (c) => {
  try {
    const id = c.req.param('id');
    if (parseNumericId(id) === null) return c.json({ success: false, message: 'Invalid report ID format' }, 400);

    const result = await execQuery(
      c.env,
      `SELECT report_id, name, type, time_frame, visualization_type, grouping_type, attach_as, meter_selections FROM public.report WHERE report_id = $1`,
      [id]
    );

    if (result.rows.length === 0) return c.json({ success: false, message: 'Report not found' }, 404);

    const report = result.rows[0];
    if (report.type !== 'demand') return c.json({ success: false, message: 'Not a demand report' }, 400);

    const reportData = await generateDemandReport(c.env, report as any);
    return c.json({ success: true, data: reportData });
  } catch (error: any) {
    logError('Error fetching demand data:', error);
    return c.json({ success: false, message: error?.message ?? 'Failed to fetch demand data' }, 500);
  }
});

export default app;
