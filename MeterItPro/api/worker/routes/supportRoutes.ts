/**
 * Support site API routes
 * - /api/support/tickets  — support ticket CRUD (adminsupport: all; others: own tenant read + create)
 * - /api/support/devices  — device catalog management (adminsupport only, no delete — use deactivate)
 */

import { Hono } from 'hono';
import { Env, execQuery } from '../db';
import { authenticateToken, getCachedUser, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const supportApp = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

supportApp.use('*', authenticateToken);

async function requireAdminSupport(c: any, next: any) {
  const partial = c.get('user');
  const user = await getCachedUser(c.env, String(partial.users_id));
  if (!user || !user.is_support_admin) {
    return c.json({ success: false, message: 'Support admin access required' }, 403);
  }
  c.set('user', user);
  await next();
}

async function loadFullUser(c: any, next: any) {
  const partial = c.get('user');
  const user = await getCachedUser(c.env, String(partial.users_id));
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);
  c.set('user', user);
  await next();
}

// ── Tickets ───────────────────────────────────────────────────────────────────

// GET /api/support/tickets
// adminsupport: all tickets; others: own tenant only
supportApp.get('/tickets', loadFullUser, async (c) => {
  const user = c.get('user');
  const isAdmin = user.role === 'adminsupport';
  try {
    const result = await execQuery(
      c.env,
      isAdmin
        ? `SELECT st.*,
             t_client.name AS client_tenant_name,
             u.name AS created_by_name,
             a.name AS assigned_to_name
           FROM support_ticket st
           LEFT JOIN tenant t_client ON t_client.tenant_id = st.client_tenant_id
           LEFT JOIN users u ON u.users_id = st.users_id
           LEFT JOIN users a ON a.users_id = st.assigned_to_users_id
           ORDER BY st.created_at DESC`
        : `SELECT st.*,
             t_client.name AS client_tenant_name,
             u.name AS created_by_name,
             a.name AS assigned_to_name
           FROM support_ticket st
           LEFT JOIN tenant t_client ON t_client.tenant_id = st.client_tenant_id
           LEFT JOIN users u ON u.users_id = st.users_id
           LEFT JOIN users a ON a.users_id = st.assigned_to_users_id
           WHERE st.client_tenant_id = $1
           ORDER BY st.created_at DESC`,
      isAdmin ? [] : [user.tenant_id]
    );
    return c.json({ success: true, data: { items: result.rows, total: result.rows.length } });
  } catch (error) {
    logError('Error fetching support tickets', error);
    return c.json({ success: false, message: 'Failed to fetch tickets' }, 500);
  }
});

// GET /api/support/tickets/:id
supportApp.get('/tickets/:id', loadFullUser, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ success: false, message: 'Invalid ticket id' }, 400);
  const user = c.get('user');
  const isAdmin = user.role === 'adminsupport';
  try {
    const result = await execQuery(
      c.env,
      `SELECT st.*,
         t_client.name AS client_tenant_name,
         u.name AS created_by_name,
         a.name AS assigned_to_name
       FROM support_ticket st
       LEFT JOIN tenant t_client ON t_client.tenant_id = st.client_tenant_id
       LEFT JOIN users u ON u.users_id = st.users_id
       LEFT JOIN users a ON a.users_id = st.assigned_to_users_id
       WHERE st.support_ticket_id = $1
         ${isAdmin ? '' : 'AND st.client_tenant_id = $2'}`,
      isAdmin ? [id] : [id, user.tenant_id]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Ticket not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logError('Error fetching support ticket', error);
    return c.json({ success: false, message: 'Failed to fetch ticket' }, 500);
  }
});

// POST /api/support/tickets — any authenticated user can create
supportApp.post('/tickets', loadFullUser, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { title, description, priority, type, client_tenant_id } = body;
  if (!title?.trim()) return c.json({ success: false, message: 'Title is required' }, 400);
  const resolvedClientTenantId = client_tenant_id ?? user.tenant_id;
  try {
    const result = await execQuery(
      c.env,
      `INSERT INTO support_ticket (tenant_id, client_tenant_id, users_id, title, description, priority, type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
       RETURNING *`,
      [user.tenant_id, resolvedClientTenantId, user.users_id, title.trim(), description ?? null, priority ?? 'medium', type ?? 'general']
    );
    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error) {
    logError('Error creating support ticket', error);
    return c.json({ success: false, message: 'Failed to create ticket' }, 500);
  }
});

