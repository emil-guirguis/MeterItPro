/**
 * Tests for Report History API Endpoints
 * 
 * Tests for:
 * - GET /api/reports/:id/history
 * - GET /api/reports/:id/history/:historyId/emails
 */

const request = require('supertest');
const express = require('express');

// Mock database module before importing routes
jest.mock('../config/database', () => ({
  query: jest.fn(),
  pool: {
    query: jest.fn()
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: true
}));

const db = require('../config/database');
const reportsRouter = require('./reports');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock authentication middleware
  app.use((req, res, next) => {
    req.user = { id: 'test-user-id', tenant_id: 'test-tenant-id' };
    next();
  });
  
  app.use('/api/reports', reportsRouter);
  
  return app;
};

describe('Report History API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/reports/:id/history - Get Report History', () => {
    const reportId = '550e8400-e29b-41d4-a716-446655440000';
    const mockHistory = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        report_id: reportId,
        executed_at: new Date('2024-01-15T09:00:00Z').toISOString(),
        status: 'success',
        error_message: null,
        created_at: new Date('2024-01-15T09:00:00Z').toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        report_id: reportId,
        executed_at: new Date('2024-01-14T09:00:00Z').toISOString(),
        status: 'failed',
        error_message: 'Database connection timeout',
        created_at: new Date('2024-01-14T09:00:00Z').toISOString()
      }
    ];

    test('should retrieve report history with pagination', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: mockHistory }); // history query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    test('should support date range filtering', async () => {
      const startDate = '2024-01-14T00:00:00Z';
      const endDate = '2024-01-16T00:00:00Z';

      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: mockHistory }); // history query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toHaveLength(2);
    });

    test('should return 404 when report not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // report not found

      const response = await request(app)
        .get(`/api/reports/${reportId}/history`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Report not found');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/reports/invalid-id/history')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID format');
    });

    test('should return 400 for invalid date format', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: reportId }] }); // report exists

      const response = await request(app)
        .get(`/api/reports/${reportId}/history?startDate=invalid-date`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid startDate format');
    });

    test('should support custom pagination parameters', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ total: '50' }] }) // count query
        .mockResolvedValueOnce({ rows: mockHistory.slice(0, 1) }); // history query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history?page=2&limit=5`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.totalPages).toBe(10);
    });

    test('should return empty history when no executions exist', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ total: '0' }] }) // count query
        .mockResolvedValueOnce({ rows: [] }); // history query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history`)
        .expect(200);

      expect(response.body.data.history).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/reports/:id/history/:historyId/emails - Get Email Logs', () => {
    const reportId = '550e8400-e29b-41d4-a716-446655440000';
    const historyId = '550e8400-e29b-41d4-a716-446655440001';
    const mockEmails = [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        report_id: reportId,
        history_id: historyId,
        recipient: 'user1@example.com',
        sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
        status: 'delivered',
        error_details: null,
        created_at: new Date('2024-01-15T09:00:00Z').toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        report_id: reportId,
        history_id: historyId,
        recipient: 'user2@example.com',
        sent_at: new Date('2024-01-15T09:00:01Z').toISOString(),
        status: 'failed',
        error_details: 'Invalid email address',
        created_at: new Date('2024-01-15T09:00:01Z').toISOString()
      }
    ];

    test('should retrieve email logs for a report execution', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists check
        .mockResolvedValueOnce({ rows: [{ id: historyId }] }) // history exists check
        .mockResolvedValueOnce({ rows: mockEmails }); // emails query

      const response = await request(app)
        .get(`/api/reports/${reportId}/history/${historyId}/emails`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(2);
      expect(response.body.data.emails[0].recipient).toBe('user1@example.com');
      expect(response.body.data.emails[1].status).toBe('failed');
    });

    test('should return 404 when report not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // report not found

      const response = await request(app)
        .get(`/api/reports/${reportId}/history/${historyId}/emails`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Report not found');
    });

    test('should return 404 when history entry not found', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists
        .mockResolvedValueOnce({ rows: [] }); // history not found

      const response = await request(app)
        .get(`/api/reports/${reportId}/history/${historyId}/emails`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('History entry not found');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get(`/api/reports/invalid-id/history/${historyId}/emails`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID or history ID format');
    });

    test('should return empty email list when no emails sent', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: reportId }] }) // report exists
        .mockResolvedValueOnce({ rows: [{ id: historyId }] }) // history exists
        .mockResolvedValueOnce({ rows: [] }); // no emails

      const response = await request(app)
        .get(`/api/reports/${reportId}/history/${historyId}/emails`)
        .expect(200);

      expect(response.body.data.emails).toHaveLength(0);
    });
  });
});
