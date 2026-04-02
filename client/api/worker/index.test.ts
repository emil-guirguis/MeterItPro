/**
 * Tests for the main Hono app entry point
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

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
    hashSync: vi.fn(),
    compareSync: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));

// Mock speakeasy
vi.mock('speakeasy', () => ({
  default: {
    generateSecret: vi.fn(),
    totp: { verify: vi.fn() },
  },
}));

import { query } from './db';
import app from './index';

const mockQuery = vi.mocked(query);

const TEST_ENV = {
  JWT_SECRET: 'test-secret',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
  FRONTEND_URL: 'http://localhost:3000',
};

describe('App Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Check', () => {
    it('GET /api/health should return OK when database is connected', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ now: '2024-01-01T00:00:00Z' }],
      } as any);

      const res = await app.request('/api/health', {}, TEST_ENV);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('OK');
      expect(body.database).toBe('Connected');
      expect(body.serverTime).toBeDefined();
    });

    it('GET /api/health should return 500 when database is disconnected', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const res = await app.request('/api/health', {}, TEST_ENV);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.status).toBe('Error');
      expect(body.database).toBe('Disconnected');
    });
  });

  describe('Swagger', () => {
    it('GET /swagger should return HTML page', async () => {
      const res = await app.request('/swagger', {}, TEST_ENV);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('swagger-ui');
      expect(html).toContain('MeterIt Pro');
    });

    it('GET /swagger/spec.json should return OpenAPI spec', async () => {
      const res = await app.request('/swagger/spec.json', {}, TEST_ENV);
      expect(res.status).toBe(200);
      const spec = await res.json();
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('MeterIt Pro Client API');
      expect(spec.paths).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should include CORS headers for allowed origins', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ now: '2024-01-01' }] } as any);

      const res = await app.request('/api/health', {
        headers: { origin: 'http://localhost:3000' },
      }, TEST_ENV);

      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const res = await app.request('/api/health', {
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:3000' },
      }, TEST_ENV);

      expect(res.status).toBe(204);
    });
  });

  describe('Catch-all', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await app.request('/api/nonexistent', {}, TEST_ENV);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toBe('Route not found');
    });
  });

  describe('Device Registers (direct route)', () => {
    it('GET /api/devices/:deviceId/registers should require auth', async () => {
      const res = await app.request('/api/devices/1/registers', {}, TEST_ENV);
      expect(res.status).toBe(401);
    });
  });

  describe('Meter Registers (direct route)', () => {
    it('GET /api/meters/:meterId/registers should require auth', async () => {
      const res = await app.request('/api/meters/1/registers', {}, TEST_ENV);
      expect(res.status).toBe(401);
    });
  });
});
