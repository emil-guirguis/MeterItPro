/**
 * MeterIt Pro API - Cloudflare Worker Entry Point
 *
 * Hono-based API server deployed on Cloudflare Workers.
 * Mounts all route sub-apps and shared middleware.
 */

// Prepend HH:MM:SS timestamp to every console log line in wrangler dev output
const _origLog = console.log.bind(console);
const _origWarn = console.warn.bind(console);
const _origError = console.error.bind(console);
const _ts = () => new Date().toTimeString().slice(0, 8);
console.log   = (...a) => _origLog  (`[${_ts()}]`, ...a);
console.warn  = (...a) => _origWarn (`[${_ts()}]`, ...a);
console.error = (...a) => _origError(`[${_ts()}]`, ...a);

import { Hono } from 'hono';
import { runAllActiveReports } from './reportRunner';
import { runAllActiveNotificationRules } from './notificationRunner';
import { cors } from 'hono/cors';
import { query, Env } from './db';
import { AuthVariables, authenticateToken } from './middleware';

// Import route modules
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import meterRoutes from './routes/meters';
import locationRoutes from './routes/locations';
import contactRoutes from './routes/contacts';
import deviceRoutes from './routes/devices';
import meterReadingRoutes from './routes/meterReadings';
import meterElementRoutes from './routes/meterElements';
import settingsRoutes from './routes/settings';
import templateRoutes from './routes/templates';
import emailRoutes from './routes/emails';
import syncRoutes from './routes/sync';
import schemaRoutes from './routes/schema';
import dashboardRoutes from './routes/dashboard';
import favoriteRoutes from './routes/favorites';
import reportRoutes from './routes/reports';
import notificationRoutes from './routes/notifications';
import notificationRulesRoutes from './routes/notificationRules';
import notificationHistoryRoutes from './routes/notificationHistory';
import emailLogRoutes from './routes/emailLogs';
import aiSearchRoutes from './routes/aiSearch';
import aiChatRoutes from './routes/aiChat';
import registerRoutes from './routes/registers';
import deviceRegisterRoutes from './routes/deviceRegisters';
import uploadRoutes from './routes/upload';

export const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// --- CORS ---

// Helper to get allowed origins from env
function getAllowedOrigins(env: Env): string[] {
  const frontendUrl = env.FRONTEND_URL || 'https://meteritpro.com';
  return frontendUrl.split(',').map((s: string) => s.trim());
}

app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = getAllowedOrigins(c.env);

    if (!origin) {
      return allowedOrigins[0];
    }

    const isAllowed = allowedOrigins.includes(origin);
    return isAllowed ? origin : allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  exposeHeaders: ['Content-Range', 'X-Content-Range'],
}));

// --- Global error handler (ensures CORS headers on unhandled errors) ---

app.onError((err, c) => {
  console.error('[WORKER] Unhandled error:', err);
  console.error('[WORKER] Error type:', err?.constructor?.name);
  console.error('[WORKER] Error message:', err?.message);
  
  // Ensure CORS headers are included in error responses
  const response = c.json({ success: false, message: 'Internal server error' }, 500);
  
  // Add CORS headers manually if needed
  const frontendUrl = c.env.FRONTEND_URL || 'https://meteritpro.com';
  const allowedOrigins = frontendUrl.split(',').map((s: string) => s.trim());
  const origin = c.req.header('origin');

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
});

// --- Health check ---

app.get('/api/health', async (c) => {
  try {
    const result = await query(c.env, 'SELECT NOW()');
    return c.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      serverTime: result.rows[0].now,
    });
  } catch (error: any) {
    return c.json({
      status: 'Error',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message,
    }, 500);
  }
});

// --- API Documentation ---

