/**
 * Auth routes. Login itself is done client-side via the Supabase Auth REST API;
 * this only exposes the authenticated caller's tbwc profile.
 * GET /api/auth/me -> { success: true, data: <user profile> }
 */
import { Hono } from 'hono';
import { Env } from '../db';
import { AuthVariables, authenticateToken } from '../middleware';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

app.get('/me', (c) => {
  return c.json({ success: true, data: c.get('user') });
});

export default app;
