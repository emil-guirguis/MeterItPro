/**
 * Tests for reports routes
 */

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

vi.mock('../reportRunner', () => ({
  runReport: vi.fn(),
}));

import { verify } from 'hono/jwt';
import { query } from '../db';
import { clearUserCache } from '../middleware';
import { runReport } from '../reportRunner';
import reportsApp from './reports';
import type { Env } from '../db';

const mockRunReport = vi.mocked(runReport);

const mockVerify = vi.mocked(verify);
const mockQuery = vi.mocked(query);

const ADMIN_USER = {
  users_id: 1, name: 'Admin', email: 'admin@test.com',
  role: 'admin', active: true, tenant_id: 1, permissions: {},
};

const TEST_ENV: Env = {
  JWT_SECRET: 'test-secret',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
};

const TEST_ENV_WITH_RESEND: Env = {
  ...TEST_ENV,
  RESEND_API_KEY: 'test-resend-key',
  RESEND_FROM: 'test@meteritpro.com',
};

const SAMPLE_REPORT = {
  report_id: 1,
  name: 'Monthly Energy Report',
  type: 'meter_readings',
  cron: '0 8 1 * *',
  recipients: { from: null, to: ['user@example.com'] },
  active: true,
  meter_selections: null,
  time_frame: 'monthly',
  visualization_type: 'bar',
  grouping_type: 'daily',
  attach_as: 'html',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function authQuery() {
  return { rows: [ADMIN_USER] } as any;
}

function setupAuth() {
  mockVerify.mockResolvedValue({ userId: 1, tenant_id: 1 });
}

describe('Reports Routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearUserCache();
    setupAuth();
  });

  // ── GET / ───────────────────────────────────────────────────────────────────
  describe('GET /', () => {
    it('returns paginated list of reports', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: '2' }] } as any)
        .mockResolvedValueOnce({ rows: [SAMPLE_REPORT, { ...SAMPLE_REPORT, report_id: 2, name: 'Weekly Report' }] } as any);

      const res = await reportsApp.request('/', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      expect(body.data.total).toBe(2);
    });
  });

  // ── GET /:id ─────────────────────────────────────────────────────────────────
  describe('GET /:id', () => {
    it('returns a report by ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SAMPLE_REPORT] } as any);

      const res = await reportsApp.request('/1', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.report_id).toBe(1);
    });

    it('returns 404 for unknown ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await reportsApp.request('/999', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });

    it('returns 400 for non-numeric ID', async () => {
      const res = await reportsApp.request('/abc', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  // ── POST / ───────────────────────────────────────────────────────────────────
  describe('POST /', () => {
    it('creates a report and returns 201', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [SAMPLE_REPORT] } as any);

      const res = await reportsApp.request('/', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token', 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Monthly Energy Report',
          type: 'meter_readings',
          cron: '0 8 1 * *',
          recipients: { from: null, to: ['user@example.com'] },
        }),
      }, TEST_ENV);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Monthly Energy Report');
    });

    it('returns 400 when name is missing', async () => {
      const res = await reportsApp.request('/', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token', 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'meter_readings', cron: '0 8 1 * *', recipients: { to: ['user@example.com'] } }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.errors).toEqual(expect.arrayContaining([expect.stringContaining('name')]));
    });

    it('returns 400 when recipients is empty', async () => {
      const res = await reportsApp.request('/', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token', 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Test', type: 'meter_readings', cron: '0 8 1 * *', recipients: { to: [] } }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid cron expression', async () => {
      const res = await reportsApp.request('/', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token', 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Test', type: 'meter_readings', cron: 'not-a-cron', recipients: { to: ['a@b.com'] } }),
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });
  });

  // ── PUT /:id ─────────────────────────────────────────────────────────────────
  describe('PUT /:id', () => {
    it('updates a report', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ report_id: 1 }] } as any) // exists check
        .mockResolvedValueOnce({ rows: [{ ...SAMPLE_REPORT, name: 'Updated Name' }] } as any); // update result

      const res = await reportsApp.request('/1', {
        method: 'PUT',
        headers: { authorization: 'Bearer valid-token', 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('Updated Name');
    });

    it('returns 404 when updating non-existent report', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await reportsApp.request('/999', {
        method: 'PUT',
        headers: { authorization: 'Bearer valid-token', 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /:id ──────────────────────────────────────────────────────────────
  describe('DELETE /:id', () => {
    it('deletes a report', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ report_id: 1, name: 'Test' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // delete

      const res = await reportsApp.request('/1', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('returns 404 when deleting non-existent report', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await reportsApp.request('/999', {
        method: 'DELETE',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });
  });

  // ── PATCH /:id/toggle ────────────────────────────────────────────────────────
  describe('PATCH /:id/toggle', () => {
    it('toggles a report from active to inactive', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ report_id: 1, name: 'Test', active: true }] } as any)
        .mockResolvedValueOnce({ rows: [{ report_id: 1, name: 'Test', active: false, updated_at: new Date() }] } as any);

      const res = await reportsApp.request('/1/toggle', {
        method: 'PATCH',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.active).toBe(false);
    });
  });

  // ── POST /:id/run ────────────────────────────────────────────────────────────
  describe('POST /:id/run', () => {
    it('returns 400 for non-numeric ID', async () => {
      const res = await reportsApp.request('/abc/run', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(400);
    });

    it('returns 200 when report runs successfully', async () => {
      mockRunReport.mockResolvedValueOnce(undefined);

      const res = await reportsApp.request('/1/run', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV_WITH_RESEND);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(mockRunReport).toHaveBeenCalledWith(TEST_ENV_WITH_RESEND, 1);
    });

    it('returns 404 when report is not found or inactive', async () => {
      mockRunReport.mockRejectedValueOnce(new Error('Report 999 not found or inactive'));

      const res = await reportsApp.request('/999/run', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV_WITH_RESEND);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.message).toContain('not found or inactive');
    });

    it('returns 500 when report execution fails', async () => {
      mockRunReport.mockRejectedValueOnce(new Error('Email delivery failed'));

      const res = await reportsApp.request('/1/run', {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV_WITH_RESEND);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.message).toContain('Email delivery failed');
    });
  });

  // ── GET /:id/history ─────────────────────────────────────────────────────────
  describe('GET /:id/history', () => {
    it('returns history for a report', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ report_id: 1 }] } as any) // report exists
        .mockResolvedValueOnce({ rows: [{ total: '1' }] } as any)   // count
        .mockResolvedValueOnce({ rows: [{ report_history_id: 10, report_id: 1, status: 'success' }] } as any);

      const res = await reportsApp.request('/1/history', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.history).toHaveLength(1);
    });

    it('returns 404 when report does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const res = await reportsApp.request('/999/history', {
        headers: { authorization: 'Bearer valid-token' },
      }, TEST_ENV);

      expect(res.status).toBe(404);
    });
  });
});
