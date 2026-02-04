/**
 * AI Search Route Tests
 * Unit tests for the AI search functionality
 */

const request = require('supertest');
const express = require('express');

// Mock database BEFORE importing the route
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../config/database');
const aiSearchRouter = require('./aiSearch');

// Create a test Express app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock tenant context middleware
  app.use((req, res, next) => {
    req.tenantId = 'test-tenant-123';
    next();
  });
  
  app.use('/api/ai/search', aiSearchRouter);
  
  return app;
};

describe('AI Search Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unit Tests', () => {
    describe('POST /api/ai/search', () => {
      describe('Input Validation', () => {
        it('should return 400 when query is missing', async () => {
          const app = createTestApp();
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({});
          
          expect(response.status).toBe(400);
          expect(response.body.error.code).toBe('INVALID_QUERY');
        });

        it('should return 400 when query is empty string', async () => {
          const app = createTestApp();
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: '' });
          
          expect(response.status).toBe(400);
          expect(response.body.error.code).toBe('INVALID_QUERY');
        });

        it('should return 400 when query is not a string', async () => {
          const app = createTestApp();
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 123 });
          
          expect(response.status).toBe(400);
          expect(response.body.error.code).toBe('INVALID_QUERY');
        });

        it('should return 400 when limit is not a positive integer', async () => {
          const app = createTestApp();
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'test', limit: -1 });
          
          expect(response.status).toBe(400);
          expect(response.body.error.code).toBe('INVALID_LIMIT');
        });

        it('should return 400 when offset is negative', async () => {
          const app = createTestApp();
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'test', offset: -1 });
          
          expect(response.status).toBe(400);
          expect(response.body.error.code).toBe('INVALID_OFFSET');
        });
      });

      describe('Search Results', () => {
        it('should return empty results when no devices exist', async () => {
          const app = createTestApp();
          db.query.mockResolvedValueOnce({ rows: [] });
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'test' });
          
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.data.results).toEqual([]);
          expect(response.body.data.total).toBe(0);
        });

        it('should return devices matching exact name', async () => {
          const app = createTestApp();
          const mockDevices = [
            {
              id: 'device-1',
              tenantId: 'test-tenant-123',
              name: 'Main Meter',
              type: 'meter',
              location: 'Building A',
              status: 'active',
              metadata: {}
            }
          ];
          
          db.query
            .mockResolvedValueOnce({ rows: mockDevices })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'Main Meter' });
          
          expect(response.status).toBe(200);
          expect(response.body.data.results.length).toBeGreaterThan(0);
          expect(response.body.data.results[0].name).toBe('Main Meter');
        });

        it('should return devices matching partial name', async () => {
          const app = createTestApp();
          const mockDevices = [
            {
              id: 'device-1',
              tenantId: 'test-tenant-123',
              name: 'Main Meter',
              type: 'meter',
              location: 'Building A',
              status: 'active',
              metadata: {}
            }
          ];
          
          db.query
            .mockResolvedValueOnce({ rows: mockDevices })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'Main' });
          
          expect(response.status).toBe(200);
          expect(response.body.data.results.length).toBeGreaterThan(0);
        });

        it('should include devices without readings', async () => {
          const app = createTestApp();
          const mockDevices = [
            {
              id: 'device-1',
              tenantId: 'test-tenant-123',
              name: 'New Device',
              type: 'meter',
              location: 'Building A',
              status: 'active',
              metadata: {}
            }
          ];
          
          db.query
            .mockResolvedValueOnce({ rows: mockDevices })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'New Device' });
          
          expect(response.status).toBe(200);
          expect(response.body.data.results.length).toBeGreaterThan(0);
          expect(response.body.data.results[0].lastReading.value).toBe(0);
        });

        it('should sort results by relevance score descending', async () => {
          const app = createTestApp();
          const mockDevices = [
            {
              id: 'device-1',
              tenantId: 'test-tenant-123',
              name: 'meter',
              type: 'meter',
              location: 'Building A',
              status: 'active',
              metadata: {}
            },
            {
              id: 'device-2',
              tenantId: 'test-tenant-123',
              name: 'Main Meter',
              type: 'meter',
              location: 'Building A',
              status: 'active',
              metadata: {}
            }
          ];
          
          db.query
            .mockResolvedValueOnce({ rows: mockDevices })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'meter' });
          
          expect(response.status).toBe(200);
          const results = response.body.data.results;
          if (results.length > 1) {
            expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1].relevanceScore);
          }
        });

        it('should respect pagination limit', async () => {
          const app = createTestApp();
          const mockDevices = Array.from({ length: 10 }, (_, i) => ({
            id: `device-${i}`,
            tenantId: 'test-tenant-123',
            name: `Device ${i}`,
            type: 'meter',
            location: 'Building A',
            status: 'active',
            metadata: {}
          }));
          
          db.query
            .mockResolvedValueOnce({ rows: mockDevices })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'Device', limit: 5 });
          
          expect(response.status).toBe(200);
          expect(response.body.data.results.length).toBeLessThanOrEqual(5);
        });

        it('should respect pagination offset', async () => {
          const app = createTestApp();
          const mockDevices = Array.from({ length: 10 }, (_, i) => ({
            id: `device-${i}`,
            tenantId: 'test-tenant-123',
            name: `Device ${i}`,
            type: 'meter',
            location: 'Building A',
            status: 'active',
            metadata: {}
          }));
          
          db.query
            .mockResolvedValueOnce({ rows: mockDevices })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'Device', limit: 5, offset: 5 });
          
          expect(response.status).toBe(200);
          expect(response.body.data.results.length).toBeLessThanOrEqual(5);
        });

        it('should handle case-insensitive search', async () => {
          const app = createTestApp();
          const mockDevices = [
            {
              id: 'device-1',
              tenantId: 'test-tenant-123',
              name: 'MAIN METER',
              type: 'meter',
              location: 'Building A',
              status: 'active',
              metadata: {}
            }
          ];
          
          db.query
            .mockResolvedValueOnce({ rows: mockDevices })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'main meter' });
          
          expect(response.status).toBe(200);
          expect(response.body.data.results.length).toBeGreaterThan(0);
        });

        it('should include device with readings', async () => {
          const app = createTestApp();
          const mockDevices = [
            {
              id: 'device-1',
              tenantId: 'test-tenant-123',
              name: 'Main Meter',
              type: 'meter',
              location: 'Building A',
              status: 'active',
              metadata: {}
            }
          ];
          const mockMeters = [
            {
              id: 'meter-1',
              tenantId: 'test-tenant-123',
              deviceId: 'device-1',
              name: 'Meter 1',
              unit: 'kWh',
              type: 'electric'
            }
          ];
          const mockReadings = [
            {
              meterId: 'meter-1',
              value: 100,
              timestamp: new Date().toISOString(),
              quality: 'good'
            }
          ];
          
          db.query
            .mockResolvedValueOnce({ rows: mockDevices })
            .mockResolvedValueOnce({ rows: mockMeters })
            .mockResolvedValueOnce({ rows: mockReadings });
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'Main Meter' });
          
          expect(response.status).toBe(200);
          expect(response.body.data.results.length).toBeGreaterThan(0);
          expect(response.body.data.results[0].currentConsumption).toBe(100);
        });
      });

      describe('Error Handling', () => {
        it('should return 500 on database error', async () => {
          const app = createTestApp();
          db.query.mockRejectedValueOnce(new Error('Database connection failed'));
          
          const response = await request(app)
            .post('/api/ai/search')
            .send({ query: 'test' });
          
          expect(response.status).toBe(500);
          expect(response.body.error.code).toBe('INTERNAL_ERROR');
        });
      });
    });
  });
});
