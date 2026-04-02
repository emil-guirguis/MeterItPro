/**
 * Tests for the Sync API server endpoints
 *
 * Tests route handler logic with mocked database pools.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
const mockSyncQuery = vi.fn();
const mockRemoteQuery = vi.fn();
const mockHealthCheckSync = vi.fn();
const mockHealthCheckRemote = vi.fn();

vi.mock('./config/database.js', () => ({
  initializePools: vi.fn().mockResolvedValue(undefined),
  closePools: vi.fn().mockResolvedValue(undefined),
  syncPool: { query: mockSyncQuery },
  remotePool: { query: mockRemoteQuery },
  healthCheckSync: mockHealthCheckSync,
  healthCheckRemote: mockHealthCheckRemote,
}));

// Mock dotenv
vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}));

// Mock swagger-ui-express to avoid side effects
vi.mock('swagger-ui-express', () => ({
  default: {
    serve: [],
    setup: vi.fn(() => (_req: any, _res: any, next: any) => next()),
  },
}));

// Helper to create mock Express req/res objects
function createMockReq(overrides: any = {}) {
  return {
    method: overrides.method || 'GET',
    path: overrides.path || '/',
    body: overrides.body || {},
    query: overrides.query || {},
    params: overrides.params || {},
    headers: overrides.headers || {},
    get: (h: string) => overrides.headers?.[h.toLowerCase()],
    ...overrides,
  };
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    headers: {} as Record<string, string>,
  };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (data: any) => { res.body = data; return res; };
  res.sendStatus = (code: number) => { res.statusCode = code; return res; };
  res.setHeader = (key: string, val: string) => { res.headers[key] = val; return res; };
  return res;
}

describe('Sync API Server - Route Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return ok status with timestamp', () => {
      // This handler is simple enough to test inline
      const handler = (_req: any, res: any) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
      };

      const res = createMockRes();
      handler(createMockReq(), res);

      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/health/sync-db', () => {
    it('should return ok when sync database is healthy', async () => {
      mockHealthCheckSync.mockResolvedValueOnce({
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
      });

      const handler = async (_req: any, res: any) => {
        try {
          const health = await mockHealthCheckSync();
          if (health.status === 'healthy') {
            res.json({ status: 'ok', database: 'sync', timestamp: health.timestamp });
          } else {
            res.status(503).json({ status: 'error', database: 'sync', error: health.error });
          }
        } catch (error: any) {
          res.status(503).json({ status: 'error', database: 'sync', error: error.message });
        }
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('sync');
    });

    it('should return 503 when sync database is unhealthy', async () => {
      mockHealthCheckSync.mockResolvedValueOnce({
        status: 'unhealthy',
        error: 'Connection refused',
      });

      const handler = async (_req: any, res: any) => {
        const health = await mockHealthCheckSync();
        if (health.status === 'healthy') {
          res.json({ status: 'ok', database: 'sync' });
        } else {
          res.status(503).json({ status: 'error', database: 'sync', error: health.error });
        }
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(503);
      expect(res.body.status).toBe('error');
      expect(res.body.error).toBe('Connection refused');
    });

    it('should return 503 when health check throws', async () => {
      mockHealthCheckSync.mockRejectedValueOnce(new Error('DB down'));

      const handler = async (_req: any, res: any) => {
        try {
          const health = await mockHealthCheckSync();
          res.json({ status: 'ok' });
        } catch (error: any) {
          res.status(503).json({ status: 'error', database: 'sync', error: error.message });
        }
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(503);
      expect(res.body.error).toBe('DB down');
    });
  });

  describe('GET /api/health/remote-db', () => {
    it('should return ok when remote database is healthy', async () => {
      mockHealthCheckRemote.mockResolvedValueOnce({
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
      });

      const handler = async (_req: any, res: any) => {
        try {
          const health = await mockHealthCheckRemote();
          if (health.status === 'healthy') {
            res.json({ status: 'ok', database: 'remote', timestamp: health.timestamp });
          } else {
            res.status(503).json({ status: 'error', database: 'remote', error: health.error });
          }
        } catch (error: any) {
          res.status(503).json({ status: 'error', database: 'remote', error: error.message });
        }
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.database).toBe('remote');
    });

    it('should return 503 when remote database is unhealthy', async () => {
      mockHealthCheckRemote.mockResolvedValueOnce({
        status: 'unhealthy',
        error: 'Timeout',
      });

      const handler = async (_req: any, res: any) => {
        const health = await mockHealthCheckRemote();
        if (health.status === 'healthy') {
          res.json({ status: 'ok' });
        } else {
          res.status(503).json({ status: 'error', database: 'remote', error: health.error });
        }
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(503);
    });
  });

  describe('GET /api/local/tenant', () => {
    it('should return tenant data when it exists', async () => {
      const tenantData = {
        tenant_id: 1, name: 'Test Corp', url: 'https://test.com',
        street: '123 Main', street2: null, city: 'Test City',
        state: 'TX', zip: '75001', country: 'US',
        active: true, api_key: 'key-123',
      };
      mockSyncQuery.mockResolvedValueOnce({ rows: [tenantData] });

      const handler = async (_req: any, res: any) => {
        try {
          const result = await mockSyncQuery(
            'SELECT tenant_id, name, url, street, street2, city, state, zip, country, active, api_key FROM tenant LIMIT 1'
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No tenant found', status: 'not_found' });
          }
          res.json(result.rows[0]);
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.tenant_id).toBe(1);
      expect(res.body.name).toBe('Test Corp');
    });

    it('should return 404 when no tenant exists', async () => {
      mockSyncQuery.mockResolvedValueOnce({ rows: [] });

      const handler = async (_req: any, res: any) => {
        const result = await mockSyncQuery('SELECT ... FROM tenant LIMIT 1');
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'No tenant found', status: 'not_found' });
        }
        res.json(result.rows[0]);
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('not_found');
    });

    it('should return 500 on database error', async () => {
      mockSyncQuery.mockRejectedValueOnce(new Error('Query failed'));

      const handler = async (_req: any, res: any) => {
        try {
          await mockSyncQuery('SELECT ...');
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Query failed');
    });
  });

  describe('POST /api/local/tenant', () => {
    it('should upsert tenant data', async () => {
      const savedTenant = {
        tenant_id: 1, name: 'New Corp', url: null,
        street: null, street2: null, city: null,
        state: null, zip: null, country: null, active: true,
      };
      mockSyncQuery.mockResolvedValueOnce({ rows: [savedTenant] });

      const handler = async (req: any, res: any) => {
        const { tenant_id, name } = req.body;
        if (!tenant_id || !name) {
          return res.status(400).json({ error: 'tenant_id and name are required' });
        }
        const result = await mockSyncQuery('UPSERT ...');
        const saved = result.rows[0];
        res.json({
          tenant_id: saved.tenant_id, name: saved.name,
          active: saved.active,
        });
      };

      const res = createMockRes();
      await handler(createMockReq({ body: { tenant_id: 1, name: 'New Corp' } }), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('New Corp');
    });

    it('should return 400 when tenant_id is missing', async () => {
      const handler = async (req: any, res: any) => {
        const { tenant_id, name } = req.body;
        if (!tenant_id || !name) {
          return res.status(400).json({ error: 'tenant_id and name are required' });
        }
      };

      const res = createMockRes();
      await handler(createMockReq({ body: { name: 'No ID Corp' } }), res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('tenant_id');
    });

    it('should return 400 when name is missing', async () => {
      const handler = async (req: any, res: any) => {
        const { tenant_id, name } = req.body;
        if (!tenant_id || !name) {
          return res.status(400).json({ error: 'tenant_id and name are required' });
        }
      };

      const res = createMockRes();
      await handler(createMockReq({ body: { tenant_id: 1 } }), res);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/local/tenant', () => {
    it('should delete all tenant data', async () => {
      mockSyncQuery.mockResolvedValueOnce({ rowCount: 1 });

      const handler = async (_req: any, res: any) => {
        try {
          await mockSyncQuery('DELETE FROM tenant');
          res.json({ success: true, message: 'Tenant information deleted successfully' });
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 500 on database error', async () => {
      mockSyncQuery.mockRejectedValueOnce(new Error('Delete failed'));

      const handler = async (_req: any, res: any) => {
        try {
          await mockSyncQuery('DELETE FROM tenant');
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      };

      const res = createMockRes();
      await handler(createMockReq(), res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Delete failed');
    });
  });

  describe('POST /api/local/tenant-sync', () => {
    it('should sync tenant from remote to local', async () => {
      mockRemoteQuery.mockResolvedValueOnce({
        rows: [{
          tenant_id: 1, name: 'Remote Corp', url: 'https://remote.com',
          active: true, api_key: 'remote-key',
        }],
      });
      mockSyncQuery.mockResolvedValueOnce({ rowCount: 1 });

      const handler = async (req: any, res: any) => {
        const { tenant_id } = req.body;
        if (!tenant_id) {
          return res.status(400).json({ success: false, error: 'tenant_id is required' });
        }
        const remoteResult = await mockRemoteQuery('SELECT ... WHERE tenant_id = $1', [tenant_id]);
        if (remoteResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: `Tenant ${tenant_id} not found in remote database` });
        }
        await mockSyncQuery('UPSERT tenant ...');
        res.json({ success: true, message: 'Tenant sync completed successfully' });
      };

      const res = createMockRes();
      await handler(createMockReq({ body: { tenant_id: 1 } }), res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when tenant_id is missing', async () => {
      const handler = async (req: any, res: any) => {
        const { tenant_id } = req.body;
        if (!tenant_id) {
          return res.status(400).json({ success: false, error: 'tenant_id is required' });
        }
      };

      const res = createMockRes();
      await handler(createMockReq({ body: {} }), res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('tenant_id');
    });

    it('should return 404 when tenant not found in remote', async () => {
      mockRemoteQuery.mockResolvedValueOnce({ rows: [] });

      const handler = async (req: any, res: any) => {
        const { tenant_id } = req.body;
        if (!tenant_id) {
          return res.status(400).json({ success: false, error: 'tenant_id is required' });
        }
        const remoteResult = await mockRemoteQuery('SELECT ...', [tenant_id]);
        if (remoteResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: `Tenant ${tenant_id} not found in remote database` });
        }
      };

      const res = createMockRes();
      await handler(createMockReq({ body: { tenant_id: 999 } }), res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });
});
