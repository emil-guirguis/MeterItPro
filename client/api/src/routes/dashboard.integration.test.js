// /**
//  * Integration Tests for Dashboard Routes
//  * 
//  * Tests the power column discovery endpoint with actual database queries.
//  */

// const request = require('supertest');
// const express = require('express');
// const dashboardRoutes = require('./dashboard');
// const db = require('../config/database');

// // Mock the authentication middleware
// jest.mock('../middleware/auth', () => ({
//   authenticateToken: (req, res, next) => {
//     req.user = { id: 1, tenantId: 1, tenant_id: 1, users_id: 1 };
//     next();
//   },
//   requirePermission: (permission) => (req, res, next) => {
//     next();
//   }
// }));

// describe('Dashboard Routes - Integration Tests', () => {
//   let app;

//   beforeEach(() => {
//     app = express();
//     app.use(express.json());
//     app.use('/api/dashboard', dashboardRoutes);
//   });

//   describe('GET /api/dashboard/power-columns', () => {
//     it('should discover power columns from meter_reading table schema', async () => {
//       // This test requires a real database connection
//       // Skip if database is not available
//       if (!db.pool) {
//         console.log('⏭️  Skipping integration test - database not connected');
//         return;
//       }

//       const response = await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(Array.isArray(response.body.data)).toBe(true);
//       expect(response.body.meta).toBeDefined();
//       expect(response.body.meta.count).toBeGreaterThanOrEqual(0);

//       // Verify column structure
//       if (response.body.data.length > 0) {
//         const column = response.body.data[0];
//         expect(column).toHaveProperty('name');
//         expect(column).toHaveProperty('type');
//         expect(column).toHaveProperty('label');
//         expect(column).toHaveProperty('nullable');
//         expect(column).toHaveProperty('hasDefault');
//       }
//     });

//     it('should filter out system columns', async () => {
//       if (!db.pool) {
//         console.log('⏭️  Skipping integration test - database not connected');
//         return;
//       }

//       const response = await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       const systemColumns = ['id', 'created_at', 'updated_at', 'tenant_id', 'meter_id'];
//       const returnedNames = response.body.data.map(col => col.name);

//       systemColumns.forEach(sysCol => {
//         expect(returnedNames).not.toContain(sysCol);
//       });
//     });

//     it('should only return numeric columns', async () => {
//       if (!db.pool) {
//         console.log('⏭️  Skipping integration test - database not connected');
//         return;
//       }

//       const response = await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       const numericTypes = [
//         'integer', 'bigint', 'smallint', 'numeric', 'decimal',
//         'real', 'double precision', 'int2', 'int4', 'int8', 'float4', 'float8'
//       ];

//       response.body.data.forEach(column => {
//         expect(numericTypes).toContain(column.type.toLowerCase());
//       });
//     });

//     it('should use cache on subsequent calls', async () => {
//       if (!db.pool) {
//         console.log('⏭️  Skipping integration test - database not connected');
//         return;
//       }

//       // First call
//       const response1 = await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       const isCached1 = response1.body.meta.cache.isCached;

//       // Second call should use cache
//       const response2 = await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       const isCached2 = response2.body.meta.cache.isCached;

//       // Second call should have cache enabled
//       expect(isCached2).toBe(true);
//       expect(response1.body.data).toEqual(response2.body.data);
//     });
//   });

//   describe('GET /api/dashboard/power-columns/cache/stats', () => {
//     it('should return cache statistics', async () => {
//       if (!db.pool) {
//         console.log('⏭️  Skipping integration test - database not connected');
//         return;
//       }

//       // First, populate the cache
//       await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       // Then get cache stats
//       const response = await request(app)
//         .get('/api/dashboard/power-columns/cache/stats')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toBeDefined();
//       expect(response.body.data.isCached).toBe(true);
//       expect(response.body.data.columnCount).toBeGreaterThanOrEqual(0);
//       expect(response.body.data.cacheTTL).toBe(3600000); // 1 hour
//     });
//   });

//   describe('GET /api/dashboard/power-columns/cache/invalidate', () => {
//     it('should invalidate the cache', async () => {
//       if (!db.pool) {
//         console.log('⏭️  Skipping integration test - database not connected');
//         return;
//       }

//       // First, populate the cache
//       await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       // Invalidate cache
//       const invalidateResponse = await request(app)
//         .get('/api/dashboard/power-columns/cache/invalidate')
//         .expect(200);

//       expect(invalidateResponse.body.success).toBe(true);
//       expect(invalidateResponse.body.data.isCached).toBe(false);

//       // Next call should query database again
//       const response = await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//     });
//   });

//   describe('GET /api/dashboard/cards/:id/data', () => {
//     it('should return 404 if card not found', async () => {
//       const response = await request(app)
//         .get('/api/dashboard/cards/999/data')
//         .expect(404);

//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toBe('Dashboard card not found');
//     });

//     it('should return 403 if card belongs to different tenant', async () => {
//       // Mock Dashboard.findById to return a card with different tenant
//       const Dashboard = require('../models/DashboardWithSchema');
//       jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//         id: 1,
//         card_name: 'Test Card',
//         tenant_id: 999,
//         meter_element_id: 1,
//         time_frame_type: 'last_month',
//         selected_columns: ['active_energy'],
//         visualization_type: 'line'
//       });

//       const response = await request(app)
//         .get('/api/dashboard/cards/1/data')
//         .expect(403);

//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toContain('permission');
//     });

//     it('should return aggregated data for valid card', async () => {
//       if (!db.pool) {
//         console.log('⏭️  Skipping integration test - database not connected');
//         return;
//       }

//       // Mock Dashboard.findById
//       const Dashboard = require('../models/DashboardWithSchema');
//       jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//         id: 1,
//         card_name: 'Test Card',
//         tenant_id: 1,
//         meter_element_id: 1,
//         time_frame_type: 'last_month',
//         selected_columns: ['active_energy'],
//         visualization_type: 'line',
//         custom_start_date: null,
//         custom_end_date: null
//       });

//       const response = await request(app)
//         .get('/api/dashboard/cards/1/data')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toBeDefined();
//       expect(response.body.data.card_id).toBe(1);
//       expect(response.body.data.card_name).toBe('Test Card');
//       expect(response.body.data.time_frame).toBeDefined();
//       expect(response.body.data.time_frame.type).toBe('last_month');
//       expect(response.body.data.aggregated_values).toBeDefined();
//       expect(response.body.data.selected_columns).toEqual(['active_energy']);
//       expect(response.body.data.visualization_type).toBe('line');
//     });

//     it('should include time frame boundaries in response', async () => {
//       if (!db.pool) {
//         console.log('⏭️  Skipping integration test - database not connected');
//         return;
//       }

//       const Dashboard = require('../models/DashboardWithSchema');
//       jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//         id: 1,
//         card_name: 'Test Card',
//         tenant_id: 1,
//         meter_element_id: 1,
//         time_frame_type: 'this_month_to_date',
//         selected_columns: ['power'],
//         visualization_type: 'line',
//         custom_start_date: null,
//         custom_end_date: null
//       });

//       const response = await request(app)
//         .get('/api/dashboard/cards/1/data')
//         .expect(200);

//       expect(response.body.data.time_frame).toBeDefined();
//       expect(response.body.data.time_frame.start).toBeDefined();
//       expect(response.body.data.time_frame.end).toBeDefined();
//       expect(response.body.data.time_frame.type).toBe('this_month_to_date');

//       // Verify dates are ISO strings
//       expect(typeof response.body.data.time_frame.start).toBe('string');
//       expect(typeof response.body.data.time_frame.end).toBe('string');
//     });
//   });
// });
