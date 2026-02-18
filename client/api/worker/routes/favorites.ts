/**
 * Favorites routes - Hono worker
 * Favorites for meter elements
 */

import { Hono } from 'hono';
import { query, transaction, Env } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

/**
 * Transform raw query results into nested meter structure with elements
 */
function transformMetersWithElements(rows: any[]) {
  const metersMap: Record<number, any> = {};

  rows.forEach((row) => {
    if (!metersMap[row.meter_id]) {
      metersMap[row.meter_id] = {
        id: row.meter_id,
        name: row.meter_name,
        elements: [],
      };
    }

    if (row.meter_element_id) {
      metersMap[row.meter_id].elements.push({
        meter_element_id: row.meter_element_id,
        element: row.element,
        name: row.name,
        favorite_name: row.favorite_name,
        is_favorited: row.is_favorited,
        favorite_id: row.favorite_id,
      });
    }
  });

  return Object.values(metersMap);
}

// GET /meters - Get all meters with their elements and favorite status
app.get('/meters', async (c) => {
  try {
    const qs = c.req.query();
    const tenant_id = qs.tenant_id || String(c.get('tenantId'));
    const users_id = qs.users_id;

    if (!users_id) return c.json({ success: false, message: 'users_id is required' }, 400);
    if (!tenant_id) return c.json({ success: false, message: 'tenant_id is required' }, 400);

    const sql = `
      SELECT
        m.meter_id,
        m.name as meter_name,
        me.meter_element_id,
        me.element,
        me.name,
        CASE
          WHEN me.meter_element_id IS NOT NULL THEN
            CONCAT(COALESCE(m.name, 'Unknown Meter'), '    ', COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, 'Unknown'))
          ELSE
            COALESCE(m.name, 'Unknown Meter')
        END as favorite_name,
        CASE WHEN f.favorite_id IS NOT NULL THEN true ELSE false END as is_favorited,
        f.favorite_id
      FROM public.meter m
      LEFT JOIN public.meter_element me ON m.meter_id = me.meter_id AND me.tenant_id = $1
      LEFT JOIN public.favorite f ON
        f.id1 = me.meter_id
        AND f.id2 = me.meter_element_id
        AND f.table_name = 'meter'
        AND f.tenant_id = $1
        AND f.users_id = $2
      WHERE m.tenant_id = $1
      ORDER BY m.name ASC, me.element ASC
    `;

    const result = await query(c.env, sql, [tenant_id, users_id]);
    const meters = transformMetersWithElements(result.rows);

    return c.json({ success: true, data: meters });
  } catch (error: any) {
    logError('Error fetching meters with elements:', error);
    return c.json({ success: false, message: 'Failed to fetch meters with elements', error: error.message }, 500);
  }
});

// GET / - Get all favorites for a user in a tenant
app.get('/', async (c) => {
  try {
    const qs = c.req.query();
    const tenant_id = qs.tenant_id || String(c.get('tenantId'));
    const users_id = qs.users_id;
    const table_name = qs.table_name;

    if (!users_id) return c.json({ success: false, message: 'users_id is required' }, 400);
    if (!tenant_id) return c.json({ success: false, message: 'tenant_id is required' }, 400);

    let sql = `
      SELECT
        f.favorite_id,
        f.tenant_id,
        f.users_id,
        f.table_name,
        f.id1,
        f.id2,
        f.order_by,
        m.name as meter_name,
        me.element,
        me.name as element_name,
        CASE
          WHEN me.meter_element_id IS NOT NULL THEN
            CONCAT(COALESCE(m.name, 'Unknown Meter'), '    ', COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, 'Unknown'))
          ELSE
            COALESCE(m.name, 'Unknown Meter')
        END as favorite_name
      FROM public.favorite f
      LEFT JOIN public.meter m ON f.id1 = m.meter_id AND m.tenant_id = $1
      LEFT JOIN public.meter_element me ON f.id1 = me.meter_id AND f.id2 = me.meter_element_id AND me.tenant_id = $1
      WHERE f.tenant_id = $1 AND f.users_id = $2
    `;
    const params: any[] = [tenant_id, users_id];

    if (table_name) {
      sql += ' AND f.table_name = $3';
      params.push(table_name);
    }

    sql += ' ORDER BY COALESCE(f.order_by, 999999) ASC, f.favorite_id ASC';

    const result = await query(c.env, sql, params);
    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    logError('Error fetching favorites:', error);
    return c.json({ success: false, message: 'Failed to fetch favorites', error: error.message }, 500);
  }
});

