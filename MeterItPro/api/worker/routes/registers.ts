import { Hono } from 'hono';
import { Env, execQuery } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

// GET /api/registers
const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

app.get('/', async (c) => {
  try {
    const result = await execQuery(c.env,
      `SELECT register_id, register, name, unit, field_name, description FROM register ORDER BY register ASC`
    );
    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    logError('Error fetching registers:', error);
    return c.json({ success: false, message: 'Failed to fetch registers' }, 500);
  }
});

// GET /api/devices/:deviceId/registers
export const deviceRegistersApp = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
deviceRegistersApp.use('*', authenticateToken);

deviceRegistersApp.get('/', async (c) => {
  const deviceId = c.req.param('deviceId');
  if (!deviceId) {
    return c.json({ success: false, message: 'Device ID is required' }, 400);
  }
  try {
    const deviceResult = await execQuery(c.env,
      'SELECT device_id FROM device WHERE device_id = $1', [deviceId]
    );
    if (deviceResult.rows.length === 0) {
      return c.json({ success: false, message: 'Device not found' }, 404);
    }
    const result = await execQuery(c.env,
      `SELECT dr.device_register_id, dr.device_id, dr.register_id,
              r.register, r.name, r.unit, r.field_name, r.description
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
        description: row.description,
      },
    }));
    return c.json({ success: true, data });
  } catch (error: any) {
    logError('Error fetching device registers:', error);
    return c.json({ success: false, message: 'Failed to fetch device registers' }, 500);
  }
});

// GET /api/meters/:meterId/registers
export const meterRegistersApp = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
meterRegistersApp.use('*', authenticateToken);

meterRegistersApp.get('/', async (c) => {
  const meterId = c.req.param('meterId');
  if (!meterId) {
    return c.json({ success: false, message: 'Meter ID is required' }, 400);
  }
  try {
    const meterResult = await execQuery(c.env,
      'SELECT device_id FROM meter WHERE meter_id = $1', [meterId]
    );
    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }
    const deviceId = meterResult.rows[0].device_id;
    if (!deviceId) {
      return c.json({ success: true, data: [] });
    }
    const result = await execQuery(c.env,
      `SELECT dr.device_register_id as id, dr.device_id, dr.register_id,
              r.register, r.name, r.unit, r.field_name
       FROM device_register dr
       JOIN register r ON dr.register_id = r.register_id
       WHERE dr.device_id = $1
       UNION
       SELECT NULL as id, NULL as device_id, r.register_id,
              r.register, r.name, r.unit, r.field_name
       FROM register r
       WHERE r.register = 0
       ORDER BY register ASC`,
      [deviceId]
    );
    const data = result.rows.map((row: any) => ({
      id: row.id,
      device_id: row.device_id,
      register_id: row.register_id,
      register: {
        id: row.id,
        register: row.register,
        name: row.name,
        unit: row.unit,
        field_name: row.field_name,
      },
    }));
    return c.json({ success: true, data });
  } catch (error: any) {
    logError('Error fetching meter registers:', error);
    return c.json({ success: false, message: 'Failed to fetch meter registers' }, 500);
  }
});

export default app;
