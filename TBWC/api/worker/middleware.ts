/**
 * Auth middleware for the TBWC Worker.
 * Validates the Supabase access token, loads the caller's tbwc profile,
 * and exposes both on the Hono context.
 */
import { Context, Next } from 'hono';
import { Env, execQuery } from './db';
import { verifySupabaseToken } from './supabaseVerify';

export type AuthVariables = {
  userId: string;
  user: any;
  requestId: string;
};

// Short-lived isolate cache of tbwc profiles keyed by user id.
const profileCache = new Map<string, { user: any; expiresAt: number }>();
const PROFILE_TTL_MS = 60_000;

export async function loadProfile(env: Env, userId: string): Promise<any | null> {
  const now = Date.now();
  const cached = profileCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.user;

  const result = await execQuery(
    env,
    `SELECT id, email, first_name, last_name, agency_name, url, title, work_phone, ext, mobile,
            addr1, addr2, city, state, postal, about, approved, is_admin, type,
            can_see_orders, can_approve_rep_leads, created_at
     FROM public.users WHERE id = $1`,
    [userId],
    'loadProfile'
  );
  if (result.rows.length === 0) return null;
  const user = result.rows[0];
  profileCache.set(userId, { user, expiresAt: now + PROFILE_TTL_MS });
  return user;
}

export async function authenticateToken(
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return c.json({ success: false, message: 'Access token required' }, 401);

  const verified = await verifySupabaseToken(c.env, token);
  if (!verified) return c.json({ success: false, message: 'Invalid or expired token' }, 401);

  const profile = await loadProfile(c.env, verified.userId);
  if (!profile) return c.json({ success: false, message: 'No user profile found' }, 403);
  if (!profile.approved) return c.json({ success: false, message: 'Account pending approval' }, 403);

  c.set('userId', verified.userId);
  c.set('user', profile);
  await next();
}

/** Guard that requires the caller to be an admin (is_admin). */
export async function requireAdmin(
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next
): Promise<Response | void> {
  const user = c.get('user');
  if (!user?.is_admin) return c.json({ success: false, message: 'Admin access required' }, 403);
  await next();
}
