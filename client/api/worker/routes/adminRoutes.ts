/**
 * Admin-only API routes
 * Requires superadmin role. Lists tenants and issues impersonation tokens.
 */

import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { Env, execQuery } from '../db';
import { authenticateToken, getCachedUser, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const adminApp = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

adminApp.use('*', authenticateToken);

async function requireSuperAdmin(c: any, next: any) {
  const partial = c.get('user');
  const user = await getCachedUser(c.env, String(partial.users_id));
  if (!user || user.role !== 'superadmin') {
    return c.json({ success: false, message: 'Admin access required' }, 403);
  }
  c.set('user', user);
  await next();
}

adminApp.use('*', requireSuperAdmin);

// List all tenants
adminApp.get('/clients', async (c) => {
  const result = await execQuery(
    c.env,
    `SELECT tenant_id, name, url, contact_email, active, created_at
     FROM tenant
     ORDER BY name`,
    []
  );
  return c.json({
    success: true,
    data: {
      items: result.rows,
      pagination: { total: result.rows.length, page: 1, pageSize: result.rows.length },
    },
  });
});

// Get single tenant
adminApp.get('/clients/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ success: false, message: 'Invalid tenant id' }, 400);
  const result = await execQuery(c.env, 'SELECT * FROM tenant WHERE tenant_id = $1', [id]);
  if (result.rows.length === 0) return c.json({ success: false, message: 'Tenant not found' }, 404);
  return c.json({ success: true, data: result.rows[0] });
});

// Create tenant
adminApp.post('/clients', async (c) => {
  const body = await c.req.json();
  const { name, timezone, currency, language, date_format, time_format, default_page_size, url, contact_email, street, street2, city, state, zip, country, active, meter_reading_batch_count } = body;
  if (!name) return c.json({ success: false, message: 'Name is required' }, 400);
  const result = await execQuery(
    c.env,
    `INSERT INTO tenant (name, timezone, currency, language, date_format, time_format, default_page_size, url, contact_email, street, street2, city, state, zip, country, active, meter_reading_batch_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING *`,
    [name, timezone ?? '', currency ?? 'USD', language ?? 'en', date_format ?? 'MM/DD/YYYY', time_format ?? '12h', default_page_size ?? 20, url || null, contact_email || null, street || null, street2 || null, city || null, state || null, zip || null, country || null, active ?? true, meter_reading_batch_count ?? 0]
  );
  return c.json({ success: true, data: result.rows[0] }, 201);
});

// Update tenant (no delete allowed)
adminApp.put('/clients/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ success: false, message: 'Invalid tenant id' }, 400);
  const existing = await execQuery(c.env, 'SELECT tenant_id FROM tenant WHERE tenant_id = $1', [id]);
  if (existing.rows.length === 0) return c.json({ success: false, message: 'Tenant not found' }, 404);
  const body = await c.req.json();
  const { name, timezone, currency, language, date_format, time_format, default_page_size, url, contact_email, street, street2, city, state, zip, country, active, meter_reading_batch_count } = body;
  if (!name) return c.json({ success: false, message: 'Name is required' }, 400);
  const result = await execQuery(
    c.env,
    `UPDATE tenant SET
       name = $1, timezone = $2, currency = $3, language = $4, date_format = $5, time_format = $6,
       default_page_size = $7, url = $8, contact_email = $9, street = $10, street2 = $11,
       city = $12, state = $13, zip = $14, country = $15, active = $16, meter_reading_batch_count = $17,
       updated_at = NOW()
     WHERE tenant_id = $18
     RETURNING *`,
    [name, timezone ?? '', currency ?? 'USD', language ?? 'en', date_format ?? 'MM/DD/YYYY', time_format ?? '12h', default_page_size ?? 20, url || null, contact_email || null, street || null, street2 || null, city || null, state || null, zip || null, country || null, active ?? true, meter_reading_batch_count ?? 0, id]
  );
  return c.json({ success: true, data: result.rows[0] });
});

// ── Costs ─────────────────────────────────────────────────────────────────────

