import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => ({
  query: vi.fn(),
}));

vi.mock('hono/jwt', () => ({
  verify: vi.fn(),
}));

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

import { verify } from 'hono/jwt';
import { query } from '../db';
import { clearUserCache } from '../middleware';
import registersApp from './registers';
import type { Env } from '../db';

const mockVerify = vi.mocked(verify);
const mockQuery = vi.mocked(query);

const TEST_ENV: Env = {
  JWT_SECRET: 'test-secret',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
};

// Registers route uses only authenticateToken — no requirePermission, no DB user lookup.
function setupAuth() {
  mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 });
}

const SAMPLE_REGISTERS = [
  { register_id: 1, number: 100, name: 'kWh Import', unit: 'kWh', field_name: 'calculated_kwh', description: 'Energy consumed' },
  { register_id: 2, number: 200, name: 'kW Demand', unit: 'kW', field_name: 'kw', description: 'Peak demand' },
  { register_id: 3, number: 300, name: 'Voltage A', unit: 'V', field_name: 'voltage_a', description: 'Phase A voltage' },
];

describe('Registers Routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearUserCache();
    setupAuth();
  });

  describe('GET /', () => {
    it('returns all registers ordered by number', async () => {
      mockQuery.mockResolvedValueOnce({ rows: SAMPLE_REGISTERS } as any);

      const res = await registersApp.request('/', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(3);
      expect(body.data[0].register_id).toBe(1);
      expect(body.data[0].name).toBe('kWh Import');
      expect(body.data[1].register_id).toBe(2);
    });

    it('returns empty array when no registers exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await registersApp.request('/', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    it('returns 401 without authorization header', async () => {
      const res = await registersApp.request('/', {}, TEST_ENV);

      expect(res.status).toBe(401);
    });

    it('returns 401 when token is invalid', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Invalid token'));

      const res = await registersApp.request('/', {
        headers: { authorization: 'Bearer bad-token' },
      }, TEST_ENV);

      expect(res.status).toBe(401);
    });

    it('includes all expected fields in response', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SAMPLE_REGISTERS[0]] } as any);

      const res = await registersApp.request('/', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      const body = await res.json();
      const reg = body.data[0];
      expect(reg).toHaveProperty('register_id');
      expect(reg).toHaveProperty('number');
      expect(reg).toHaveProperty('name');
      expect(reg).toHaveProperty('unit');
      expect(reg).toHaveProperty('field_name');
      expect(reg).toHaveProperty('description');
    });
  });
});
