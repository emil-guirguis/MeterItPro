/**
 * Templates routes - Hono worker
 * Basic CRUD via raw SQL. Render/preview/validate return 501.
 */

import { Hono } from 'hono';
import { Env, execQuery } from '../db';

import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { findAll, findById, create, update, remove } from '../crud';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', authenticateToken);

const VALID_CATEGORIES = ['meter_readings', 'meter_errors', 'maintenance', 'general'];

// GET / - Get all templates with filtering and pagination
app.get('/', requirePermission('template:read'), async (c) => {
  try {
    const qs = c.req.query();
    const page = parseInt(qs.page || '1') || 1;
    const limit = parseInt(qs.limit || '25') || 25;
    const tenantId = c.get('tenantId');

    const where: Record<string, any> = {};
    if (qs.category && VALID_CATEGORIES.includes(qs.category)) {
      where.category = qs.category;
    }
    if (qs.isActive !== undefined) {
      where.isactive = qs.isActive === 'true';
    }

    const result = await findAll(c.env, {
      table: 'email_template',
      primaryKey: 'email_template_id',
      tenantId,
      page,
      limit,
      search: qs.search || undefined,
      searchFields: ['name', 'subject'],
      where,
      sortBy: qs.sortBy,
      sortOrder: qs.sortOrder,
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
    logError('Error fetching templates:', error);
    return c.json({ success: false, message: 'Failed to fetch templates' }, 500);
  }
});

// GET /stats - Template statistics
app.get('/stats', requirePermission('template:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const result = await execQuery(
      c.env,
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE isactive = true) as active,
        COUNT(*) FILTER (WHERE isactive = false) as inactive,
        COUNT(DISTINCT category) as categories
       FROM email_template WHERE tenant_id = $1`,
      [tenantId]
    );
    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    logError('Error fetching template stats:', error);
    return c.json({ success: false, message: 'Failed to fetch template statistics' }, 500);
  }
});

// GET /categories - Get available categories
app.get('/categories', requirePermission('template:read'), (c) => {
  return c.json({
    success: true,
    data: VALID_CATEGORIES.map((cat) => ({ value: cat, label: cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) })),
  });
});

// GET /variable-types - Get available variable types
app.get('/variable-types', requirePermission('template:read'), (c) => {
  return c.json({
    success: true,
    data: [
      { value: 'string', label: 'String' },
      { value: 'number', label: 'Number' },
      { value: 'date', label: 'Date' },
      { value: 'boolean', label: 'Boolean' },
      { value: 'array', label: 'Array' },
    ],
  });
});

// GET /search - Search templates
app.get('/search', requirePermission('template:read'), async (c) => {
  try {
    const qs = c.req.query();
    const q = qs.q;
    if (!q) {
      return c.json({ success: false, message: 'Search query is required' }, 400);
    }

    const tenantId = c.get('tenantId');
    const limit = parseInt(qs.limit || '20') || 20;

    let sql = `SELECT * FROM email_template WHERE tenant_id = $1 AND (LOWER(name) LIKE LOWER($2) OR LOWER(subject) LIKE LOWER($2))`;
    const params: any[] = [tenantId, `%${q}%`];
    let paramIdx = 3;

    if (qs.category && VALID_CATEGORIES.includes(qs.category)) {
      sql += ` AND category = $${paramIdx}`;
      params.push(qs.category);
      paramIdx++;
    }

    sql += ` ORDER BY name ASC LIMIT $${paramIdx}`;
    params.push(limit);

    const result = await execQuery(c.env, sql, params);
    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    logError('Error searching templates:', error);
    return c.json({ success: false, message: 'Failed to search templates' }, 500);
  }
});

// GET /export - Export templates as JSON
app.get('/export', requirePermission('template:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const qs = c.req.query();

    let sql = 'SELECT * FROM email_template WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIdx = 2;

    if (qs.category && VALID_CATEGORIES.includes(qs.category)) {
      sql += ` AND category = $${paramIdx}`;
      params.push(qs.category);
      paramIdx++;
    }

    if (qs.includeInactive !== 'true') {
      sql += ' AND isactive = true';
    }

    sql += ' ORDER BY category ASC, name ASC';

    const result = await execQuery(c.env, sql, params);
    let templates = result.rows;

    if (qs.includeDefault === 'false') {
      templates = templates.filter((t: any) => !t.isdefault);
    }

    const exportTemplates = templates.map((t: any) => ({
      name: t.name,
      subject: t.subject,
      content: t.content,
      category: t.category,
      variables: t.variables || [],
    }));

    return c.json({
      success: true,
      data: {
        templates: exportTemplates,
        exportInfo: {
          exportedAt: new Date().toISOString(),
          totalTemplates: exportTemplates.length,
        },
      },
    });
  } catch (error: any) {
    logError('Error exporting templates:', error);
    return c.json({ success: false, message: 'Failed to export templates' }, 500);
  }
});

// GET /usage-analytics - Usage analytics
app.get('/usage-analytics', requirePermission('template:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const result = await execQuery(
      c.env,
      `SELECT email_template_id, name, category, usagecount, lastused
       FROM email_template WHERE tenant_id = $1
       ORDER BY usagecount DESC LIMIT 50`,
      [tenantId]
    );
    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    logError('Error fetching usage analytics:', error);
    return c.json({ success: false, message: 'Failed to fetch usage analytics' }, 500);
  }
});

// GET /category/:category - Get templates by category
app.get('/category/:category', requirePermission('template:read'), async (c) => {
  try {
    const category = c.req.param('category');
    if (!VALID_CATEGORIES.includes(category)) {
      return c.json({ success: false, message: 'Invalid category' }, 400);
    }

    const tenantId = c.get('tenantId');
    const result = await execQuery(
      c.env,
      'SELECT * FROM email_template WHERE tenant_id = $1 AND category = $2 ORDER BY name ASC',
      [tenantId, category]
    );
    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    logError('Error fetching templates by category:', error);
    return c.json({ success: false, message: 'Failed to fetch templates by category' }, 500);
  }
});

// GET /:id/variables - Get template variables
app.get('/:id/variables', requirePermission('template:read'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');

    const template = await findById(c.env, 'email_template', 'email_template_id', id, tenantId);
    if (!template) {
      return c.json({ success: false, message: 'Template not found' }, 404);
    }

    const variables = template.variables || [];
    return c.json({
      success: true,
      data: {
        variables,
        totalVariables: variables.length,
      },
    });
  } catch (error: any) {
    logError('Error fetching template variables:', error);
    return c.json({ success: false, message: 'Failed to fetch template variables' }, 500);
  }
});

// GET /:id - Get specific template
app.get('/:id', requirePermission('template:read'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');

    const template = await findById(c.env, 'email_template', 'email_template_id', id, tenantId);
    if (!template) {
      return c.json({ success: false, message: 'Template not found' }, 404);
    }

    return c.json({ success: true, data: template });
  } catch (error: any) {
    logError('Error fetching template:', error);
    return c.json({ success: false, message: 'Failed to fetch template' }, 500);
  }
});

// POST /validate - Validate template content (501 - complex rendering)
app.post('/validate', requirePermission('template:read'), (c) => {
  return c.json({
    success: false,
    message: 'Template validation not yet supported on this deployment',
  }, 501);
});

// POST /import - Import templates from JSON
app.post('/import', requirePermission('template:create'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const { templates: templatesList, overwrite = false } = await c.req.json();

    if (!Array.isArray(templatesList) || templatesList.length === 0) {
      return c.json({ success: false, message: 'Templates array is required' }, 400);
    }

    const user = c.get('user');
    const results: any[] = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const templateData of templatesList) {
      try {
        const existing = await execQuery(
          c.env,
          'SELECT email_template_id FROM email_template WHERE tenant_id = $1 AND name = $2 LIMIT 1',
          [tenantId, templateData.name]
        );

        if (existing.rows.length > 0) {
          if (overwrite) {
            await update(c.env, 'email_template', 'email_template_id', existing.rows[0].email_template_id, {
              ...templateData,
              tenant_id: tenantId,
            });
            updated++;
            results.push({ name: templateData.name, action: 'updated', success: true });
          } else {
            results.push({ name: templateData.name, action: 'skipped', success: true, reason: 'already_exists' });
          }
        } else {
          await create(c.env, 'email_template', { ...templateData, tenant_id: tenantId });
          created++;
          results.push({ name: templateData.name, action: 'created', success: true });
        }
      } catch (err: any) {
        failed++;
        results.push({ name: templateData.name || 'unknown', action: 'failed', success: false, error: err.message });
      }
    }

    return c.json({
      success: failed === 0,
      data: {
        summary: {
          total: templatesList.length,
          created,
          updated,
          failed,
          skipped: results.filter((r) => r.action === 'skipped').length,
        },
        results,
      },
      message: `Import completed: ${created} created, ${updated} updated, ${failed} failed`,
    });
  } catch (error: any) {
    logError('Error importing templates', error);
    return c.json({ success: false, message: 'Failed to import templates' }, 500);
  }
});

// POST /bulk - Bulk operations
app.post('/bulk', requirePermission('template:update'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const { action, templateIds } = await c.req.json();

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return c.json({ success: false, message: 'Invalid bulk action' }, 400);
    }
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      return c.json({ success: false, message: 'Template IDs array is required' }, 400);
    }

    if (action === 'delete') {
      const user = c.get('user');
      if (user.role !== 'admin' && !(user.permissions?.template?.delete)) {
        return c.json({ success: false, message: 'Delete permission required for bulk delete' }, 403);
      }
    }

    let updatedCount = 0;
    let failedCount = 0;

    for (const id of templateIds) {
      try {
        if (action === 'delete') {
          await remove(c.env, 'email_template', 'email_template_id', id, tenantId);
        } else {
          await update(c.env, 'email_template', 'email_template_id', id, {
            isactive: action === 'activate',
          });
        }
        updatedCount++;
      } catch {
        failedCount++;
      }
    }

    return c.json({
      success: true,
      data: { updated: updatedCount, failed: failedCount },
      message: `Bulk ${action} completed: ${updatedCount} updated, ${failedCount} failed`,
    });
  } catch (error: any) {
    logError('Error performing bulk operation:', error);
    return c.json({ success: false, message: 'Failed to perform bulk operation' }, 500);
  }
});

// POST / - Create new template
app.post('/', requirePermission('template:create'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const user = c.get('user');

    if (!body.name || body.name.length < 3) {
      return c.json({ success: false, message: 'Name must be at least 3 characters' }, 400);
    }
    if (!body.subject) {
      return c.json({ success: false, message: 'Subject is required' }, 400);
    }
    if (!body.content) {
      return c.json({ success: false, message: 'Content is required' }, 400);
    }
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return c.json({ success: false, message: 'Invalid category' }, 400);
    }

    const template = await create(c.env, 'email_template', {
      ...body,
      tenant_id: tenantId,
      created_by: user?.users_id,
    });

    return c.json({ success: true, data: template }, 201);
  } catch (error: any) {
    logError('Error creating template:', error);
    return c.json({ success: false, message: 'Failed to create template' }, 500);
  }
});

// POST /:id/duplicate - Duplicate template
app.post('/:id/duplicate', requirePermission('template:create'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');
    const { name } = await c.req.json();

    if (!name || name.length < 3) {
      return c.json({ success: false, message: 'Name must be at least 3 characters' }, 400);
    }

    const original = await findById(c.env, 'email_template', 'email_template_id', id, tenantId);
    if (!original) {
      return c.json({ success: false, message: 'Template not found' }, 404);
    }

    const user = c.get('user');
    const duplicate = await create(c.env, 'email_template', {
      name,
      subject: original.subject,
      content: original.content,
      category: original.category,
      variables: original.variables,
      tenant_id: tenantId,
      isdefault: false,
      isactive: true,
      usagecount: 0,
      created_by: user?.users_id,
    });

    return c.json({ success: true, data: duplicate, message: 'Template duplicated successfully' }, 201);
  } catch (error: any) {
    logError('Error duplicating template:', error);
    return c.json({ success: false, message: 'Failed to duplicate template' }, 500);
  }
});

// POST /:id/preview - Preview template (501 - complex rendering)
app.post('/:id/preview', requirePermission('template:read'), (c) => {
  return c.json({
    success: false,
    message: 'Template preview not yet supported on this deployment',
  }, 501);
});

// POST /:id/render - Render template (501 - complex rendering)
app.post('/:id/render', requirePermission('template:read'), (c) => {
  return c.json({
    success: false,
    message: 'Template rendering not yet supported on this deployment',
  }, 501);
});

// POST /:id/usage - Record template usage
app.post('/:id/usage', requirePermission('template:read'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');

    const result = await execQuery(
      c.env,
      `UPDATE email_template SET usagecount = COALESCE(usagecount, 0) + 1, lastused = NOW(), updated_at = NOW()
       WHERE email_template_id = $1 AND tenant_id = $2 RETURNING email_template_id, usagecount, lastused`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Template not found' }, 404);
    }

    return c.json({ success: true, data: result.rows[0], message: 'Template usage recorded' });
  } catch (error: any) {
    logError('Error recording template usage:', error);
    return c.json({ success: false, message: 'Failed to record template usage' }, 500);
  }
});

// PUT /:id - Update template
app.put('/:id', requirePermission('template:update'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');
    const body = await c.req.json();

    const existing = await findById(c.env, 'email_template', 'email_template_id', id, tenantId);
    if (!existing) {
      return c.json({ success: false, message: 'Template not found' }, 404);
    }

    // Remove protected fields
    delete body.email_template_id;
    delete body.tenant_id;

    const updated = await update(c.env, 'email_template', 'email_template_id', id, body);
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    logError('Error updating template:', error);
    return c.json({ success: false, message: 'Failed to update template' }, 500);
  }
});

// DELETE /:id - Delete template
app.delete('/:id', requirePermission('template:delete'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');

    const existing = await findById(c.env, 'email_template', 'email_template_id', id, tenantId);
    if (!existing) {
      return c.json({ success: false, message: 'Template not found' }, 404);
    }

    await remove(c.env, 'email_template', 'email_template_id', id, tenantId);
    return c.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    logError('Error deleting template:', error);
    return c.json({ success: false, message: 'Failed to delete template' }, 500);
  }
});

export default app;
