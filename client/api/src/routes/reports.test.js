/**
 * Tests for Report API Endpoints
 * 
 * Tests all CRUD operations for reports
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

describe('Report API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/reports - Create Report', () => {
    test('should create a report with valid configuration', async () => {
      const reportData = {
        name: 'Daily Sales Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['user@example.com'],
        config: { format: 'csv' }
      };

      db.pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'report-123',
          ...reportData,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      });

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('report-123');
      expect(response.body.data.name).toBe(reportData.name);
      expect(response.body.data.enabled).toBe(true);
    });

    test('should reject report with invalid email', async () => {
      const reportData = {
        name: 'Test Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['invalid-email']
      };

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(expect.stringContaining('email'));
    });

    test('should reject report with invalid cron', async () => {
      const reportData = {
        name: 'Test Report',
        type: 'meter_readings',
        schedule: 'invalid cron',
        recipients: ['user@example.com']
      };

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(expect.stringContaining('cron'));
    });

    test('should reject report with missing required fields', async () => {
      const reportData = {
        name: 'Test Report'
        // missing type, schedule, recipients
      };

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/reports - List Reports', () => {
    test('should retrieve all reports with pagination', async () => {
      const mockReports = [
        {
          id: 'report-1',
          name: 'Report 1',
          type: 'meter_readings',
          schedule: '0 9 * * *',
          recipients: ['user@example.com'],
          config: {},
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      db.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: mockReports });

      const response = await request(app)
        .get('/api/reports')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reports).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(1);
      expect(response.body.data.pagination.page).toBe(1);
    });

    test('should support pagination parameters', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '50' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/reports?page=2&limit=5')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.totalPages).toBe(10);
    });

    test('should return empty list when no reports exist', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/reports')
        .expect(200);

      expect(response.body.data.reports).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/reports/:id - Get Report', () => {
    test('should retrieve a specific report by ID', async () => {
      const reportId = '550e8400-e29b-41d4-a716-446655440000';
      const mockReport = {
        id: reportId,
        name: 'Test Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['user@example.com'],
        config: {},
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      db.query.mockResolvedValueOnce({ rows: [mockReport] });

      const response = await request(app)
        .get(`/api/reports/${reportId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(reportId);
      expect(response.body.data.name).toBe('Test Report');
    });

    test('should return 404 when report not found', async () => {
      const reportId = '550e8400-e29b-41d4-a716-446655440000';
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get(`/api/reports/${reportId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Report not found');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/reports/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID format');
    });
  });

  describe('PUT /api/reports/:id - Update Report', () => {
    test('should reject invalid cron expression in update', async () => {
      const reportId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = { schedule: 'invalid cron' };

      db.query.mockResolvedValueOnce({ rows: [{ id: reportId }] });

      const response = await request(app)
        .put(`/api/reports/${reportId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(expect.stringContaining('cron'));
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .put('/api/reports/invalid-id')
        .send({ name: 'Updated Name' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID format');
    });
  });

  describe('DELETE /api/reports/:id - Delete Report', () => {
    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .delete('/api/reports/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID format');
    });
  });

  describe('PATCH /api/reports/:id/toggle - Toggle Report Status', () => {
    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .patch('/api/reports/invalid-id/toggle')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid report ID format');
    });
  });
});
