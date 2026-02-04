/**
 * Tests for Email Logs API Endpoints
 * 
 * Tests for:
 * - GET /api/email-logs/search
 * - GET /api/email-logs/export
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
const emailLogsRouter = require('./email-logs');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock authentication middleware
  app.use((req, res, next) => {
    req.user = { id: 'test-user-id', tenant_id: 'test-tenant-id' };
    next();
  });
  
  app.use('/api/email-logs', emailLogsRouter);
  
  return app;
};

describe('Email Logs API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/email-logs/search - Search Email Logs', () => {
    const mockEmails = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        report_id: '550e8400-e29b-41d4-a716-446655440000',
        history_id: '550e8400-e29b-41d4-a716-446655440002',
        recipient: 'user1@example.com',
        sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
        status: 'delivered',
        error_details: null,
        created_at: new Date('2024-01-15T09:00:00Z').toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        report_id: '550e8400-e29b-41d4-a716-446655440000',
        history_id: '550e8400-e29b-41d4-a716-446655440002',
        recipient: 'user1@example.com',
        sent_at: new Date('2024-01-14T09:00:00Z').toISOString(),
        status: 'failed',
        error_details: 'Invalid email address',
        created_at: new Date('2024-01-14T09:00:00Z').toISOString()
      }
    ];

    test('should search email logs by recipient', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: mockEmails }); // search query

      const response = await request(app)
        .get('/api/email-logs/search?recipient=user1@example.com')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    test('should support pagination in search', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '50' }] }) // count query
        .mockResolvedValueOnce({ rows: mockEmails.slice(0, 1) }); // search query

      const response = await request(app)
        .get('/api/email-logs/search?recipient=user1@example.com&page=2&limit=5')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.totalPages).toBe(10);
    });

    test('should return 400 when recipient parameter is missing', async () => {
      const response = await request(app)
        .get('/api/email-logs/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Recipient parameter is required');
    });

    test('should return 400 when recipient parameter is empty', async () => {
      const response = await request(app)
        .get('/api/email-logs/search?recipient=')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Recipient parameter is required');
    });

    test('should return empty results when no matches found', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] }) // count query
        .mockResolvedValueOnce({ rows: [] }); // search query

      const response = await request(app)
        .get('/api/email-logs/search?recipient=nonexistent@example.com')
        .expect(200);

      expect(response.body.data.emails).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    test('should support partial recipient matching', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: mockEmails }); // search query

      const response = await request(app)
        .get('/api/email-logs/search?recipient=user1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(2);
    });
  });

  describe('GET /api/email-logs/export - Export Email Logs', () => {
    const mockEmails = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        report_id: '550e8400-e29b-41d4-a716-446655440000',
        history_id: '550e8400-e29b-41d4-a716-446655440002',
        recipient: 'user1@example.com',
        sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
        status: 'delivered',
        error_details: null,
        created_at: new Date('2024-01-15T09:00:00Z').toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        report_id: '550e8400-e29b-41d4-a716-446655440000',
        history_id: '550e8400-e29b-41d4-a716-446655440002',
        recipient: 'user2@example.com',
        sent_at: new Date('2024-01-14T09:00:00Z').toISOString(),
        status: 'failed',
        error_details: 'Invalid email address',
        created_at: new Date('2024-01-14T09:00:00Z').toISOString()
      }
    ];

    test('should export email logs as CSV by default', async () => {
      db.query.mockResolvedValueOnce({ rows: mockEmails });

      const response = await request(app)
        .get('/api/email-logs/export')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('email-logs');
      expect(response.text).toContain('ID,Report ID,History ID,Recipient,Sent At,Status,Error Details,Created At');
      expect(response.text).toContain('user1@example.com');
      expect(response.text).toContain('user2@example.com');
    });

    test('should export email logs as CSV', async () => {
      db.query.mockResolvedValueOnce({ rows: mockEmails });

      const response = await request(app)
        .get('/api/email-logs/export?format=csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('email-logs');
      expect(response.text).toContain('ID,Report ID,History ID,Recipient,Sent At,Status,Error Details,Created At');
      expect(response.text).toContain('user1@example.com');
      expect(response.text).toContain('user2@example.com');
    });

    test('should export email logs as JSON with format parameter', async () => {
      db.query.mockResolvedValueOnce({ rows: mockEmails });

      const response = await request(app)
        .get('/api/email-logs/export?format=json')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(2);
    });

    test('should return 400 for invalid format parameter', async () => {
      const response = await request(app)
        .get('/api/email-logs/export?format=xml')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Format must be either "csv" or "json"');
    });

    test('should filter by report ID', async () => {
      const reportId = '550e8400-e29b-41d4-a716-446655440000';
      db.query.mockResolvedValueOnce({ rows: mockEmails });

      const response = await request(app)
        .get(`/api/email-logs/export?reportId=${reportId}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('user1@example.com');
    });

    test('should return 400 for invalid report ID format', async () => {
      const response = await request(app)
        .get('/api/email-logs/export?reportId=invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID format');
    });

    test('should filter by date range', async () => {
      const startDate = '2024-01-14T00:00:00Z';
      const endDate = '2024-01-16T00:00:00Z';
      db.query.mockResolvedValueOnce({ rows: mockEmails });

      const response = await request(app)
        .get(`/api/email-logs/export?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('user1@example.com');
    });

    test('should return 400 for invalid startDate format', async () => {
      const response = await request(app)
        .get('/api/email-logs/export?startDate=invalid-date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid startDate format');
    });

    test('should return 400 for invalid endDate format', async () => {
      const response = await request(app)
        .get('/api/email-logs/export?endDate=invalid-date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid endDate format');
    });

    test('should export empty CSV with headers when no records', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/email-logs/export?format=csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('ID,Report ID,History ID,Recipient,Sent At,Status,Error Details,Created At');
    });

    test('should export empty JSON when no records', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/email-logs/export?format=json')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emails).toHaveLength(0);
      expect(response.body.data.count).toBe(0);
    });

    test('should handle CSV export with error details containing quotes', async () => {
      const emailsWithQuotes = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          report_id: '550e8400-e29b-41d4-a716-446655440000',
          history_id: '550e8400-e29b-41d4-a716-446655440002',
          recipient: 'user1@example.com',
          sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
          status: 'failed',
          error_details: 'Error: "Invalid" email',
          created_at: new Date('2024-01-15T09:00:00Z').toISOString()
        }
      ];

      db.query.mockResolvedValueOnce({ rows: emailsWithQuotes });

      const response = await request(app)
        .get('/api/email-logs/export?format=csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Error: ""Invalid"" email');
    });
  });
});
