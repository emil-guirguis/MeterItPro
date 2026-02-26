/**
 * Settings routes - Hono worker
 */

import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

/** Map a tenant row to the CompanySettings shape the frontend expects */
function tenantToSettings(tenant: any) {
  return {
    id: String(tenant.tenant_id),
    name: tenant.name ?? '',
    logo: null,
    address: {
      street: tenant.street ?? '',
      street2: tenant.street2 ?? '',
      city: tenant.city ?? '',
      state: tenant.state ?? '',
      zip: tenant.zip ?? '',
      country: tenant.country ?? '',
    },
    contactInfo: {
      url: tenant.url ?? '',
    },
    systemConfig: {
      timezone: tenant.timezone ?? '',
      dateFormat: tenant.date_format ?? '',
      timeFormat: tenant.time_format ?? '',
      currency: tenant.currency ?? '',
      language: tenant.language ?? '',
    },
    features: {
      userManagement: true,
      locationManagement: true,
      meterManagement: true,
      contactManagement: true,
      emailTemplates: true,
      reporting: true,
      analytics: true,
      mobileApp: false,
      apiAccess: true,
    },
    integrations: {
      emailProvider: null,
      smsProvider: null,
      paymentProcessor: null,
      calendarSync: false,
      weatherAPI: false,
      mapProvider: '',
    },
    updatedAt: tenant.updated_at,
  };
}

// GET /company - Get company settings
app.get('/company', requirePermission('settings:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Tenant ID not found in user context' }, 400);
    }

    const result = await query(
      c.env,
      'SELECT * FROM public.tenant WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Tenant not found' }, 404);
    }

    return c.json({ success: true, data: tenantToSettings(result.rows[0]) });
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

    // Map CompanySettings fields to tenant columns
    const updateData: Record<string, any> = {};
    if (body.name !== undefined)                   updateData.name    = body.name;
    if (body.contactInfo?.url !== undefined)        updateData.url     = body.contactInfo.url;
    if (body.address?.street !== undefined)         updateData.street  = body.address.street;
    if (body.address?.street2 !== undefined)        updateData.street2 = body.address.street2;
    if (body.address?.city !== undefined)           updateData.city    = body.address.city;
    if (body.address?.state !== undefined)          updateData.state   = body.address.state;
    if (body.address?.zip !== undefined)            updateData.zip     = body.address.zip;
    if (body.address?.country !== undefined)        updateData.country = body.address.country;

    if (Object.keys(updateData).length === 0) {
      return c.json({ success: true, message: 'No fields to update' });
    }

    const setClause: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updateData)) {
      setClause.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    setClause.push(`updated_at = NOW()`);
    values.push(tenantId);

    const sql = `UPDATE public.tenant SET ${setClause.join(', ')} WHERE tenant_id = $${idx} RETURNING *`;
    const result = await query(c.env, sql, values);

    return c.json({
      success: true,
      data: tenantToSettings(result.rows[0]),
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

// GET /notifications - Get notification settings for current tenant
app.get('/notifications', async (c) => {
  try {
    const tenantId = c.get('tenantId');

    const result = await query(
      c.env,
      'SELECT * FROM public.notification_settings WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );

    let settings;
    if (result.rows.length === 0) {
      settings = {
        id: null,
        health_check_cron: '0 * * * *',
        daily_email_cron: '0 9 * * *',
        email_template_id: null,
        enabled: true,
        stale_threshold_hours: 2,
        updated_at: null,
      };
    } else {
      const row = result.rows[0];
      settings = {
        id: String(row.notification_settings_id),
        health_check_cron: row.health_check_cron,
        daily_email_cron: row.daily_email_cron,
        email_template_id: row.email_template_id ? String(row.email_template_id) : null,
        enabled: row.enabled,
        stale_threshold_hours: row.stale_threshold_hours,
        updated_at: row.updated_at,
      };
    }

    return c.json({ success: true, data: { settings } });
  } catch (error: any) {
    logError('Error fetching notification settings:', error);
    return c.json({ success: false, message: 'Failed to fetch notification settings' }, 500);
  }
});

// PUT /notifications - Upsert notification settings for current tenant
app.put('/notifications', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const { health_check_cron, daily_email_cron, email_template_id, enabled, stale_threshold_hours } = body;

    const result = await query(
      c.env,
      `INSERT INTO public.notification_settings
         (tenant_id, health_check_cron, daily_email_cron, email_template_id, enabled, stale_threshold_hours, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         health_check_cron = COALESCE(EXCLUDED.health_check_cron, notification_settings.health_check_cron),
         daily_email_cron = COALESCE(EXCLUDED.daily_email_cron, notification_settings.daily_email_cron),
         email_template_id = EXCLUDED.email_template_id,
         enabled = COALESCE(EXCLUDED.enabled, notification_settings.enabled),
         stale_threshold_hours = COALESCE(EXCLUDED.stale_threshold_hours, notification_settings.stale_threshold_hours),
         updated_at = NOW()
       RETURNING *`,
      [
        tenantId,
        health_check_cron || '0 * * * *',
        daily_email_cron || '0 9 * * *',
        email_template_id || null,
        enabled !== undefined ? enabled : true,
        stale_threshold_hours || 2,
      ]
    );

    const row = result.rows[0];
    return c.json({
      success: true,
      data: {
        settings: {
          id: String(row.notification_settings_id),
          health_check_cron: row.health_check_cron,
          daily_email_cron: row.daily_email_cron,
          email_template_id: row.email_template_id ? String(row.email_template_id) : null,
          enabled: row.enabled,
          stale_threshold_hours: row.stale_threshold_hours,
          updated_at: row.updated_at,
        },
      },
    });
  } catch (error: any) {
    logError('Error updating notification settings:', error);
    return c.json({ success: false, message: 'Failed to update notification settings' }, 500);
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
      'SELECT * FROM public.tenant WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Tenant not found' }, 404);
    }

    return c.json({ success: true, data: { company: tenantToSettings(result.rows[0]) } });
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
