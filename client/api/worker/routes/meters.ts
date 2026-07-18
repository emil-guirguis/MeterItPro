/**
 * Meters CRUD routes - Hono worker
 */

import { Hono } from 'hono';
import { transaction, Env, execQuery } from '../db';

import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { findAll, findById, create, update, remove, checkDeleteRestrictions } from '../crud';
import { logError } from '../errorHandler';
import { meterSchema } from './meterSchema';

// Derive search fields from schema (fields with filertable: ['main'])
const meterSearchFields = Object.entries(meterSchema.formFields)
  .filter(([, def]) => (def as any).filertable?.includes('main'))
  .map(([name]) => name);

// Schema-driven is_virtual transform: 'virtual'|'physical'|boolean → DB boolean
const toDbVirtual = (v: any): boolean =>
  (meterSchema.formFields as any).is_virtual?.toApi
    ? (meterSchema.formFields as any).is_virtual.toApi(v)
    : v === 'virtual' || v === true;

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// All routes require authentication
app.use('*', authenticateToken);

// --- Routes ---

/**
 * GET /elements
 * Get available meters for selection in combined meters selector, favorites, and meter readings sidebar.
 */
app.get('/elements', requirePermission('meter:read'), async (c) => {
  const { type, excludeIds, searchQuery } = c.req.query();
  const tenantId = c.get('tenantId');

  if (!tenantId) {
    return c.json({ success: false, message: 'Tenant context required' }, 401);
  }

  try {
    let sql = `SELECT m.meter_id as id, m.name, m.serial_number as identifier
      FROM public.meter m
      WHERE m.tenant_id = $1 AND m.active = true AND m.is_virtual = false`;
    const params: any[] = [tenantId];
    let paramCount = 2;

    // Filter by search query
    if (searchQuery) {
      sql += ` AND (LOWER(m.name) LIKE LOWER($${paramCount}) OR LOWER(m.serial_number) LIKE LOWER($${paramCount + 1}))`;
      params.push(`%${searchQuery}%`);
      params.push(`%${searchQuery}%`);
      paramCount += 2;
    }

    // Exclude specific meter IDs
    if (excludeIds) {
      const excludeIdArray = excludeIds.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
      if (excludeIdArray.length > 0) {
        const placeholders = excludeIdArray.map((_, i) => `$${paramCount + i}`).join(',');
        sql += ` AND m.meter_id NOT IN (${placeholders})`;
        params.push(...excludeIdArray);
        paramCount += excludeIdArray.length;
      }
    }

    sql += ' ORDER BY m.name ASC';

    const result = await execQuery(c.env, sql, params);

    // Validate response data
    const validatedData = result.rows.filter((row: any) => {
      if (!row.id || !row.name || !row.identifier) {
        console.warn('Skipping meter with missing required fields:', row);
        return false;
      }
      return true;
    });

    return c.json({ success: true, data: validatedData });
  } catch (error: any) {
    logError('Error fetching meter elements', error);
    return c.json({
      success: false,
      message: 'Failed to fetch meter elements',
      error: error.message,
    }, 500);
  }
});

/**
 * GET /:meterId/virtual-config
 * Get previously selected meters for a virtual meter.
 */
