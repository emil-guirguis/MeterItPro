import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => {
  const queryFn = vi.fn();
  return {
    query: queryFn,
    execQuery: vi.fn((env: any, sql: string, params?: any[]) => queryFn(env, sql, params)),
    transaction: vi.fn(),
  };
});

// Mock middleware - authenticateSyncServer as passthrough that sets tenantId
vi.mock('../middleware', () => ({
  authenticateSyncServer: vi.fn(async (c: any, next: any) => {
    c.set('tenantId', 1);
    await next();
  }),
  authenticateToken: vi.fn(async (c: any, next: any) => {
    c.set('tenantId', 1);
    c.set('user', { users_id: 1, tenant_id: 1, role: 'admin', permissions: {} });
    await next();
  }),
  requirePermission: vi.fn(() => async (_c: any, next: any) => next()),
  clearUserCache: vi.fn(),
  AuthVariables: undefined,
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

import { query, transaction } from '../db';
import syncApp from './sync';
import type { Env } from '../db';

const mockQuery = vi.mocked(query);
const mockTransaction = vi.mocked(transaction);

const TEST_ENV: Env = {
  JWT_SECRET: 'test-secret',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
};

describe('Sync Routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /readings/batch', () => {
    it('inserts readings successfully', async () => {
      mockTransaction.mockImplementationOnce(async (_env, fn) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ meter_reading_id: 1 }] }) // savepoint
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ meter_reading_id: 1 }] }) // insert
            .mockResolvedValueOnce({ rowCount: 0, rows: [] }),                        // release savepoint
        };
        // Simplified: just call fn with mock client
        return await fn(client as any);
      });

      // Override with cleaner mock
      mockTransaction.mockImplementationOnce(async (_env, fn) => {
        const clientQuery = vi.fn()
          .mockResolvedValue({ rowCount: 1, rows: [{ meter_reading_id: 1 }] });
        return await fn({ query: clientQuery } as any);
      });

      const res = await syncApp.request('/readings/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          readings: [
            { meter_id: 1, meter_element_id: 1, kwh: 100.5, created_at: '2024-01-01T00:00:00Z' },
          ],
        }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('inserted');
    });

    it('returns 400 when readings array is empty', async () => {
      const res = await syncApp.request('/readings/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ readings: [] }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toContain('No readings');
    });

    it('returns 400 when readings is missing', async () => {
      const res = await syncApp.request('/readings/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('processes multiple readings in transaction', async () => {
      const clientQuery = vi.fn().mockResolvedValue({ rowCount: 1, rows: [{ meter_reading_id: 42 }] });
      mockTransaction.mockImplementationOnce(async (_env, fn) => {
        return await fn({ query: clientQuery } as any);
      });

      const readings = [
        { meter_id: 1, meter_element_id: 1, kwh: 100 },
        { meter_id: 2, meter_element_id: 2, kwh: 200 },
      ];

      const res = await syncApp.request('/readings/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ readings }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.inserted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /getmeters', () => {
    it('returns meter config when meters exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { meter_id: 1, device_id: 10, ip: '192.168.1.1', port: 502, active: true, meter_element_id: 1, element: 'A', name: 'Element A' },
        ],
      } as any);

      const res = await syncApp.request('/getmeters', {
        headers: {},
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.config).toBeDefined();
      expect(body.config.meters).toHaveLength(1);
    });

    it('returns 404 when no meters found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await syncApp.request('/getmeters', {}, TEST_ENV);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /getmregisters', () => {
    it('returns registers when deviceId is provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { device_id: 10, register: 100, field_name: 'kwh' },
        ],
      } as any);

      const res = await syncApp.request('/getmregisters?deviceId=10', {}, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.config.registers).toHaveLength(1);
    });

    it('returns 400 when deviceId is missing', async () => {
      const res = await syncApp.request('/getmregisters', {}, TEST_ENV);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toContain('deviceId');
    });

    it('returns 404 when no registers found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await syncApp.request('/getmregisters?deviceId=999', {}, TEST_ENV);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /connect', () => {
    it('validates email and API key and returns tenant data', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ users_id: 1, name: 'Admin', email: 'admin@test.com', active: true, tenant_id: 1 }],
        } as any)
        .mockResolvedValueOnce({
          rows: [{
            tenant_id: 1, name: 'Test Tenant', url: null, street: null,
            street2: null, city: null, state: null, zip: null, country: 'US',
            api_key: 'valid-api-key', download_batch_size: 100, upload_batch_size: 100,
          }],
        } as any);

      const res = await syncApp.request('/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', apiKey: 'valid-api-key' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.tenant.tenant_id).toBe(1);
      expect(body.data.user.email).toBe('admin@test.com');
    });

    it('returns 400 when email or apiKey is missing', async () => {
      const res = await syncApp.request('/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 401 when user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await syncApp.request('/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@test.com', apiKey: 'key' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });

    it('returns 401 when user is inactive', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ users_id: 1, name: 'Inactive', email: 'i@test.com', active: false, tenant_id: 1 }],
      } as any);

      const res = await syncApp.request('/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'i@test.com', apiKey: 'key' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toContain('inactive');
    });

    it('returns 401 when API key does not match', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ users_id: 1, name: 'Admin', email: 'a@test.com', active: true, tenant_id: 1 }],
        } as any)
        .mockResolvedValueOnce({
          rows: [{ tenant_id: 1, api_key: 'correct-key' }],
        } as any);

      const res = await syncApp.request('/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'a@test.com', apiKey: 'wrong-key' }),
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /trigger-upload', () => {
    it('always returns success', async () => {
      const res = await syncApp.request('/trigger-upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });
});
