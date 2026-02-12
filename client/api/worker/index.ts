/**
 * MeterIt Pro API - Cloudflare Worker Entry Point
 *
 * Hono-based API server deployed on Cloudflare Workers.
 * Mounts all route sub-apps and shared middleware.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { query, Env } from './db';
import { AuthVariables } from './middleware';

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
import emailLogRoutes from './routes/emailLogs';
import aiSearchRoutes from './routes/aiSearch';
import registerRoutes from './routes/registers';
import deviceRegisterRoutes from './routes/deviceRegisters';
import uploadRoutes from './routes/upload';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// --- CORS ---

app.use('*', async (c, next) => {
  const allowedOrigins = c.env.FRONTEND_URL
    ? c.env.FRONTEND_URL.split(',')
    : ['http://localhost:5173'];

  const origin = c.req.header('origin') || '';
  const isAllowed = !origin || allowedOrigins.includes(origin);

  return cors({
    origin: isAllowed ? origin : allowedOrigins[0],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    exposeHeaders: ['Content-Range', 'X-Content-Range'],
  })(c, next);
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
app.route('/api/reports', reportRoutes);
app.route('/api/email-logs', emailLogRoutes);
app.route('/api/registers', registerRoutes);
app.route('/api/upload', uploadRoutes);

// Meter elements and device registers use nested param paths
// In Express: /api/meters/:meterId/elements and /api/devices/:deviceId/registers
// In Hono: mount as sub-routes
app.route('/api/meters/:meterId/elements', meterElementRoutes);
app.route('/api/devices/:deviceId/registers', deviceRegisterRoutes);

// --- Catch-all ---

app.all('*', (c) => {
  return c.json({ success: false, message: 'Route not found' }, 404);
});

export default app;
