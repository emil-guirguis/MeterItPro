/**
 * Tests for authentication and permission middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('./db', () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

// Mock hono/jwt
vi.mock('hono/jwt', () => ({
  verify: vi.fn(),
  sign: vi.fn(),
}));

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { query } from './db';
import { authenticateToken, requirePermission, authenticateSyncServer } from './middleware';
import type { Env } from './db';
import type { AuthVariables } from './middleware';

const mockVerify = vi.mocked(verify);
const mockQuery = vi.mocked(query);

function createApp() {
  return new Hono<{ Bindings: Env; Variables: AuthVariables }>();
}

const TEST_ENV: Env = {
  JWT_SECRET: 'test-secret-key',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
};

describe('authenticateToken middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when no authorization header is provided', async () => {
    const app = createApp();
    app.use('*', authenticateToken);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {}, TEST_ENV);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Access token required');
  });

  it('should return 401 when token is invalid', async () => {
    mockVerify.mockRejectedValueOnce(new Error('Invalid'));

    const app = createApp();
    app.use('*', authenticateToken);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer invalid-token' },
    }, TEST_ENV);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Invalid token');
  });

  it('should return 401 when token is expired', async () => {
    const error = new Error('Token expired');
    error.name = 'JwtTokenExpired';
    mockVerify.mockRejectedValueOnce(error);

    const app = createApp();
    app.use('*', authenticateToken);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer expired-token' },
    }, TEST_ENV);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Token expired');
  });

  it('should return 401 when token has no userId', async () => {
    mockVerify.mockResolvedValueOnce({ someField: 'no-userId' });

    const app = createApp();
    app.use('*', authenticateToken);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer no-user-token' },
    }, TEST_ENV);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Invalid token - missing user ID');
  });

  it('should return 401 when user is not found in database', async () => {
    mockVerify.mockResolvedValueOnce({ userId: 999 });
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const app = createApp();
    app.use('*', authenticateToken);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer valid-token' },
    }, TEST_ENV);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Invalid token - user not found');
  });

  it('should return 401 when user is inactive', async () => {
    mockVerify.mockResolvedValueOnce({ userId: 1 });
    mockQuery.mockResolvedValueOnce({
      rows: [{
        users_id: 1, name: 'Test', email: 'test@test.com',
        role: 'admin', active: false, tenant_id: 1, permissions: {},
      }],
    } as any);

    const app = createApp();
    app.use('*', authenticateToken);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer valid-token' },
    }, TEST_ENV);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Account is inactive');
  });

  it('should return 401 when user has no tenant_id', async () => {
    mockVerify.mockResolvedValueOnce({ userId: 1 });
    mockQuery.mockResolvedValueOnce({
      rows: [{
        users_id: 1, name: 'Test', email: 'test@test.com',
        role: 'admin', active: true, tenant_id: null, permissions: {},
      }],
    } as any);

    const app = createApp();
    app.use('*', authenticateToken);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer valid-token' },
    }, TEST_ENV);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Tenant context required');
  });

  it('should set user and tenantId on context when token is valid', async () => {
    mockVerify.mockResolvedValueOnce({ userId: 1 });
    mockQuery.mockResolvedValueOnce({
      rows: [{
        users_id: 1, name: 'Test User', email: 'test@test.com',
        role: 'admin', active: true, tenant_id: 42, permissions: {},
      }],
    } as any);

    const app = createApp();
    app.use('*', authenticateToken);
    app.get('/test', (c) => {
      const user = c.get('user');
      const tenantId = c.get('tenantId');
      return c.json({ userId: user.users_id, tenantId });
    });

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer valid-token' },
    }, TEST_ENV);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe(1);
    expect(body.tenantId).toBe(42);
  });
});

describe('requirePermission middleware', () => {
  function createAuthenticatedApp(user: any) {
    const app = createApp();
    app.use('*', async (c, next) => {
      c.set('user', user);
      c.set('tenantId', user.tenant_id);
      await next();
    });
    return app;
  }

  it('should allow admin users regardless of permission', async () => {
    const app = createAuthenticatedApp({
      users_id: 1, role: 'admin', tenant_id: 1, permissions: {},
    });
    app.get('/test', requirePermission('meter:delete'), (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });

  it('should allow users with matching array permission', async () => {
    const app = createAuthenticatedApp({
      users_id: 2, role: 'viewer', tenant_id: 1,
      permissions: ['meter:read', 'location:read'],
    });
    app.get('/test', requirePermission('meter:read'), (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });

  it('should allow users with matching nested object permission', async () => {
    const app = createAuthenticatedApp({
      users_id: 3, role: 'manager', tenant_id: 1,
      permissions: { meter: { read: true, update: true } },
    });
    app.get('/test', requirePermission('meter:read'), (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });

  it('should deny users without the required permission (array)', async () => {
    const app = createAuthenticatedApp({
      users_id: 4, role: 'viewer', tenant_id: 1,
      permissions: ['location:read'],
    });
    app.get('/test', requirePermission('meter:delete'), (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe('Insufficient permissions');
  });

  it('should deny users without the required permission (nested object)', async () => {
    const app = createAuthenticatedApp({
      users_id: 5, role: 'technician', tenant_id: 1,
      permissions: { meter: { read: true } },
    });
    app.get('/test', requirePermission('meter:delete'), (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(403);
  });

  it('should return 401 when no user is set', async () => {
    const app = createApp();
    app.get('/test', requirePermission('meter:read'), (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Authentication required');
  });
});

describe('authenticateSyncServer middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when no API key header is provided', async () => {
    const app = createApp();
    app.use('*', authenticateSyncServer);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {}, TEST_ENV);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('API key required');
  });

  it('should return 401 when API key is invalid', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const app = createApp();
    app.use('*', authenticateSyncServer);
    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test', {
      headers: { 'x-api-key': 'invalid-key' },
    }, TEST_ENV);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe('Invalid API key');
  });

  it('should set tenantId when API key is valid', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ tenant_id: 10 }] } as any);

    const app = createApp();
    app.use('*', authenticateSyncServer);
    app.get('/test', (c) => {
      return c.json({ tenantId: c.get('tenantId') });
    });

    const res = await app.request('/test', {
      headers: { 'x-api-key': 'valid-key' },
    }, TEST_ENV);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tenantId).toBe(10);
  });
});
