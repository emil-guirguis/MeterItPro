/**
 * Settings routes - Hono worker
 */

import { Hono } from 'hono';
import { Env, execQuery } from '../db';

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
      email: tenant.contact_email ?? '',
    },
    systemConfig: {
      timezone: tenant.timezone ?? '',
      dateFormat: tenant.date_format ?? '',
      timeFormat: tenant.time_format ?? '12h',
      currency: tenant.currency ?? '',
      language: tenant.language ?? '',
      defaultPageSize: tenant.default_page_size ?? 20,
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

    const result = await execQuery(
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
    if (body.contactInfo?.url !== undefined)           updateData.url           = body.contactInfo.url;
    if (body.contactInfo?.email !== undefined)         updateData.contact_email = body.contactInfo.email;
    if (body.address?.street !== undefined)         updateData.street  = body.address.street;
    if (body.address?.street2 !== undefined)        updateData.street2 = body.address.street2;
    if (body.address?.city !== undefined)           updateData.city    = body.address.city;
    if (body.address?.state !== undefined)          updateData.state   = body.address.state;
    if (body.address?.zip !== undefined)            updateData.zip     = body.address.zip;
    if (body.address?.country !== undefined)        updateData.country       = body.address.country;
    if (body.systemConfig?.timezone !== undefined)  updateData.timezone      = body.systemConfig.timezone;
    if (body.systemConfig?.dateFormat !== undefined) updateData.date_format  = body.systemConfig.dateFormat;
    if (body.systemConfig?.timeFormat !== undefined) updateData.time_format  = body.systemConfig.timeFormat;
    if (body.systemConfig?.currency !== undefined)  updateData.currency      = body.systemConfig.currency;
    if (body.systemConfig?.language !== undefined)  updateData.language      = body.systemConfig.language;
    if (body.systemConfig?.defaultPageSize !== undefined) updateData.default_page_size = body.systemConfig.defaultPageSize;

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
    const result = await execQuery(c.env, sql, values);

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

// GET / - Legacy endpoint for backward compatibility
app.get('/', requirePermission('settings:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({ success: false, message: 'Tenant ID not found in user context' }, 400);
    }

    const result = await execQuery(
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
