/**
 * Settings routes - Hono worker
 */

import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

// GET /company - Get company settings
app.get('/company', requirePermission('settings:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Tenant ID not found in user context' }, 400);
    }

    const result = await query(
      c.env,
      'SELECT * FROM settings WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );

    const settings = result.rows.length > 0 ? result.rows[0] : {};

    return c.json({ success: true, data: settings });
  } catch (error: any) {
    logError('Error fetching company settings:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch company settings',
      error: error.message,
    }, 500);
  }
});

// PUT /company - Update company settings
app.put('/company', requirePermission('settings:update'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Tenant ID not found in user context' }, 400);
    }

    const body = await c.req.json();

    // Check if settings exist for this tenant
    const existing = await query(
      c.env,
      'SELECT settings_id FROM settings WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );

    let settings;
    if (existing.rows.length > 0) {
      // Update existing
      const setClause: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, value] of Object.entries(body)) {
        if (key === 'settings_id' || key === 'tenant_id') continue;
        setClause.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }

      if (setClause.length === 0) {
        return c.json({ success: true, data: existing.rows[0], message: 'No fields to update' });
      }

      setClause.push(`updated_at = NOW()`);
      values.push(existing.rows[0].settings_id);

      const sql = `UPDATE settings SET ${setClause.join(', ')} WHERE settings_id = $${idx} RETURNING *`;
      const result = await query(c.env, sql, values);
      settings = result.rows[0];
    } else {
      // Insert new
      const data = { ...body, tenant_id: tenantId };
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`);

      const sql = `INSERT INTO settings (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const result = await query(c.env, sql, values);
      settings = result.rows[0];
    }

    return c.json({
      success: true,
      data: settings,
      message: 'Company settings updated successfully',
    });
  } catch (error: any) {
    logError('Error updating company settings:', error);
    return c.json({
      success: false,
      message: 'Failed to update company settings',
      error: error.message,
    }, 500);
  }
});

// GET / - Legacy endpoint for backward compatibility
app.get('/', requirePermission('settings:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Tenant ID not found in user context' }, 400);
    }

    const result = await query(
      c.env,
      'SELECT * FROM settings WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );

    const settings = result.rows.length > 0 ? result.rows[0] : {};

    return c.json({ success: true, data: { company: settings } });
  } catch (error: any) {
    logError('Error fetching settings:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message,
    }, 500);
  }
});

export default app;
