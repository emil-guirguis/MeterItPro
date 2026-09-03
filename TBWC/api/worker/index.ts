/**
 * TBWC API — Cloudflare Worker entry (Hono).
 * Mirrors the MeterItPro worker: CORS, health, and mounted route sub-apps that
 * serve schema JSON + REST CRUD to the shared framework frontend.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, execQuery } from './db';
import { AuthVariables } from './middleware';

import authRoutes from './routes/auth';
import schemaRoutes from './routes/schema';
import userRoutes from './routes/users';
import orderRoutes from './routes/orders';
import inventoryRoutes from './routes/inventory';
import quoteRoutes from './routes/quotes';
import customerRoutes from './routes/customers';
import qbwcRoutes from './routes/qbwc';
import qbSyncRoutes from './routes/qbSync';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

function allowedOrigins(env: Env): string[] {
  const fe = env.FRONTEND_URL || 'http://localhost:5174';
  return fe.split(',').map((s) => s.trim());
}

app.use('*', cors({
  origin: (origin, c) => {
    const allowed = allowedOrigins(c.env);
    if (!origin) return allowed[0];
    return allowed.includes(origin) ? origin : allowed[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.onError((err, c) => {
  console.error('[TBWC WORKER] Unhandled error:', err);
  return c.json({ success: false, message: 'Internal server error' }, 500);
});

app.get('/api/health', async (c) => {
  try {
    const r = await execQuery(c.env, 'SELECT NOW()');
    return c.json({ status: 'OK', database: 'Connected', serverTime: r.rows[0].now });
  } catch (e: any) {
    return c.json({ status: 'Error', message: e.message }, 500);
  }
});

app.route('/api/auth', authRoutes);
app.route('/api/schema', schemaRoutes);
app.route('/api/users', userRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/quotes', quoteRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/qb-sync', qbSyncRoutes);
// QuickBooks Web Connector SOAP endpoint (no Supabase auth — QBWC is not a browser
// and authenticates with its own username/password inside the SOAP body).
app.route('/qbwc', qbwcRoutes);

export default app;
