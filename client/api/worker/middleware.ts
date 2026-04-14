/**
 * Shared middleware for Cloudflare Worker
 * JWT auth, tenant context, and permission checks.
 */

import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { query, Env } from './db';

// Module-level cache shared within a Worker isolate.
// Avoids a DB round-trip on every authenticated request when the same user
// fires multiple parallel API calls (e.g., on page load).
const userCache = new Map<string, { user: any; expiresAt: number }>();
// In-flight promise per userId: concurrent requests share one DB query instead
// of each firing their own (race condition when cache is cold on page load).
const userFetchPromises = new Map<string, Promise<any | null>>();
const USER_CACHE_TTL_MS = 5 * 60_000; // 5 minutes

export async function getCachedUser(env: Env, userId: string): Promise<any | null> {
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  // Deduplicate concurrent requests: return the in-flight promise if one exists.
  const existing = userFetchPromises.get(userId);
  if (existing) return existing;

  const fetchPromise = query(
    env,
    `SELECT users_id, name, email, phone, role, active, tenant_id, permissions
     FROM users WHERE users_id = $1`,
    [userId]
  ).then((result) => {
    userFetchPromises.delete(userId);
    if (result.rows.length === 0) return null;
    const user = result.rows[0];
    userCache.set(userId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
    console.log('[AUTH] User loaded from DB:', userId);
    return user;
  }).catch((err) => {
    userFetchPromises.delete(userId);
    throw err;
  });

  userFetchPromises.set(userId, fetchPromise);
  return fetchPromise;
}

// Hono context variables set by middleware
export type AuthVariables = {
  user: any;
  tenantId: number;
};

/**
 * JWT authentication middleware
 *
 * Validates the token and sets context from JWT claims only — no DB query.
 * Both userId and tenant_id are embedded in the token at sign time, so polling
 * endpoints like /notifications/count never touch the users table.
 *
 * The DB lookup (cached) is deferred to requirePermission(), which is the only
 * place that actually needs role and permissions.
 */
export async function authenticateToken(c: Context<{ Bindings: Env; Variables: AuthVariables }>, next: Next) {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({ success: false, message: 'Access token required' }, 401);
  }

  let decoded: any;
  try {
    decoded = await verify(token, c.env.JWT_SECRET, 'HS256');
  } catch (err: any) {
    if (err.message?.includes('expired') || err.name === 'JwtTokenExpired') {
      return c.json({ success: false, message: 'Token expired' }, 401);
    }
    return c.json({ success: false, message: 'Invalid token' }, 401);
  }

  if (!decoded.userId || !decoded.tenant_id) {
    return c.json({ success: false, message: 'Invalid token - missing claims' }, 401);
  }

  // Minimal user object from JWT claims — no DB round-trip.
  // Routes that need full user data (role, permissions, name, email) call
  // requirePermission(), which does the cached DB lookup lazily.
  c.set('user', { users_id: decoded.userId, tenant_id: decoded.tenant_id });
  c.set('tenantId', decoded.tenant_id);
  await next();
}

/**
 * Permission check middleware factory.
 * Usage: requirePermission('meter:read')
 *
 * This is where the DB lookup happens — lazily and cached. Routes that don't
 * call requirePermission() never hit the users table.
 */
export function requirePermission(permission: string) {
  return async (c: Context<{ Bindings: Env; Variables: AuthVariables }>, next: Next) => {
    const partial = c.get('user');
    if (!partial) {
      return c.json({ success: false, message: 'Authentication required' }, 401);
    }

    // Load full user (cached) to get role, permissions, and active flag.
    let user: any;
    try {
      user = await getCachedUser(c.env, String(partial.users_id));
      if (!user) {
        return c.json({ success: false, message: 'User not found' }, 401);
      }
    } catch (e) {
      console.error('[AUTH] User lookup error in requirePermission:', e);
      return c.json({ success: false, message: 'Failed to verify user' }, 500);
    }

    if (!user.active) {
      return c.json({ success: false, message: 'Account is inactive' }, 401);
    }

    // Promote context to full user so downstream handlers can read name/email/etc.
    c.set('user', user);

    // Admin bypasses permission checks
    if (user.role === 'admin') {
      return next();
    }

    // Parse permission string like "meter:read"
    const [module, action] = permission.split(':');
    const perms = user.permissions;

    // Handle array format: ["dashboard:read", "meter:read"]
    if (Array.isArray(perms)) {
      if (perms.includes(permission)) {
        return next();
      }
    }
    // Handle nested object format: { dashboard: { read: true } }
    else if (perms && typeof perms === 'object' && perms[module] && perms[module][action]) {
      return next();
    }

    return c.json({ success: false, message: 'Insufficient permissions' }, 403);
  };
}

/**
 * API key authentication for sync routes.
 */
export async function authenticateSyncServer(c: Context<{ Bindings: Env; Variables: AuthVariables }>, next: Next) {
  const apiKey = c.req.header('x-api-key');
  if (!apiKey) {
    return c.json({ success: false, message: 'API key required' }, 401);
  }

  const result = await query(
    c.env,
    'SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true',
    [apiKey]
  );

  if (result.rows.length === 0) {
    return c.json({ success: false, message: 'Invalid API key' }, 401);
  }

  c.set('tenantId', result.rows[0].tenant_id);
  await next();
}
