/**
 * Devices READ-ONLY routes - Hono worker
 *
 * NOTE: Device module is READ-ONLY.
 * CREATE, UPDATE, DELETE operations have been removed.
 * Devices are managed externally and should not be modified through this API.
 */

import { Hono } from 'hono';
import { query, transaction, Env } from '../db';
import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { findAll, findById, create, update, remove } from '../crud';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// All routes require authentication
app.use('*', authenticateToken);

// --- Routes ---

// Get all devices with filtering and pagination
app.get('/', requirePermission('device:read'), async (c) => {
  try {
    const { page = '1', limit = '25', search } = c.req.query();
    const tenantId = c.get('tenantId');

    const result = await findAll(c.env, {
      table: 'device',
      primaryKey: 'device_id',
      tenantId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search || undefined,
      searchFields: ['description'],
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
    console.error('Error fetching devices:', error);
    return c.json({ success: false, message: 'Failed to fetch devices' }, 500);
  }
});

// Get single device by ID
app.get('/:id', requirePermission('device:read'), async (c) => {
  try {
    const id = c.req.param('id');
    const tenantId = c.get('tenantId');
    const device = await findById(c.env, 'device', 'device_id', id, tenantId);
    if (!device) {
      return c.json({ success: false, message: 'Device not found' }, 404);
    }
    return c.json({ success: true, data: device });
  } catch (error: any) {
    console.error('Error fetching device:', error);
    return c.json({ success: false, message: 'Failed to fetch device' }, 500);
  }
});

export default app;