adminApp.get('/costs', async (c) => {
  try {
    const result = await execQuery(c.env, `SELECT * FROM cost ORDER BY name`, []);
    return c.json({ success: true, data: { items: result.rows, pagination: { total: result.rows.length, page: 1, pageSize: result.rows.length } } });
  } catch (error) {
    logError('Error fetching costs', error);
    return c.json({ success: false, message: 'Failed to fetch costs' }, 500);
  }
});

adminApp.get('/costs/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ success: false, message: 'Invalid cost id' }, 400);
  try {
    const result = await execQuery(c.env, 'SELECT * FROM cost WHERE cost_id = $1', [id]);
    if (result.rows.length === 0) return c.json({ success: false, message: 'Cost not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logError('Error fetching cost', error);
    return c.json({ success: false, message: 'Failed to fetch cost' }, 500);
  }
});

adminApp.post('/costs', async (c) => {
  const body = await c.req.json();
  const { name, quantity, rate, active } = body;
  if (!name?.trim()) return c.json({ success: false, message: 'Name is required' }, 400);
  const userId = c.get('user').users_id;
  try {
    const result = await execQuery(
      c.env,
      `INSERT INTO cost (name, quantity, rate, active, modified_by_users_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), quantity ?? 0, rate ?? 0, active ?? true, userId]
    );
    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error) {
    logError('Error creating cost', error);
    return c.json({ success: false, message: 'Failed to create cost' }, 500);
  }
});

adminApp.put('/costs/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ success: false, message: 'Invalid cost id' }, 400);
  const body = await c.req.json();
  const { name, quantity, rate, active } = body;
  if (!name?.trim()) return c.json({ success: false, message: 'Name is required' }, 400);
  const userId = c.get('user').users_id;
  try {
    const result = await execQuery(
      c.env,
      `UPDATE cost SET name = $1, quantity = $2, rate = $3, active = $4, modified_by_users_id = $5, updated_at = NOW() WHERE cost_id = $6 RETURNING *`,
      [name.trim(), quantity ?? 0, rate ?? 0, active ?? true, userId, id]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Cost not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logError('Error updating cost', error);
    return c.json({ success: false, message: 'Failed to update cost' }, 500);
  }
});

adminApp.delete('/costs/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ success: false, message: 'Invalid cost id' }, 400);
  try {
    await execQuery(c.env, 'DELETE FROM cost WHERE cost_id = $1', [id]);
    return c.json({ success: true });
  } catch (error) {
    logError('Error deleting cost', error);
    return c.json({ success: false, message: 'Failed to delete cost' }, 500);
  }
});

// ── Device catalog (global, no tenant filter) ─────────────────────────────────

adminApp.get('/devices', async (c) => {
  try {
    const result = await execQuery(
      c.env,
      `SELECT device_id, manufacturer, model_number, description, type, number_of_elements, default_price FROM device ORDER BY manufacturer, model_number`,
      []
    );
    return c.json({ success: true, data: { items: result.rows } });
  } catch (error: any) {
    logError('Error fetching device catalog', error);
    return c.json({ success: false, message: 'Failed to fetch devices' }, 500);
  }
});

adminApp.post('/devices', async (c) => {
  const { manufacturer, model_number, description, type, number_of_elements, default_price } = await c.req.json();
  if (!manufacturer || !model_number || !type) {
    return c.json({ success: false, message: 'manufacturer, model_number, and type are required' }, 400);
  }
  try {
    const result = await execQuery(
      c.env,
      `INSERT INTO device (manufacturer, model_number, description, type, number_of_elements, default_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING device_id, manufacturer, model_number, description, type, number_of_elements, default_price`,
      [manufacturer, model_number, description ?? '', type, number_of_elements ?? 0, default_price ?? 0]
    );
    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    logError('Error creating device', error);
    return c.json({ success: false, message: 'Failed to create device' }, 500);
  }
});

adminApp.put('/devices/:id', async (c) => {
  const deviceId = parseInt(c.req.param('id'), 10);
  if (isNaN(deviceId)) return c.json({ success: false, message: 'Invalid device id' }, 400);
  const body = await c.req.json();
  const allowed = ['manufacturer', 'model_number', 'description', 'type', 'number_of_elements', 'default_price'];
  const fields = Object.keys(body).filter(k => allowed.includes(k));
  if (fields.length === 0) return c.json({ success: false, message: 'No valid fields to update' }, 400);
  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map(f => body[f]);
  try {
    const result = await execQuery(
      c.env,
      `UPDATE device SET ${setClauses} WHERE device_id = $1
       RETURNING device_id, manufacturer, model_number, description, type, number_of_elements, default_price`,
      [deviceId, ...values]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Device not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    logError('Error updating device', error);
    return c.json({ success: false, message: 'Failed to update device' }, 500);
  }
});

adminApp.delete('/devices/:id', async (c) => {
  const deviceId = parseInt(c.req.param('id'), 10);
  if (isNaN(deviceId)) return c.json({ success: false, message: 'Invalid device id' }, 400);
  try {
    await execQuery(c.env, `DELETE FROM device WHERE device_id = $1`, [deviceId]);
    return c.json({ success: true });
  } catch (error: any) {
    logError('Error deleting device', error);
    return c.json({ success: false, message: 'Failed to delete device' }, 500);
  }
});

// ── Tenant equipment ──────────────────────────────────────────────────────────

adminApp.get('/clients/:id/equipment', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  if (isNaN(tenantId)) return c.json({ success: false, message: 'Invalid tenant id' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `SELECT td.tenant_device_id, td.tenant_id, td.device_id, td.quantity, td.price,
              d.manufacturer, d.model_number, d.description, d.type
       FROM tenant_device td
       JOIN device d ON d.device_id = td.device_id
       WHERE td.tenant_id = $1
       ORDER BY d.manufacturer, d.model_number`,
      [tenantId]
    );
    return c.json({ success: true, data: { items: result.rows } });
  } catch (error: any) {
    logError('Error fetching tenant equipment', error);
    return c.json({ success: false, message: 'Failed to fetch equipment' }, 500);
  }
});

adminApp.post('/clients/:id/equipment', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  if (isNaN(tenantId)) return c.json({ success: false, message: 'Invalid tenant id' }, 400);
  const { device_id, quantity, price } = await c.req.json();
  if (!device_id) return c.json({ success: false, message: 'device_id is required' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `INSERT INTO tenant_device (tenant_id, device_id, quantity, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, device_id) DO UPDATE SET quantity = EXCLUDED.quantity, price = EXCLUDED.price, updated_at = NOW()
       RETURNING *`,
      [tenantId, device_id, quantity ?? 1, price ?? 0]
    );
    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error: any) {
    logError('Error adding tenant equipment', error);
    return c.json({ success: false, message: 'Failed to add equipment' }, 500);
  }
});

adminApp.put('/clients/:id/equipment/:eid', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  const eid = parseInt(c.req.param('eid'), 10);
  if (isNaN(tenantId) || isNaN(eid)) return c.json({ success: false, message: 'Invalid id' }, 400);
  const { quantity, price } = await c.req.json();
  try {
    const result = await execQuery(
      c.env,
      `UPDATE tenant_device SET quantity = $1, price = $2, updated_at = NOW()
       WHERE tenant_device_id = $3 AND tenant_id = $4 RETURNING *`,
      [quantity ?? 1, price ?? 0, eid, tenantId]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    logError('Error updating tenant equipment', error);
    return c.json({ success: false, message: 'Failed to update equipment' }, 500);
  }
});

adminApp.delete('/clients/:id/equipment/:eid', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  const eid = parseInt(c.req.param('eid'), 10);
  if (isNaN(tenantId) || isNaN(eid)) return c.json({ success: false, message: 'Invalid id' }, 400);
  try {
    await execQuery(
      c.env,
      `DELETE FROM tenant_device WHERE tenant_device_id = $1 AND tenant_id = $2`,
      [eid, tenantId]
    );
    return c.json({ success: true });
  } catch (error: any) {
    logError('Error removing tenant equipment', error);
    return c.json({ success: false, message: 'Failed to remove equipment' }, 500);
  }
});

// ── Tenant costs ──────────────────────────────────────────────────────────────

adminApp.get('/clients/:id/costs', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  if (isNaN(tenantId)) return c.json({ success: false, message: 'Invalid tenant id' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `SELECT * FROM tenant_cost WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return c.json({ success: true, data: { items: result.rows } });
  } catch (error: any) {
    logError('Error fetching tenant costs', error);
    return c.json({ success: false, message: 'Failed to fetch costs' }, 500);
  }
});

adminApp.post('/clients/:id/costs', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  if (isNaN(tenantId)) return c.json({ success: false, message: 'Invalid tenant id' }, 400);
  const body = await c.req.json();
  const { description, cost_type, amount, billing_cycle, effective_date, notes, active } = body;
  if (!description?.trim()) return c.json({ success: false, message: 'Description is required' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `INSERT INTO tenant_cost (tenant_id, description, cost_type, amount, billing_cycle, effective_date, notes, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, description.trim(), cost_type ?? 'subscription', amount ?? 0, billing_cycle ?? 'monthly', effective_date || null, notes || null, active ?? true]
    );
    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error: any) {
    logError('Error creating tenant cost', error);
    return c.json({ success: false, message: 'Failed to create cost' }, 500);
  }
});

adminApp.put('/clients/:id/costs/:cid', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  const cid = parseInt(c.req.param('cid'), 10);
  if (isNaN(tenantId) || isNaN(cid)) return c.json({ success: false, message: 'Invalid id' }, 400);
  const body = await c.req.json();
  const { description, cost_type, amount, billing_cycle, effective_date, notes, active } = body;
  if (!description?.trim()) return c.json({ success: false, message: 'Description is required' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `UPDATE tenant_cost SET description = $1, cost_type = $2, amount = $3, billing_cycle = $4,
         effective_date = $5, notes = $6, active = $7, updated_at = NOW()
       WHERE tenant_cost_id = $8 AND tenant_id = $9 RETURNING *`,
      [description.trim(), cost_type ?? 'subscription', amount ?? 0, billing_cycle ?? 'monthly', effective_date || null, notes || null, active ?? true, cid, tenantId]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    logError('Error updating tenant cost', error);
    return c.json({ success: false, message: 'Failed to update cost' }, 500);
  }
});

adminApp.delete('/clients/:id/costs/:cid', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  const cid = parseInt(c.req.param('cid'), 10);
  if (isNaN(tenantId) || isNaN(cid)) return c.json({ success: false, message: 'Invalid id' }, 400);
  try {
    await execQuery(c.env, `DELETE FROM tenant_cost WHERE tenant_cost_id = $1 AND tenant_id = $2`, [cid, tenantId]);
    return c.json({ success: true });
  } catch (error: any) {
    logError('Error deleting tenant cost', error);
    return c.json({ success: false, message: 'Failed to delete cost' }, 500);
  }
});

// ── Tenant documents ──────────────────────────────────────────────────────────

adminApp.get('/clients/:id/documents', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  if (isNaN(tenantId)) return c.json({ success: false, message: 'Invalid tenant id' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `SELECT tenant_document_id, tenant_id, description, file_name, file_type, file_size, created_at
       FROM tenant_document WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return c.json({ success: true, data: { items: result.rows } });
  } catch (error: any) {
    logError('Error fetching tenant documents', error);
    return c.json({ success: false, message: 'Failed to fetch documents' }, 500);
  }
});

adminApp.post('/clients/:id/documents', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  if (isNaN(tenantId)) return c.json({ success: false, message: 'Invalid tenant id' }, 400);
  const body = await c.req.json();
  const { description, file_name, file_type, file_size, file_data } = body;
  if (!file_name || !file_data) return c.json({ success: false, message: 'file_name and file_data are required' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `INSERT INTO tenant_document (tenant_id, description, file_name, file_type, file_size, file_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING tenant_document_id, tenant_id, description, file_name, file_type, file_size, created_at`,
      [tenantId, description ?? '', file_name, file_type ?? 'application/octet-stream', file_size ?? 0, file_data]
    );
    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error: any) {
    logError('Error creating tenant document', error);
    return c.json({ success: false, message: 'Failed to create document' }, 500);
  }
});

adminApp.put('/clients/:id/documents/:did', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  const did = parseInt(c.req.param('did'), 10);
  if (isNaN(tenantId) || isNaN(did)) return c.json({ success: false, message: 'Invalid id' }, 400);
  const { description } = await c.req.json();
  try {
    const result = await execQuery(
      c.env,
      `UPDATE tenant_document SET description = $1, updated_at = NOW()
       WHERE tenant_document_id = $2 AND tenant_id = $3
       RETURNING tenant_document_id, tenant_id, description, file_name, file_type, file_size, created_at`,
      [description ?? '', did, tenantId]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    logError('Error updating tenant document', error);
    return c.json({ success: false, message: 'Failed to update document' }, 500);
  }
});

adminApp.delete('/clients/:id/documents/:did', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  const did = parseInt(c.req.param('did'), 10);
  if (isNaN(tenantId) || isNaN(did)) return c.json({ success: false, message: 'Invalid id' }, 400);
  try {
    await execQuery(c.env, `DELETE FROM tenant_document WHERE tenant_document_id = $1 AND tenant_id = $2`, [did, tenantId]);
    return c.json({ success: true });
  } catch (error: any) {
    logError('Error deleting tenant document', error);
    return c.json({ success: false, message: 'Failed to delete document' }, 500);
  }
});

adminApp.get('/clients/:id/documents/:did/download', async (c) => {
  const tenantId = parseInt(c.req.param('id'), 10);
  const did = parseInt(c.req.param('did'), 10);
  if (isNaN(tenantId) || isNaN(did)) return c.json({ success: false, message: 'Invalid id' }, 400);
  try {
    const result = await execQuery(
      c.env,
      `SELECT file_name, file_type, file_data FROM tenant_document WHERE tenant_document_id = $1 AND tenant_id = $2`,
      [did, tenantId]
    );
    if (result.rows.length === 0) return c.json({ success: false, message: 'Not found' }, 404);
    const doc = result.rows[0];
    return c.json({ success: true, data: { file_name: doc.file_name, file_type: doc.file_type, file_data: doc.file_data } });
  } catch (error: any) {
    logError('Error downloading tenant document', error);
    return c.json({ success: false, message: 'Failed to download document' }, 500);
  }
});

// Issue an impersonation JWT scoped to the target tenant
adminApp.post('/impersonate/:tenantId', async (c) => {
  const adminUser = c.get('user');
  const tenantId = parseInt(c.req.param('tenantId'), 10);
  if (isNaN(tenantId)) {
    return c.json({ success: false, message: 'Invalid tenant id' }, 400);
  }

  const tenantResult = await execQuery(
    c.env,
    'SELECT tenant_id, name FROM tenant WHERE tenant_id = $1 AND active = true',
    [tenantId]
  );
  if (tenantResult.rows.length === 0) {
    return c.json({ success: false, message: 'Tenant not found' }, 404);
  }
  const tenant = tenantResult.rows[0];

  const expiresIn = 8 * 3600;
  const token = await sign(
    {
      userId: adminUser.users_id,
      tenant_id: tenantId,
      isAdminView: true,
      viewingTenantName: tenant.name,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    },
    c.env.JWT_SECRET
  );

  // Audit log every impersonation for security traceability
  try {
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null;
    await execQuery(
      c.env,
      `INSERT INTO auth_logs (user_id, event_type, status, ip_address, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        adminUser.users_id,
        'admin_impersonate',
        'success',
        ipAddress,
        JSON.stringify({ target_tenant_id: tenantId, target_tenant_name: tenant.name }),
      ]
    );
  } catch (logErr) {
    logError('Failed to write impersonation audit log', logErr);
  }

  return c.json({
    success: true,
    data: { token, expiresIn, tenantId, tenantName: tenant.name },
  });
});

export default adminApp;
