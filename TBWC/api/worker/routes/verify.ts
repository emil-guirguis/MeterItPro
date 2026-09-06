/**
 * Public re-verification endpoint — the link mailed by reverification.ts.
 * Unauthenticated by design: the token itself is the credential, same as the
 * rep_leads invite-link flow.
 * GET /api/verify?token=... -> { success, status: 'ok'|'invalid'|'expired' }
 */
import { Hono } from 'hono';
import { Env } from '../db';
import { consumeVerifyToken } from '../reverification';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ success: false, message: 'Missing token' }, 400);

  const status = await consumeVerifyToken(c.env, token);
  if (status === 'invalid') return c.json({ success: false, status, message: 'Invalid verification link' }, 404);
  if (status === 'expired') return c.json({ success: false, status, message: 'Verification link has expired' }, 410);
  return c.json({ success: true, status });
});

export default app;
