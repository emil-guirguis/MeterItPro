/**
 * MeterIt Pro API - Cloudflare Worker Entry Point
 *
 * Hono-based API server deployed on Cloudflare Workers.
 * Mounts all route sub-apps and shared middleware.
 */

import { Hono } from 'hono';
import { runAllActiveReports } from './reportRunner';
import { runAllActiveNotificationRules } from './notificationRunner';
import { cors } from 'hono/cors';
import { Env, execQuery } from './db';

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
import registerRoutes, { deviceRegistersApp, meterRegistersApp } from './routes/registers';
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
    const result = await execQuery(c.env, 'SELECT NOW()');
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

app.route('/api/meters/:meterId/elements', meterElementRoutes);
app.route('/api/devices/:deviceId/registers', deviceRegistersApp);
app.route('/api/meters/:meterId/registers', meterRegistersApp);

// --- Catch-all ---

app.all('*', (c) => {
  return c.json({ success: false, message: 'Route not found' }, 404);
});

// --- Cron trigger (Cloudflare scheduled event) --------------------------------
// Runs every hour per wrangler.toml [triggers] crons setting.
// Executes all active reports whose schedule matches the current time.

export default {
  fetch: app.fetch,
  async scheduled(_event: { scheduledTime: number }, env: Env, ctx: { waitUntil(p: Promise<any>): void }) {
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
