/**
 * Shared middleware for Cloudflare Worker
 * JWT auth, tenant context, and permission checks.
 */

import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { query, Env } from './db';

// Hono context variables set by middleware
export type AuthVariables = {
  user: any;
  tenantId: number;
};

/**
 * JWT authentication middleware
 * Verifies token and attaches user + tenantId to context.
 */
export async function authenticateToken(c: Context<{ Bindings: Env; Variables: AuthVariables }>, next: Next) {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({ success: false, message: 'Access token required' }, 401);
  }

  let decoded: any;
  try {
    decoded = await verify(token, c.env.JWT_SECRET);
  } catch (err: any) {
    if (err.message?.includes('expired') || err.name === 'JwtTokenExpired') {
      return c.json({ success: false, message: 'Token expired' }, 401);
    }
    return c.json({ success: false, message: 'Invalid token' }, 401);
  }

  if (!decoded.userId) {
    return c.json({ success: false, message: 'Invalid token - missing user ID' }, 401);
  }

  // Look up user
  let user: any;
  try {
    const result = await query(
      c.env,
      `SELECT users_id, name, email, phone, role, active, tenant_id, permissions
       FROM users WHERE users_id = $1`,
      [decoded.userId]
    );
    if (result.rows.length === 0) {
      return c.json({ success: false, message: 'Invalid token - user not found' }, 401);
    }
    user = result.rows[0];
  } catch (e) {
    console.error('[AUTH] User lookup error:', e);
    return c.json({ success: false, message: 'Failed to verify user' }, 500);
  }

  if (!user.active) {
    return c.json({ success: false, message: 'Account is inactive' }, 401);
  }

  if (!user.tenant_id) {
    return c.json({ success: false, message: 'Tenant context required' }, 401);
  }

  c.set('user', user);
  c.set('tenantId', user.tenant_id);
  await next();
}

/**
 * Permission check middleware factory.
 * Usage: requirePermission('meter:read')
 */
export function requirePermission(permission: string) {
  return async (c: Context<{ Bindings: Env; Variables: AuthVariables }>, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Authentication required' }, 401);
    }

    // Admin bypasses
    if (user.role === 'admin') {
      return next();
    }

    // Parse permission string like "meter:read"
    const [module, action] = permission.split(':');
    const perms = user.permissions;

    if (perms && typeof perms === 'object' && perms[module] && perms[module][action]) {
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