app.get('/:meterId/virtual-config', requirePermission('meter:read'), async (c) => {
  const meterId = c.req.param('meterId');
  const tenantId = c.get('tenantId');

  if (!tenantId) {
    return c.json({ success: false, message: 'Tenant context required' }, 401);
  }

  if (!meterId) {
    return c.json({ success: false, message: 'Meter ID is required' }, 400);
  }

  try {
    // Verify that the meter exists and belongs to the tenant
    const meterCheckResult = await execQuery(
      c.env,
      'SELECT meter_id FROM public.meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterCheckResult.rows.length === 0) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }

    // Query meter_virtual joined with meter and meter_element for full detail
    const result = await execQuery(
      c.env,
      `SELECT
        mv.selected_meter_id,
        mv.select_meter_element_id,
        mv.operation,
        m.name AS meter_name,
        m.serial_number AS identifier,
        me.meter_element_id,
        me.name AS element_name,
        me.element
      FROM public.meter_virtual mv
      JOIN public.meter m ON mv.selected_meter_id = m.meter_id
      LEFT JOIN public.meter_element me ON me.meter_element_id = mv.select_meter_element_id
      WHERE mv.meter_id = $1
      ORDER BY mv.order_by ASC`,
      [meterId]
    );

    const selectedItems = result.rows.map((row: any) => {
      if (row.meter_element_id) {
        return {
          selectionType: 'element',
          meter_id: row.selected_meter_id,
          meter_name: row.meter_name,
          identifier: row.identifier,
          meter_element_id: row.meter_element_id,
          element_name: row.element_name,
          element: row.element,
          operation: row.operation ?? '+',
        };
      }
      return {
        selectionType: 'meter',
        meter_id: row.selected_meter_id,
        meter_name: row.meter_name,
        identifier: row.identifier,
        operation: row.operation ?? '+',
      };
    });

    return c.json({ success: true, meterId, selectedItems });
  } catch (error: any) {
    logError('Error fetching virtual meter config', error);
    return c.json({
      success: false,
      message: 'Failed to fetch virtual meter configuration',
      error: error.message,
    }, 500);
  }
});

/**
 * POST /:meterId/virtual-config
 * Save selected meters for a virtual meter.
 */
app.post('/:meterId/virtual-config', requirePermission('meter:update'), async (c) => {
  const meterId = c.req.param('meterId');
  const tenantId = c.get('tenantId');

  if (!tenantId) {
    return c.json({ success: false, message: 'Tenant context required' }, 401);
  }

  if (!meterId) {
    return c.json({ success: false, message: 'Meter ID is required' }, 400);
  }

  const body = await c.req.json();
  const { selectedMeterIds = [], selectedMeterElementIds = [], operations = [] } = body;

  // Validate request body
  if (!Array.isArray(selectedMeterIds) || !Array.isArray(selectedMeterElementIds)) {
    return c.json({
      success: false,
      message: 'selectedMeterIds and selectedMeterElementIds must be arrays',
    }, 400);
  }

  if (selectedMeterIds.length !== selectedMeterElementIds.length) {
    return c.json({
      success: false,
      message: 'selectedMeterIds and selectedMeterElementIds must have the same length',
    }, 400);
  }

  try {
    // Verify that the meter exists and belongs to the tenant
    const meterCheckResult = await execQuery(
      c.env,
      'SELECT meter_id FROM public.meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterCheckResult.rows.length === 0) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }

    // Use transaction for atomicity
    await transaction(c.env, async (client) => {
      // Delete existing records
      await client.query('DELETE FROM public.meter_virtual WHERE meter_id = $1', [meterId]);

      // Insert new records
      if (selectedMeterIds.length > 0) {
        const insertQuery = `
          INSERT INTO public.meter_virtual (meter_id, selected_meter_id, select_meter_element_id, order_by, operation)
          VALUES ${selectedMeterIds.map((_: any, i: number) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`).join(', ')}
        `;
        const insertParams: any[] = [meterId];
        for (let i = 0; i < selectedMeterIds.length; i++) {
          insertParams.push(selectedMeterIds[i]);
          insertParams.push(selectedMeterElementIds[i]);
          insertParams.push(i); // order_by
          insertParams.push(i === 0 ? '+' : (operations[i] === '-' ? '-' : '+')); // operation; first is always '+'
        }
        await client.query(insertQuery, insertParams);
      }
    });

    return c.json({
      success: true,
      meterId,
      savedConfiguration: {
        selectedMeterIds,
        selectedMeterElementIds,
      },
    });
  } catch (error: any) {
    logError('Error saving virtual meter config', error);
    return c.json({
      success: false,
      message: 'Failed to save virtual meter configuration',
      error: error.message,
    }, 500);
  }
});

// Get all meters with filtering and pagination
app.get('/', requirePermission('meter:read'), async (c) => {
  try {
    const qs = c.req.query();
    const tenantId = c.get('tenantId');

    const result = await findAll(c.env, {
      table: 'meter',
      primaryKey: 'meter_id',
      tenantId,
      page: parseInt(qs.page || '1', 10),
      limit: parseInt(qs.limit || '25', 10),
      search: qs.search || undefined,
      searchFields: meterSearchFields,
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder,
      joins: 'LEFT JOIN device d ON meter.device_id = d.device_id',
      selectFields: 'meter.*, d.manufacturer as device_manufacturer, d.model_number as device_model_number',
    });

    return c.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (error: any) {
    logError('Error fetching meters', error);
    return c.json({ success: false, message: 'Failed to fetch meters' }, 500);
  }
});

// Create meter
app.post('/', requirePermission('meter:create'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({
        success: false,
        message: 'User must have a valid tenant_id to create meters',
      }, 400);
    }

    const body = await c.req.json();
    const meterData: Record<string, any> = {
      ...body,
      tenant_id: tenantId,
    };

    // Remove fields that don't exist in the database
    delete meterData.elements;

    if (meterData.is_virtual !== undefined) {
      meterData.is_virtual = toDbVirtual(meterData.is_virtual);
    }

    const meter = await create(c.env, 'meter', meterData);
    return c.json({ success: true, data: meter }, 201);
  } catch (error: any) {
    logError('Error creating meter', error);
    return c.json({
      success: false,
      message: 'Failed to create meter',
      error: error.message,
      detail: error.detail,
      code: error.code,
    }, 500);
  }
});

// Get single meter by ID
app.get('/:id', requirePermission('meter:read'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');
    const meter = await findById(c.env, 'meter', 'meter_id', id, tenantId);
    if (!meter) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }
    return c.json({ success: true, data: meter });
  } catch (error: any) {
    logError('Error fetching meter', error);
    return c.json({ success: false, message: 'Failed to fetch meter' }, 500);
  }
});

// Update meter
app.put('/:id', requirePermission('meter:update'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');

    // Find the meter first
    const meter = await findById(c.env, 'meter', 'meter_id', id, tenantId);
    if (!meter) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }

    const body = await c.req.json();
    const updateData: Record<string, any> = { ...body };

    // Filter out fields that don't exist in the database or are read-only
    delete updateData.device;
    delete updateData.model;
    delete updateData.status;
    delete updateData.tenant_id;
    delete updateData.tenantId;
    delete updateData.elements;

    if (updateData.is_virtual !== undefined) {
      updateData.is_virtual = toDbVirtual(updateData.is_virtual);
    }

    const updated = await update(c.env, 'meter', 'meter_id', id, updateData);
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    logError('Error updating meter', error);
    return c.json({ success: false, message: 'Failed to update meter' }, 500);
  }
});

// Delete meter
app.delete('/:id', requirePermission('meter:delete'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');

    const meter = await findById(c.env, 'meter', 'meter_id', id, tenantId);
    if (!meter) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }

    const violation = await checkDeleteRestrictions(c.env, meterSchema, id);
    if (violation) return c.json({ success: false, message: violation.message }, 409);

    await remove(c.env, 'meter', 'meter_id', id, tenantId);
    return c.json({ success: true, message: 'Meter deleted successfully' });
  } catch (error: any) {
    logError('Error deleting meter', error);
    return c.json({ success: false, message: 'Failed to delete meter' }, 500);
  }
});

export default app;
