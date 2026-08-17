import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => {
  const queryFn = vi.fn();
  return {
    query: queryFn,
    execQuery: vi.fn((env: any, sql: string, params?: any[]) => queryFn(env, sql, params)),
    transaction: vi.fn(),
  };
});

vi.mock('hono/jwt', () => ({
  verify: vi.fn(),
  sign: vi.fn(),
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

import { verify, sign } from 'hono/jwt';
import { query } from '../db';
import { clearUserCache } from '../middleware';
import adminApp from './adminRoutes';
import type { Env } from '../db';

const mockVerify = vi.mocked(verify);
const mockSign = vi.mocked(sign);
const mockQuery = vi.mocked(query);

const TEST_ENV: Env = {
  JWT_SECRET: 'test-secret',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
};

const SUPERADMIN_USER = {
  users_id: 1,
  name: 'Super Admin',
  email: 'super@test.com',
  role: 'superadmin',
  active: true,
  tenant_id: 1,
  permissions: {},
};

const REGULAR_USER = {
  users_id: 2,
  name: 'Regular User',
  email: 'user@test.com',
  role: 'admin',
  active: true,
  tenant_id: 1,
  permissions: {},
};

function setupSuperAdminAuth() {
  mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 });
  mockQuery.mockResolvedValue({ rows: [SUPERADMIN_USER] } as any);
}

const MOCK_TENANT = {
  tenant_id: 1,
  name: 'Acme Corp',
  url: 'https://acme.com',
  contact_email: 'contact@acme.com',
  active: true,
  created_at: '2024-01-01T00:00:00Z',
};

describe('Admin Routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearUserCache();
    setupSuperAdminAuth();
  });

  // ── Auth guard ─────────────────────────────────────────────────────────────

  describe('Authorization', () => {
    it('returns 401 when no token provided', async () => {
      mockVerify.mockRejectedValueOnce(new Error('No token'));

      const res = await adminApp.request('/clients', {
        headers: { authorization: 'Bearer bad' },
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not superadmin', async () => {
      mockVerify.mockResolvedValue({ userId: 2, tenant_id: 1 });
      mockQuery
        .mockResolvedValueOnce({ rows: [{ users_id: 2, tenant_id: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [REGULAR_USER] } as any);

      const res = await adminApp.request('/clients', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.message).toBe('Admin access required');
    });
  });

  // ── Clients / Tenants ──────────────────────────────────────────────────────

  describe('GET /clients', () => {
    it('returns list of all tenants', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [MOCK_TENANT] } as any);

      const res = await adminApp.request('/clients', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(1);
      expect(body.data.items[0].name).toBe('Acme Corp');
    });

    it('returns empty list when no tenants', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const res = await adminApp.request('/clients', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.items).toHaveLength(0);
    });
  });

  describe('GET /clients/:id', () => {
    it('returns single tenant by id', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [MOCK_TENANT] } as any);

      const res = await adminApp.request('/clients/1', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.tenant_id).toBe(1);
    });

    it('returns 404 for unknown tenant', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const res = await adminApp.request('/clients/999', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });

    it('returns 400 for non-numeric id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/clients/abc', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /clients', () => {
    it('creates tenant and returns 201', async () => {
      const newTenant = { ...MOCK_TENANT, tenant_id: 2, name: 'New Corp' };
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [newTenant] } as any);

      const res = await adminApp.request('/clients', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Corp' }),
      }, TEST_ENV);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('New Corp');
    });

    it('returns 400 when name is missing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/clients', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe('Name is required');
    });
  });

  describe('PUT /clients/:id', () => {
    it('updates tenant successfully', async () => {
      const updated = { ...MOCK_TENANT, name: 'Updated Corp' };
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [{ tenant_id: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [updated] } as any);

      const res = await adminApp.request('/clients/1', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Corp' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('Updated Corp');
    });

    it('returns 404 when tenant not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const res = await adminApp.request('/clients/999', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Corp' }),
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });
  });

  // ── Costs ──────────────────────────────────────────────────────────────────

  describe('GET /costs', () => {
    it('returns cost list', async () => {
      const mockCosts = [
        { cost_id: 1, name: 'Setup Fee', quantity: 1, rate: 500, active: true },
      ];
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: mockCosts } as any);

      const res = await adminApp.request('/costs', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.items).toHaveLength(1);
      expect(body.data.items[0].name).toBe('Setup Fee');
    });
  });

  describe('POST /costs', () => {
    it('creates cost and returns 201', async () => {
      const newCost = { cost_id: 1, name: 'Monthly Fee', quantity: 1, rate: 100, active: true };
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [newCost] } as any);

      const res = await adminApp.request('/costs', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'Monthly Fee', quantity: 1, rate: 100 }),
      }, TEST_ENV);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.name).toBe('Monthly Fee');
    });

    it('returns 400 when name is blank', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/costs', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: '  ', rate: 100 }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /costs/:id', () => {
    it('updates cost', async () => {
      const updated = { cost_id: 1, name: 'Updated Fee', quantity: 1, rate: 150, active: true };
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [updated] } as any);

      const res = await adminApp.request('/costs/1', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Fee', quantity: 1, rate: 150, active: true }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('Updated Fee');
    });

    it('returns 404 when cost not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const res = await adminApp.request('/costs/999', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: 'X', quantity: 1, rate: 0, active: true }),
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /costs/:id', () => {
    it('deletes cost', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const res = await adminApp.request('/costs/1', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('returns 400 for non-numeric id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/costs/abc', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  // ── Device catalog ─────────────────────────────────────────────────────────

  describe('GET /devices', () => {
    it('returns device catalog', async () => {
      const devices = [
        { device_id: 1, manufacturer: 'Acme', model_number: 'M1', type: 'meter', number_of_elements: 2, default_price: 200 },
      ];
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: devices } as any);

      const res = await adminApp.request('/devices', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.items).toHaveLength(1);
    });
  });

  describe('POST /devices', () => {
    it('creates device and returns success', async () => {
      const device = { device_id: 1, manufacturer: 'Acme', model_number: 'M1', type: 'meter', number_of_elements: 2, default_price: 200, description: '' };
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [device] } as any);

      const res = await adminApp.request('/devices', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ manufacturer: 'Acme', model_number: 'M1', type: 'meter' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('returns 400 when required fields missing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/devices', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ manufacturer: 'Acme' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toContain('required');
    });
  });

  describe('PUT /devices/:id', () => {
    it('returns 400 when no valid fields provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/devices/1', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ invalid_field: 'foo' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 404 when device not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const res = await adminApp.request('/devices/999', {
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ manufacturer: 'Updated' }),
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });
  });

  // ── Tenant equipment ───────────────────────────────────────────────────────

  describe('GET /clients/:id/equipment', () => {
    it('returns equipment list for tenant', async () => {
      const equipment = [
        { tenant_device_id: 1, tenant_id: 1, device_id: 1, quantity: 2, price: 400, manufacturer: 'Acme', model_number: 'M1' },
      ];
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: equipment } as any);

      const res = await adminApp.request('/clients/1/equipment', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.items).toHaveLength(1);
    });
  });

  describe('POST /clients/:id/equipment', () => {
    it('adds equipment to tenant', async () => {
      const eq = { tenant_device_id: 1, tenant_id: 1, device_id: 2, quantity: 1, price: 200 };
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [eq] } as any);

      const res = await adminApp.request('/clients/1/equipment', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ device_id: 2, quantity: 1, price: 200 }),
      }, TEST_ENV);

      expect(res.status).toBe(201);
    });

    it('returns 400 when device_id missing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/clients/1/equipment', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ quantity: 1 }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  // ── Tenant costs ───────────────────────────────────────────────────────────

  describe('GET /clients/:id/costs', () => {
    it('returns tenant cost list', async () => {
      const costs = [{ tenant_cost_id: 1, tenant_id: 1, description: 'Monthly', amount: 500 }];
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: costs } as any);

      const res = await adminApp.request('/clients/1/costs', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.items).toHaveLength(1);
    });
  });

  describe('POST /clients/:id/costs', () => {
    it('creates tenant cost and returns 201', async () => {
      const cost = { tenant_cost_id: 1, tenant_id: 1, description: 'Monthly', amount: 100, active: true };
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [cost] } as any);

      const res = await adminApp.request('/clients/1/costs', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ description: 'Monthly', amount: 100 }),
      }, TEST_ENV);

      expect(res.status).toBe(201);
    });

    it('returns 400 when description is blank', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/clients/1/costs', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ description: '' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  // ── Tenant documents ───────────────────────────────────────────────────────

  describe('GET /clients/:id/documents', () => {
    it('returns document list', async () => {
      const docs = [{ tenant_document_id: 1, tenant_id: 1, file_name: 'contract.pdf', file_type: 'application/pdf', file_size: 1024 }];
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: docs } as any);

      const res = await adminApp.request('/clients/1/documents', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.items).toHaveLength(1);
    });
  });

  describe('POST /clients/:id/documents', () => {
    it('creates document and returns 201', async () => {
      const doc = { tenant_document_id: 1, tenant_id: 1, file_name: 'test.pdf', file_type: 'application/pdf', file_size: 512 };
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [doc] } as any);

      const res = await adminApp.request('/clients/1/documents', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ file_name: 'test.pdf', file_data: 'base64data==', file_type: 'application/pdf', file_size: 512 }),
      }, TEST_ENV);

      expect(res.status).toBe(201);
    });

    it('returns 400 when file_name or file_data missing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/clients/1/documents', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ description: 'No file' }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /clients/:id/documents/:did/download', () => {
    it('returns document download data', async () => {
      const doc = { file_name: 'test.pdf', file_type: 'application/pdf', file_data: 'base64data==' };
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [doc] } as any);

      const res = await adminApp.request('/clients/1/documents/1/download', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.file_name).toBe('test.pdf');
      expect(body.data.file_data).toBe('base64data==');
    });

    it('returns 404 when document not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const res = await adminApp.request('/clients/1/documents/999/download', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });
  });

  // ── Impersonation ──────────────────────────────────────────────────────────

  describe('POST /impersonate/:tenantId', () => {
    it('issues impersonation token for active tenant', async () => {
      mockSign.mockResolvedValue('impersonation-jwt' as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [{ tenant_id: 5, name: 'Target Corp' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // audit log insert

      const res = await adminApp.request('/impersonate/5', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBe('impersonation-jwt');
      expect(body.data.tenantName).toBe('Target Corp');
    });

    it('returns 404 when tenant not found or inactive', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const res = await adminApp.request('/impersonate/999', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });

    it('returns 400 for non-numeric tenantId', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any);

      const res = await adminApp.request('/impersonate/abc', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('signs token with correct claims', async () => {
      mockSign.mockResolvedValue('signed-token' as any);
      mockQuery
        .mockResolvedValueOnce({ rows: [SUPERADMIN_USER] } as any)
        .mockResolvedValueOnce({ rows: [{ tenant_id: 5, name: 'Target Corp' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await adminApp.request('/impersonate/5', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(mockSign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          tenant_id: 5,
          isAdminView: true,
          viewingTenantName: 'Target Corp',
        }),
        'test-secret'
      );
    });
  });
});
