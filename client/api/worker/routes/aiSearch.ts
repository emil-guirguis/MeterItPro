import { Hono } from 'hono';
import { Env, execQuery } from '../db';

import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { query: searchQuery, limit = 20, offset = 0 } = body;
    const tenantId = c.get('tenantId');

    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
      return c.json({ success: false, error: { code: 'INVALID_QUERY', message: 'Query is required and must be a non-empty string' } }, 400);
    }
    if (!Number.isInteger(limit) || limit <= 0) {
      return c.json({ success: false, error: { code: 'INVALID_LIMIT', message: 'Limit must be a positive integer' } }, 400);
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return c.json({ success: false, error: { code: 'INVALID_OFFSET', message: 'Offset must be a non-negative integer' } }, 400);
    }

    const startTime = Date.now();

    const devicesResult = await execQuery(c.env,
      `SELECT device_id as id, tenant_id as "tenantId", name, type, location, status, metadata
       FROM public.device WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId]);
    const devices: any[] = devicesResult.rows || [];

    if (devices.length === 0) {
      return c.json({ success: true, data: { results: [], total: 0, clarifications: [], executionTime: Date.now() - startTime } });
    }

    const metersResult = await execQuery(c.env,
      `SELECT meter_id as id, tenant_id as "tenantId", device_id as "deviceId", name, unit, type
       FROM public.meter WHERE tenant_id = $1`, [tenantId]);
    const meters: any[] = metersResult.rows || [];

    const readingsResult = await execQuery(c.env,
      `SELECT mr.meter_id as "meterId", mr.value, mr.timestamp, mr.quality
       FROM public.meter_reading mr WHERE mr.tenant_id = $1 AND mr.timestamp >= NOW() - INTERVAL '30 days'
       ORDER BY mr.meter_id, mr.timestamp DESC`, [tenantId]);
    const readings: any[] = readingsResult.rows || [];

    const readingsByDevice = new Map<number, any[]>();
    devices.forEach((device) => {
      const deviceReadings = readings.filter((r) => {
        const meter = meters.find((m) => m.id === r.meterId);
        return meter && meter.deviceId === device.id;
      });
      readingsByDevice.set(device.id, deviceReadings || []);
    });

    const queryLower = searchQuery.toLowerCase();
    const scoredDevices = devices
      .map((device) => {
        let score = 0;
        const nameLower = device.name.toLowerCase();
        if (nameLower === queryLower) score += 10;
        else if (nameLower.includes(queryLower)) score += 5;
        if (device.type && device.type.toLowerCase().includes(queryLower)) score += 3;
        if (device.location && device.location.toLowerCase().includes(queryLower)) score += 2;
        if (device.status && device.status.toLowerCase().includes(queryLower)) score += 1;
        return { device, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const results = [];
    for (let i = offset; i < Math.min(offset + limit, scoredDevices.length); i++) {
      const { device, score } = scoredDevices[i];
      const deviceReadings = readingsByDevice.get(device.id) || [];
      const latestReading = deviceReadings.length > 0 ? deviceReadings[0] : { value: 0, timestamp: new Date().toISOString() };
      results.push({
        id: device.id, name: device.name, type: 'device',
        location: device.location || 'Unknown', currentConsumption: latestReading.value || 0,
        unit: 'kWh', status: device.status || 'unknown',
        relevanceScore: Math.min(score / 10, 1.0),
        lastReading: { value: latestReading.value || 0, timestamp: latestReading.timestamp || new Date().toISOString() },
      });
    }

    return c.json({ success: true, data: { results, total: devices.length, clarifications: [], executionTime: Date.now() - startTime } });
  } catch (error: any) {
    console.error('[AI_SEARCH] Error:', error.message);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred while processing your search' } }, 500);
  }
});

export default app;
