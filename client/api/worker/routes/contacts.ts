/**
 * Contacts CRUD routes - Hono worker
 */

import { Hono } from 'hono';
import { Env, execQuery } from '../db';

import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { findAll, findById, create, update, remove } from '../crud';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// All routes require authentication
app.use('*', authenticateToken);

// --- Routes ---

// IMPORTANT: /stats/overview must come BEFORE /:id to avoid matching "stats" as an ID
// Get contact statistics
app.get('/stats/overview', requirePermission('contact:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');

    // Overview stats using SQL aggregation
    const overviewResult = await execQuery(
      c.env,
      `SELECT
        COUNT(*) as "totalContacts",
        COUNT(*) FILTER (WHERE type = 'customer') as "customers",
        COUNT(*) FILTER (WHERE type = 'vendor') as "vendors",
        COUNT(*) FILTER (WHERE active = true) as "activeContacts",
        COUNT(*) FILTER (WHERE active = false) as "inactiveContacts"
      FROM contact
      WHERE tenant_id = $1`,
      [tenantId]
    );

    // Top industries
    const industryResult = await execQuery(
      c.env,
      `SELECT industry as "_id", COUNT(*) as count
      FROM contact
      WHERE tenant_id = $1 AND industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 10`,
      [tenantId]
    );

    const overview = overviewResult.rows[0] || {
      totalContacts: 0,
      customers: 0,
      vendors: 0,
      activeContacts: 0,
      inactiveContacts: 0,
    };

    return c.json({
      success: true,
      data: {
        overview: {
          totalContacts: parseInt(overview.totalContacts, 10),
          customers: parseInt(overview.customers, 10),
          vendors: parseInt(overview.vendors, 10),
          activeContacts: parseInt(overview.activeContacts, 10),
          inactiveContacts: parseInt(overview.inactiveContacts, 10),
        },
        topIndustries: industryResult.rows,
      },
    });
  } catch (error: any) {
    logError('Error fetching contact stats', error);
    return c.json({ success: false, message: 'Failed to fetch contact statistics' }, 500);
  }
});

// Get all contacts with filtering and pagination
app.get('/', requirePermission('contact:read'), async (c) => {
  try {
    const qs = c.req.query();
    const tenantId = c.get('tenantId');

    // Build where conditions from filter params
    const where: Record<string, any> = {};
    if (qs.active !== undefined && qs.active !== '') {
      where.active = qs.active === 'true';
    }
    if (qs.role) {
      where.role = qs.role;
    }

    const result = await findAll(c.env, {
      table: 'contact',
      primaryKey: 'contact_id',
      tenantId,
      page: parseInt(qs.page || '1', 10),
      limit: parseInt(qs.limit || '25', 10),
      search: qs.search || undefined,
      searchFields: ['name', 'email', 'company'],
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder,
      where,
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
    logError('Error fetching contacts', error);
    return c.json({ success: false, message: 'Failed to fetch contacts' }, 500);
  }
});

// Get single contact by ID
app.get('/:id', requirePermission('contact:read'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');
    const contact = await findById(c.env, 'contact', 'contact_id', id, tenantId);
    if (!contact) {
      return c.json({ success: false, message: 'Contact not found' }, 404);
    }
    return c.json({ success: true, data: contact });
  } catch (error: any) {
    logError('Error fetching contact', error);
    return c.json({ success: false, message: 'Failed to fetch contact' }, 500);
  }
});

// Create contact
app.post('/', requirePermission('contact:create'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) {
      return c.json({
        success: false,
        message: 'User must have a valid tenant_id to create contacts',
      }, 400);
    }

    const body = await c.req.json();
    const contactData: Record<string, any> = {
      ...body,
      tenant_id: tenantId,
    };

    const contact = await create(c.env, 'contact', contactData);
    return c.json({ success: true, data: contact }, 201);
  } catch (error: any) {
    logError('Error creating contact', error);
    return c.json({ success: false, message: 'Failed to create contact' }, 500);
  }
});

// Update contact
app.put('/:id', requirePermission('contact:update'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');

    // Find the contact first (findById already filters by tenantId)
    const contact = await findById(c.env, 'contact', 'contact_id', id, tenantId);
    if (!contact) {
      return c.json({ success: false, message: 'Contact not found' }, 404);
    }

    const body = await c.req.json();
    const updateData: Record<string, any> = { ...body };

    // Remove tenant_id from update data - it cannot be changed
    delete updateData.tenant_id;

    const updated = await update(c.env, 'contact', 'contact_id', id, updateData);
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    logError('Error updating contact', error);
    return c.json({ success: false, message: 'Failed to update contact' }, 500);
  }
});

// Delete contact
app.delete('/:id', requirePermission('contact:delete'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');

    const contact = await findById(c.env, 'contact', 'contact_id', id, tenantId);
    if (!contact) {
      return c.json({ success: false, message: 'Contact not found' }, 404);
    }

    await remove(c.env, 'contact', 'contact_id', id, tenantId);
    return c.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error: any) {
    logError('Error deleting contact', error);
    return c.json({ success: false, message: 'Failed to delete contact' }, 500);
  }
});

export default app;
