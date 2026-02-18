import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

// GET /api/devices/:deviceId/registers
// Note: deviceId comes from the parent route param
app.get('/', async (c) => {
  try {
    const deviceId = c.req.param('deviceId');

    const deviceResult = await query(c.env,
      'SELECT device_id FROM device WHERE device_id = $1', [deviceId]
    );
    if (deviceResult.rows.length === 0) {
      return c.json({ success: false, message: 'Device not found' }, 404);
    }

    const result = await query(c.env,
      `SELECT dr.device_register_id, dr.device_id, dr.register_id,
              r.register, r.name, r.unit, r.field_name
       FROM device_register dr
       JOIN register r ON dr.register_id = r.register_id
       WHERE dr.device_id = $1
       ORDER BY r.register ASC`,
      [deviceId]
    );

    const data = result.rows.map((row: any) => ({
      device_register_id: row.device_register_id,
      register_id: row.register_id,
      device_id: row.device_id,
      register: {
        id: row.device_register_id,
        register: row.register,
        name: row.name,
        unit: row.unit,
        field_name: row.field_name,
      },
    }));

    return c.json({ success: true, data });
  } catch (error: any) {
    logError('Error fetching device registers:', error);
    return c.json({ success: false, message: 'Failed to fetch device registers' }, 500);
  }
});

export default app;