// Serve Swagger UI HTML
app.get('/swagger', (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MeterIt Pro Client API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css">
        <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/favicon-16x16.png" sizes="16x16" />
        <style>
          html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
          }
          *,
          *:before,
          *:after {
            box-sizing: inherit;
          }
          body {
            margin: 0;
            background: #fafafa;
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            window.ui = SwaggerUIBundle({
              urls: [ { url: "/swagger/spec.json", name: "MeterIt Pro Client API" } ],
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout"
            });
          };
        </script>
      </body>
    </html>
  `;
  return c.html(html);
});

// Serve OpenAPI spec
app.get('/swagger/spec.json', (c) => {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'MeterIt Pro Client API',
      version: '1.0.0',
      description: 'Cloudflare Workers-based API for MeterIt Pro',
    },
    servers: [
      { url: 'https://meteritpro.com/api', description: 'Production' },
      { url: 'http://localhost:8787/api', description: 'Local development' },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['Health'],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/auth/login': {
        post: {
          summary: 'User login',
          tags: ['Auth'],
          responses: { 200: { description: 'Login successful' }, 401: { description: 'Invalid credentials' } },
        },
      },
      '/users/me': {
        get: {
          summary: 'Get current user',
          tags: ['Users'],
          responses: { 200: { description: 'User data' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/meters': {
        get: {
          summary: 'List meters',
          tags: ['Meters'],
          responses: { 200: { description: 'List of meters' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/sync/connect': {
        post: {
          summary: 'Connect sync client',
          tags: ['Sync'],
          responses: { 200: { description: 'Connected' }, 401: { description: 'Invalid credentials' } },
        },
      },
    },
  };
  return c.json(spec);
});

// --- Mount route sub-apps ---

app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/meters', meterRoutes);
app.route('/api/location', locationRoutes);
app.route('/api/contacts', contactRoutes);
app.route('/api/device', deviceRoutes);
app.route('/api/meterreadings', meterReadingRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/templates', templateRoutes);
app.route('/api/emails', emailRoutes);
app.route('/api/sync', syncRoutes);
app.route('/api/schema', schemaRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/favorites', favoriteRoutes);
app.route('/api/ai/search', aiSearchRoutes);
app.route('/api/ai/chat', aiChatRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/notification-rules', notificationRulesRoutes);
app.route('/api/notification-history', notificationHistoryRoutes);
app.route('/api/email-logs', emailLogRoutes);
app.route('/api/registers', registerRoutes);
app.route('/api/upload', uploadRoutes);

// Meter elements and device registers use nested param paths
// In Express: /api/meters/:meterId/elements and /api/devices/:deviceId/registers
// In Hono: mount as sub-routes
app.route('/api/meters/:meterId/elements', meterElementRoutes);

// Direct route handler for device registers to ensure proper param access in Hono
app.get('/api/devices/:deviceId/registers', authenticateToken, async (c) => {
  const deviceId = c.req.param('deviceId');
  console.log('[direct-route] Device registers direct route - deviceId:', deviceId);
  if (!deviceId) {
    return c.json({ success: false, message: 'Device ID is required' }, 400);
  }

  try {
    const deviceResult = await query(c.env,
      'SELECT device_id FROM device WHERE device_id = $1', [deviceId]
    );
    if (deviceResult.rows.length === 0) {
      return c.json({ success: false, message: 'Device not found' }, 404);
    }

    const result = await query(c.env,
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
    console.error('[direct-route] Error fetching device registers:', error);
    return c.json({ success: false, message: 'Failed to fetch device registers' }, 500);
  }
});

// Route handler for meter registers (meter_id instead of device_id)
// Fetches device registers associated with a meter via the meter's device_id relationship
app.get('/api/meters/:meterId/registers', authenticateToken, async (c) => {
  const meterId = c.req.param('meterId');
  console.log('[meter-registers] Fetching registers for meter:', meterId);
  if (!meterId) {
    return c.json({ success: false, message: 'Meter ID is required' }, 400);
  }

  try {
    // Get the device_id associated with this meter
    const meterResult = await query(c.env,
      'SELECT device_id FROM meter WHERE meter_id = $1', [meterId]
    );
    if (meterResult.rows.length === 0) {
      return c.json({ success: false, message: 'Meter not found' }, 404);
    }

    const deviceId = meterResult.rows[0].device_id;
    if (!deviceId) {
      // Meter exists but has no device_id
      return c.json({ success: true, data: [] });
    }

    // Get registers for the device associated with this meter.
    // Also includes computed registers (register = 0) from the register table
    // regardless of device_register assignment, as they apply to all devices.
    const result = await query(c.env,
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
    console.error('[meter-registers] Error fetching meter registers:', error);
    return c.json({ success: false, message: 'Failed to fetch meter registers' }, 500);
  }
});

// --- Catch-all ---

app.all('*', (c) => {
  return c.json({ success: false, message: 'Route not found' }, 404);
});

// ─── Cron trigger (Cloudflare scheduled event) ────────────────────────────────
// Runs every hour per wrangler.toml [triggers] crons setting.
// Executes all active reports whose schedule matches the current time.

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const now = new Date(_event.scheduledTime);
    ctx.waitUntil(Promise.all([
      runAllActiveReports(env, now).catch(err =>
        console.error('[cron] runAllActiveReports failed:', err instanceof Error ? err.message : err)
      ),
      runAllActiveNotificationRules(env, now).catch(err =>
        console.error('[cron] runAllActiveNotificationRules failed:', err instanceof Error ? err.message : err)
      ),
    ]));
  },
};
