/**
 * Meter Elements routes - Hono worker
 * Mounted at /api/meters/:meterId/elements
 */

import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

// GET /schema - Get schema for meter elements
app.get('/schema', (c) => {
  try {
    const schema = {
      formFields: {
        name: {
          type: 'text',
          label: 'Name',
          required: true,
          maxLength: 255,
        },
        element: {
          type: 'text',
          label: 'Element',
          required: true,
          maxLength: 50,
        },
      },
      entityFields: {
        meter_element_id: { type: 'integer', primaryKey: true },
        meter_id: { type: 'integer', foreignKey: 'meter.meter_id' },
        tenant_id: { type: 'integer' },
        name: { type: 'text' },
        element: { type: 'text' },
      },
    };

    return c.json({
      success: true,
      data: {
        formFields: schema.formFields,
        entityFields: schema.entityFields,
      },
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Failed to fetch meter elements schema',
      error: error.message,
    }, 500);
  }
});

// GET / - Get all elements for a meter
app.get('/', async (c) => {
  try {
    const meterId = c.req.param('meterId');
    const tenantId = c.get('tenantId');

    if (!tenantId) {
      return c.json({ success: false, message: 'Tenant context required' }, 401);
    }

    // Verify meter exists and belongs to tenant
    const meterResult = await query(
      c.env,
      'SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }

    const sql = `SELECT
      me.meter_element_id,
      me.meter_id,
      me.name,
      me.element
     FROM meter_element me
     WHERE me.meter_id = $1
     ORDER BY me.element ASC`;

    const elements = await query(c.env, sql, [meterId]);

    return c.json({ success: true, data: elements.rows });
  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Failed to fetch meter elements',
      error: error.message,
    }, 500);
  }
});

// POST / - Add an element to a meter
app.post('/', async (c) => {
  try {
    const meterId = c.req.param('meterId');
    const { name, element } = await c.req.json();
    const tenantId = c.get('tenantId');

    if (!tenantId) {
      return c.json({ success: false, message: 'Tenant context required' }, 401);
    }

    // Basic validation
    if (!name || !element) {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors: { name: !name ? 'Name is required' : undefined, element: !element ? 'Element is required' : undefined },
      }, 400);
    }

    // Verify meter exists and belongs to tenant
    const meterResult = await query(
      c.env,
      'SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }

    // Check for duplicate element
    const duplicateCheck = await query(
      c.env,
      'SELECT meter_element_id FROM meter_element WHERE meter_id = $1 AND element = $2',
      [meterId, element]
    );

    if (duplicateCheck.rows.length > 0) {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors: { element: `Element "${element}" is already assigned to this meter` },
      }, 400);
    }

    const result = await query(
      c.env,
      `INSERT INTO meter_element (meter_id, tenant_id, name, element)
       VALUES ($1, $2, $3, $4)
       RETURNING meter_element_id, meter_id, name, element`,
      [meterId, tenantId, name, element]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Failed to create meter element' }, 500);
    }

    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Failed to add meter element',
      error: error.message,
    }, 500);
  }
});

// PUT /:elementId - Update a meter element
app.put('/:elementId', async (c) => {
  try {
    const meterId = c.req.param('meterId');
    const elementId = c.req.param('elementId');
    const { name, element } = await c.req.json();
    const tenantId = c.get('tenantId');

    if (!tenantId) {
      return c.json({ success: false, message: 'Tenant context required' }, 401);
    }

    // Verify meter exists and belongs to tenant
    const meterResult = await query(
      c.env,
      'SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }

    // Verify element exists and belongs to meter
    const elementResult = await query(
      c.env,
      'SELECT meter_element_id, name, element FROM meter_element WHERE meter_element_id = $1 AND meter_id = $2',
      [elementId, meterId]
    );

    if (elementResult.rows.length === 0) {
      return c.json({ success: false, message: 'Element not found' }, 404);
    }

    const currentElement = elementResult.rows[0];

    // Check for duplicate element (if element is being changed)
    if (element !== undefined && element !== currentElement.element) {
      const duplicateCheck = await query(
        c.env,
        'SELECT meter_element_id FROM meter_element WHERE meter_id = $1 AND element = $2 AND meter_element_id != $3',
        [meterId, element, elementId]
      );

      if (duplicateCheck.rows.length > 0) {
        return c.json({
          success: false,
          message: 'Validation failed',
          errors: { element: `Element "${element}" is already assigned to this meter` },
        }, 400);
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (element !== undefined) {
      updates.push(`element = $${paramCount++}`);
      values.push(element);
    }

    if (updates.length === 0) {
      return c.json({ success: false, message: 'No fields to update' }, 400);
    }

    values.push(elementId);
    values.push(meterId);

    const sql = `
      UPDATE meter_element
      SET ${updates.join(', ')}
      WHERE meter_element_id = $${paramCount++} AND meter_id = $${paramCount++}
      RETURNING meter_element_id, meter_id, name, element
    `;

    const result = await query(c.env, sql, values);

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Failed to update meter element' }, 500);
    }

    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Failed to update meter element',
      error: error.message,
    }, 500);
  }
});

// DELETE /:elementId - Delete a meter element
app.delete('/:elementId', async (c) => {
  try {
    const meterId = c.req.param('meterId');
    const elementId = c.req.param('elementId');
    const tenantId = c.get('tenantId');

    if (!tenantId) {
      return c.json({ success: false, message: 'Tenant context required' }, 401);
    }

    // Verify meter exists and belongs to tenant
    const meterResult = await query(
      c.env,
      'SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }

    // Verify element exists and belongs to meter
    const elementResult = await query(
      c.env,
      'SELECT meter_element_id FROM meter_element WHERE meter_element_id = $1 AND meter_id = $2',
      [elementId, meterId]
    );

    if (elementResult.rows.length === 0) {
      return c.json({ success: false, message: 'Element not found' }, 404);
    }

    await query(
      c.env,
      'DELETE FROM meter_element WHERE meter_element_id = $1 AND meter_id = $2',
      [elementId, meterId]
    );

    return c.json({ success: true, message: 'Element deleted successfully' });
  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Failed to delete meter element',
      error: error.message,
    }, 500);
  }
});

export default app;