// PUT /order - Update the display order of favorites
app.put('/order', async (c) => {
  try {
    const { tenant_id, users_id, order } = await c.req.json();

    if (!tenant_id || !users_id || !Array.isArray(order)) {
      return c.json({ success: false, message: 'tenant_id, users_id, and order array are required' }, 400);
    }

    await transaction(c.env, async (client) => {
      for (const item of order) {
        await client.query(
          'UPDATE public.favorite SET order_by = $1 WHERE favorite_id = $2 AND tenant_id = $3 AND users_id = $4',
          [item.order_by, item.favorite_id, tenant_id, users_id]
        );
      }
    });

    return c.json({ success: true, message: 'Favorite order updated successfully' });
  } catch (error: any) {
    logError('Error updating favorite order:', error);
    return c.json({ success: false, message: 'Failed to update favorite order', error: error.message }, 500);
  }
});

// POST / - Create a new favorite
app.post('/', async (c) => {
  try {
    const { tenant_id, users_id, table_name, id1, id2 } = await c.req.json();
    const id2Value = id2 !== undefined && id2 !== null ? parseInt(id2, 10) : 0;

    if (!users_id || !table_name || !id1) {
      return c.json({ success: false, message: 'users_id, table_name, and id1 (meter_id) are required' }, 400);
    }
    if (!tenant_id) {
      return c.json({ success: false, message: 'tenant_id is required' }, 400);
    }

    // Check if favorite already exists
    const existingResult = await query(
      c.env,
      'SELECT * FROM public.favorite WHERE tenant_id = $1 AND users_id = $2 AND table_name = $3 AND id1 = $4 AND id2 = $5',
      [tenant_id, users_id, table_name, id1, id2Value]
    );

    if (existingResult.rows.length > 0) {
      return c.json({ success: false, message: 'Favorite already exists', data: existingResult.rows[0] }, 409);
    }

    // Get the next order_by value
    const maxOrderResult = await query(
      c.env,
      'SELECT COALESCE(MAX(order_by), 0) + 1 as next_order FROM public.favorite WHERE tenant_id = $1 AND users_id = $2',
      [tenant_id, users_id]
    );
    const nextOrder = maxOrderResult.rows[0].next_order;

    const result = await query(
      c.env,
      'INSERT INTO public.favorite (tenant_id, users_id, table_name, id1, id2, order_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [tenant_id, users_id, table_name, id1, id2Value, nextOrder]
    );

    return c.json({ success: true, message: 'Favorite created successfully', data: result.rows[0] }, 201);
  } catch (error: any) {
    logError('Error creating favorite:', error);
    return c.json({ success: false, message: 'Failed to create favorite', error: error.message }, 500);
  }
});

// DELETE /:favoriteId - Delete a favorite by ID
app.delete('/:favoriteId', async (c) => {
  try {
    const favoriteId = c.req.param('favoriteId');
    const qs = c.req.query();
    const tenant_id = qs.tenant_id || String(c.get('tenantId'));

    if (!favoriteId) return c.json({ success: false, message: 'favoriteId is required' }, 400);
    if (!tenant_id) return c.json({ success: false, message: 'tenant_id is required' }, 400);

    const result = await query(
      c.env,
      'DELETE FROM public.favorite WHERE favorite_id = $1 AND tenant_id = $2 RETURNING *',
      [favoriteId, tenant_id]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Favorite not found' }, 404);
    }

    return c.json({ success: true, message: 'Favorite deleted successfully', data: result.rows[0] });
  } catch (error: any) {
    logError('Error deleting favorite:', error);
    return c.json({ success: false, message: 'Failed to delete favorite', error: error.message }, 500);
  }
});

export default app;