// PUT /api/support/tickets/:id — adminsupport only
supportApp.put('/tickets/:id', requireAdminSupport, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ success: false, message: 'Invalid ticket id' }, 400);
  const body = await c.req.json();
  const { title, description, status, priority, type, assigned_to_users_id, client_tenant_id } = body;
  if (!title?.trim()) return c.json({ success: false, message: 'Title is required' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `UPDATE support_ticket
       SET title = $1, description = $2, status = $3, priority = $4, type = $5,
           assigned_to_users_id = $6, client_tenant_id = $7,
           resolved_at = CASE WHEN $3 IN ('resolved','closed') THEN COALESCE(resolved_at, NOW()) ELSE NULL END,
           updated_at = NOW()
       WHERE support_ticket_id = $8
       RETURNING *`,
      [title.trim(), description ?? null, status ?? 'open', priority ?? 'medium', type ?? 'general', assigned_to_users_id ?? null, client_tenant_id ?? null, id]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Ticket not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logError('Error updating support ticket', error);
    return c.json({ success: false, message: 'Failed to update ticket' }, 500);
  }
});

// ── Devices (adminsupport only, no hard delete) ───────────────────────────────

// GET /api/support/devices
supportApp.get('/devices', requireAdminSupport, async (c) => {
  try {
    const result = await execQuery(
      c.env,
      `SELECT device_id, manufacturer, model_number, description, type, number_of_elements, default_price, active
       FROM device
       ORDER BY manufacturer, model_number`,
      []
    );
    return c.json({ success: true, data: { items: result.rows } });
  } catch (error) {
    logError('Error fetching support devices', error);
    return c.json({ success: false, message: 'Failed to fetch devices' }, 500);
  }
});

// POST /api/support/devices
supportApp.post('/devices', requireAdminSupport, async (c) => {
  const { manufacturer, model_number, description, type, number_of_elements, default_price } = await c.req.json();
  if (!manufacturer || !model_number || !type) {
    return c.json({ success: false, message: 'manufacturer, model_number, and type are required' }, 400);
  }
  try {
    const result = await execQuery(
      c.env,
      `INSERT INTO device (manufacturer, model_number, description, type, number_of_elements, default_price, active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING device_id, manufacturer, model_number, description, type, number_of_elements, default_price, active`,
      [manufacturer, model_number, description ?? '', type, number_of_elements ?? 0, default_price ?? 0]
    );
    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error) {
    logError('Error creating device', error);
    return c.json({ success: false, message: 'Failed to create device' }, 500);
  }
});

// PUT /api/support/devices/:id
supportApp.put('/devices/:id', requireAdminSupport, async (c) => {
  const deviceId = parseInt(c.req.param('id'), 10);
  if (isNaN(deviceId)) return c.json({ success: false, message: 'Invalid device id' }, 400);
  const body = await c.req.json();
  const allowed = ['manufacturer', 'model_number', 'description', 'type', 'number_of_elements', 'default_price', 'active'];
  const fields = Object.keys(body).filter(k => allowed.includes(k));
  if (fields.length === 0) return c.json({ success: false, message: 'No valid fields to update' }, 400);
  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map(f => body[f]);
  try {
    const result = await execQuery(
      c.env,
      `UPDATE device SET ${setClauses} WHERE device_id = $1
       RETURNING device_id, manufacturer, model_number, description, type, number_of_elements, default_price, active`,
      [deviceId, ...values]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Device not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logError('Error updating device', error);
    return c.json({ success: false, message: 'Failed to update device' }, 500);
  }
});

// PATCH /api/support/devices/:id/deactivate
supportApp.patch('/devices/:id/deactivate', requireAdminSupport, async (c) => {
  const deviceId = parseInt(c.req.param('id'), 10);
  if (isNaN(deviceId)) return c.json({ success: false, message: 'Invalid device id' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `UPDATE device SET active = false WHERE device_id = $1
       RETURNING device_id, manufacturer, model_number, active`,
      [deviceId]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Device not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logError('Error deactivating device', error);
    return c.json({ success: false, message: 'Failed to deactivate device' }, 500);
  }
});

// PATCH /api/support/devices/:id/activate
supportApp.patch('/devices/:id/activate', requireAdminSupport, async (c) => {
  const deviceId = parseInt(c.req.param('id'), 10);
  if (isNaN(deviceId)) return c.json({ success: false, message: 'Invalid device id' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `UPDATE device SET active = true WHERE device_id = $1
       RETURNING device_id, manufacturer, model_number, active`,
      [deviceId]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Device not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logError('Error activating device', error);
    return c.json({ success: false, message: 'Failed to activate device' }, 500);
  }
});

export default supportApp;
