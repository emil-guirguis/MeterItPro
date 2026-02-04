// /**
//  * Tests for Dashboard Routes
//  */

// const request = require('supertest');
// const express = require('express');
// const dashboardRoutes = require('./dashboard');
// const PowerColumnDiscoveryService = require('../services/PowerColumnDiscoveryService');

// // Mock the authentication middleware
// jest.mock('../middleware/auth', () => ({
//   authenticateToken: (req, res, next) => {
//     req.user = { 
//       id: 1, 
//       users_id: 1,
//       tenant_id: 1 
//     };
//     next();
//   },
//   requirePermission: (permission) => (req, res, next) => {
//     // Mock permission check - always allow for tests
//     next();
//   }
// }));

// // Mock the PowerColumnDiscoveryService
// jest.mock('../services/PowerColumnDiscoveryService');

// describe('Dashboard Routes', () => {
//   let app;

//   beforeEach(() => {
//     app = express();
//     app.use(express.json());
//     app.use('/api/dashboard', dashboardRoutes);
//     jest.clearAllMocks();
//   });

//   describe('GET /api/dashboard/power-columns', () => {
//     it('should return available power columns', async () => {
//       const mockColumns = [
//         {
//           name: 'active_energy',
//           type: 'numeric',
//           label: 'Active Energy',
//           nullable: true,
//           hasDefault: false
//         },
//         {
//           name: 'power',
//           type: 'double precision',
//           label: 'Power',
//           nullable: true,
//           hasDefault: false
//         },
//         {
//           name: 'voltage',
//           type: 'real',
//           label: 'Voltage',
//           nullable: true,
//           hasDefault: false
//         }
//       ];

//       PowerColumnDiscoveryService.discoverColumns.mockResolvedValueOnce(mockColumns);
//       PowerColumnDiscoveryService.getCacheStats.mockReturnValueOnce({
//         isCached: false,
//         columnCount: 3,
//         cacheAge: null,
//         cacheTTL: 3600000,
//         isValid: false
//       });

//       const response = await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toHaveLength(3);
//       expect(response.body.data[0].name).toBe('active_energy');
//       expect(response.body.meta.count).toBe(3);
//     });

//     it('should include cache statistics in response', async () => {
//       const mockColumns = [];

//       PowerColumnDiscoveryService.discoverColumns.mockResolvedValueOnce(mockColumns);
//       PowerColumnDiscoveryService.getCacheStats.mockReturnValueOnce({
//         isCached: true,
//         columnCount: 0,
//         cacheAge: 1000,
//         cacheTTL: 3600000,
//         isValid: true
//       });

//       const response = await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(200);

//       expect(response.body.meta.cache).toBeDefined();
//       expect(response.body.meta.cache.isCached).toBe(true);
//     });

//     it('should handle errors gracefully', async () => {
//       const error = new Error('Database connection failed');
//       PowerColumnDiscoveryService.discoverColumns.mockRejectedValueOnce(error);

//       const response = await request(app)
//         .get('/api/dashboard/power-columns')
//         .expect(500);

//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toBe('Failed to discover power columns');
//     });
//   });

//   describe('GET /api/dashboard/power-columns/cache/invalidate', () => {
//     it('should invalidate the cache', async () => {
//       PowerColumnDiscoveryService.invalidateCache.mockImplementationOnce(() => {});
//       PowerColumnDiscoveryService.getCacheStats.mockReturnValueOnce({
//         isCached: false,
//         columnCount: 0,
//         cacheAge: null,
//         cacheTTL: 3600000,
//         isValid: false
//       });

//       const response = await request(app)
//         .get('/api/dashboard/power-columns/cache/invalidate')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.message).toBe('Power columns cache invalidated');
//       expect(PowerColumnDiscoveryService.invalidateCache).toHaveBeenCalled();
//     });

//     it('should return updated cache stats after invalidation', async () => {
//       PowerColumnDiscoveryService.invalidateCache.mockImplementationOnce(() => {});
//       PowerColumnDiscoveryService.getCacheStats.mockReturnValueOnce({
//         isCached: false,
//         columnCount: 0,
//         cacheAge: null,
//         cacheTTL: 3600000,
//         isValid: false
//       });

//       const response = await request(app)
//         .get('/api/dashboard/power-columns/cache/invalidate')
//         .expect(200);

//       expect(response.body.data.isCached).toBe(false);
//     });
//   });

//   describe('GET /api/dashboard/power-columns/cache/stats', () => {
//     it('should return cache statistics', async () => {
//       PowerColumnDiscoveryService.getCacheStats.mockReturnValueOnce({
//         isCached: true,
//         columnCount: 5,
//         cacheAge: 2000,
//         cacheTTL: 3600000,
//         isValid: true
//       });

//       const response = await request(app)
//         .get('/api/dashboard/power-columns/cache/stats')
//         .expect(200);

//       expect(response.body.success).toBe(true);
//       expect(response.body.data.isCached).toBe(true);
//       expect(response.body.data.columnCount).toBe(5);
//       expect(response.body.data.cacheAge).toBe(2000);
//     });

//     it('should handle errors when getting cache stats', async () => {
//       PowerColumnDiscoveryService.getCacheStats.mockImplementationOnce(() => {
//         throw new Error('Cache stats error');
//       });

//       const response = await request(app)
//         .get('/api/dashboard/power-columns/cache/stats')
//         .expect(500);

//       expect(response.body.success).toBe(false);
//       expect(response.body.message).toBe('Failed to get cache statistics');
//     });
//   });

//   describe('Dashboard Card CRUD Endpoints', () => {
//     describe('GET /api/dashboard/cards', () => {
//       it('should return all dashboard cards for tenant', async () => {
//         // Mock Dashboard.findAll
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findAll').mockResolvedValueOnce({
//           rows: [
//             {
//               id: 1,
//               card_name: 'Test Card',
//               tenant_id: 1
//             }
//           ],
//           pagination: { total: 1, totalPages: 1 }
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards')
//           .expect(200);

//         expect(response.body.success).toBe(true);
//         expect(response.body.data.items).toHaveLength(1);
//         expect(response.body.data.total).toBe(1);
//       });
//     });

//     describe('GET /api/dashboard/cards/:id', () => {
//       it('should return a single dashboard card', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1')
//           .expect(200);

//         expect(response.body.success).toBe(true);
//         expect(response.body.data.id).toBe(1);
//       });

//       it('should return 404 if card not found', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce(null);

//         const response = await request(app)
//           .get('/api/dashboard/cards/999')
//           .expect(404);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toBe('Dashboard card not found');
//       });

//       it('should return 403 if card belongs to different tenant', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 999
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1')
//           .expect(403);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toContain('permission');
//       });
//     });

//     describe('GET /api/dashboard/cards/:id/data', () => {
//       it('should return 404 if card not found', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce(null);

//         const response = await request(app)
//           .get('/api/dashboard/cards/999/data')
//           .expect(404);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toBe('Dashboard card not found');
//       });

//       it('should return 403 if card belongs to different tenant', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 999,
//           meter_element_id: 1,
//           time_frame_type: 'last_month',
//           selected_columns: ['active_energy'],
//           visualization_type: 'line'
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/data')
//           .expect(403);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toContain('permission');
//       });

//       it('should return aggregated data for valid card', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
//         const DataAggregationService = require('../services/DataAggregationService');

//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1,
//           meter_element_id: 1,
//           time_frame_type: 'last_month',
//           selected_columns: ['active_energy'],
//           visualization_type: 'line',
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         jest.spyOn(TimeFrameCalculationService, 'calculateTimeFrame').mockResolvedValueOnce({
//           start: new Date('2024-01-01'),
//           end: new Date('2024-01-31'),
//           type: 'last_month'
//         });

//         jest.spyOn(DataAggregationService, 'aggregateCardData').mockResolvedValueOnce({
//           active_energy: 1250.50
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/data')
//           .expect(200);

//         expect(response.body.success).toBe(true);
//         expect(response.body.data).toBeDefined();
//         expect(response.body.data.card_id).toBe(1);
//         expect(response.body.data.card_name).toBe('Test Card');
//         expect(response.body.data.time_frame).toBeDefined();
//         expect(response.body.data.time_frame.type).toBe('last_month');
//         expect(response.body.data.aggregated_values).toEqual({ active_energy: 1250.50 });
//         expect(response.body.data.selected_columns).toEqual(['active_energy']);
//         expect(response.body.data.visualization_type).toBe('line');
//       });

//       it('should include time frame boundaries in response', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
//         const DataAggregationService = require('../services/DataAggregationService');

//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1,
//           meter_element_id: 1,
//           time_frame_type: 'this_month_to_date',
//           selected_columns: ['power'],
//           visualization_type: 'line',
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         const startDate = new Date();
//         startDate.setDate(1);
//         const endDate = new Date();

//         jest.spyOn(TimeFrameCalculationService, 'calculateTimeFrame').mockResolvedValueOnce({
//           start: startDate,
//           end: endDate,
//           type: 'this_month_to_date'
//         });

//         jest.spyOn(DataAggregationService, 'aggregateCardData').mockResolvedValueOnce({
//           power: 45.25
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/data')
//           .expect(200);

//         expect(response.body.data.time_frame).toBeDefined();
//         expect(response.body.data.time_frame.start).toBeDefined();
//         expect(response.body.data.time_frame.end).toBeDefined();
//         expect(response.body.data.time_frame.type).toBe('this_month_to_date');

//         // Verify dates are ISO strings
//         expect(typeof response.body.data.time_frame.start).toBe('string');
//         expect(typeof response.body.data.time_frame.end).toBe('string');
//       });

//       it('should handle custom time frame', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
//         const DataAggregationService = require('../services/DataAggregationService');

//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1,
//           meter_element_id: 1,
//           time_frame_type: 'custom',
//           selected_columns: ['active_energy', 'power'],
//           visualization_type: 'bar',
//           custom_start_date: new Date('2024-01-15'),
//           custom_end_date: new Date('2024-01-20')
//         });

//         jest.spyOn(TimeFrameCalculationService, 'calculateTimeFrame').mockResolvedValueOnce({
//           start: new Date('2024-01-15'),
//           end: new Date('2024-01-20'),
//           type: 'custom'
//         });

//         jest.spyOn(DataAggregationService, 'aggregateCardData').mockResolvedValueOnce({
//           active_energy: 500.25,
//           power: 30.50
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/data')
//           .expect(200);

//         expect(response.body.data.time_frame.type).toBe('custom');
//         expect(response.body.data.aggregated_values).toEqual({
//           active_energy: 500.25,
//           power: 30.50
//         });
//       });

//       it('should handle empty aggregation results', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
//         const DataAggregationService = require('../services/DataAggregationService');

//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1,
//           meter_element_id: 1,
//           time_frame_type: 'last_month',
//           selected_columns: ['active_energy'],
//           visualization_type: 'line',
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         jest.spyOn(TimeFrameCalculationService, 'calculateTimeFrame').mockResolvedValueOnce({
//           start: new Date('2024-01-01'),
//           end: new Date('2024-01-31'),
//           type: 'last_month'
//         });

//         jest.spyOn(DataAggregationService, 'aggregateCardData').mockResolvedValueOnce({
//           active_energy: null
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/data')
//           .expect(200);

//         expect(response.body.success).toBe(true);
//         expect(response.body.data.aggregated_values.active_energy).toBeNull();
//       });
//     });

//     describe('POST /api/dashboard/cards', () => {
//       it('should reject if meter element not found', async () => {
//         const MeterElements = require('../models/MeterElementsWithSchema');
//         jest.spyOn(MeterElements, 'findById').mockResolvedValueOnce(null);

//         const response = await request(app)
//           .post('/api/dashboard/cards')
//           .send({
//             card_name: 'New Card',
//             meter_element_id: 999,
//             meter_id: 1,
//             selected_columns: ['active_energy'],
//             time_frame_type: 'last_month',
//             visualization_type: 'line'
//           })
//           .expect(400);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toContain('Meter element');
//       });

//       it('should reject if meter not found', async () => {
//         const MeterElements = require('../models/MeterElementsWithSchema');
//         const Meter = require('../models/MeterWithSchema');
//         jest.spyOn(MeterElements, 'findById').mockResolvedValueOnce({ id: 1 });
//         jest.spyOn(Meter, 'findById').mockResolvedValueOnce(null);

//         const response = await request(app)
//           .post('/api/dashboard/cards')
//           .send({
//             card_name: 'New Card',
//             meter_element_id: 1,
//             meter_id: 999,
//             selected_columns: ['active_energy'],
//             time_frame_type: 'last_month',
//             visualization_type: 'line'
//           })
//           .expect(400);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toContain('Meter');
//       });

//       it('should reject if selected_columns is empty', async () => {
//         const MeterElements = require('../models/MeterElementsWithSchema');
//         const Meter = require('../models/MeterWithSchema');
//         jest.spyOn(MeterElements, 'findById').mockResolvedValueOnce({ id: 1 });
//         jest.spyOn(Meter, 'findById').mockResolvedValueOnce({ id: 1 });

//         const response = await request(app)
//           .post('/api/dashboard/cards')
//           .send({
//             card_name: 'New Card',
//             meter_element_id: 1,
//             meter_id: 1,
//             selected_columns: [],
//             time_frame_type: 'last_month',
//             visualization_type: 'line'
//           })
//           .expect(400);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toContain('Validation');
//       });
//     });

//     describe('PUT /api/dashboard/cards/:id', () => {
//       it('should return 404 if card not found', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce(null);

//         const response = await request(app)
//           .put('/api/dashboard/cards/999')
//           .send({ card_name: 'Updated' })
//           .expect(404);

//         expect(response.body.success).toBe(false);
//       });

//       it('should return 403 if card belongs to different tenant', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 999
//         });

//         const response = await request(app)
//           .put('/api/dashboard/cards/1')
//           .send({ card_name: 'Updated' })
//           .expect(403);

//         expect(response.body.success).toBe(false);
//       });

//       it('should reject if meter element not found', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const MeterElements = require('../models/MeterElementsWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1,
//           meter_element_id: 1
//         });
//         jest.spyOn(MeterElements, 'findById').mockResolvedValueOnce(null);

//         const response = await request(app)
//           .put('/api/dashboard/cards/1')
//           .send({
//             meter_element_id: 999
//           })
//           .expect(400);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toContain('Validation');
//       });
//     });

//     describe('DELETE /api/dashboard/cards/:id', () => {
//       it('should return 404 if card not found', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce(null);

//         const response = await request(app)
//           .delete('/api/dashboard/cards/999')
//           .expect(404);

//         expect(response.body.success).toBe(false);
//       });

//       it('should return 403 if card belongs to different tenant', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 999
//         });

//         const response = await request(app)
//           .delete('/api/dashboard/cards/1')
//           .expect(403);

//         expect(response.body.success).toBe(false);
//       });
//     });

//     describe('GET /api/dashboard/cards/:id/readings', () => {
//       it('should return 404 if card not found', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce(null);

//         const response = await request(app)
//           .get('/api/dashboard/cards/999/readings')
//           .expect(404);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toBe('Dashboard card not found');
//       });

//       it('should return 403 if card belongs to different tenant', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 999,
//           meter_element_id: 1,
//           time_frame_type: 'last_month',
//           selected_columns: ['active_energy'],
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/readings')
//           .expect(403);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toContain('permission');
//       });

//       it('should return paginated meter readings for valid card', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
//         const db = require('../config/database');

//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1,
//           meter_element_id: 1,
//           time_frame_type: 'last_month',
//           selected_columns: ['active_energy', 'power'],
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         jest.spyOn(TimeFrameCalculationService, 'calculateTimeFrame').mockResolvedValueOnce({
//           start: new Date('2024-01-01'),
//           end: new Date('2024-01-31'),
//           type: 'last_month'
//         });

//         // Mock db.query to return count first, then data
//         jest.spyOn(db, 'query')
//           .mockResolvedValueOnce({
//             rows: [{ total: 100 }]
//           })
//           .mockResolvedValueOnce({
//             rows: [
//               { id: 1, created_at: '2024-01-31T23:59:00Z', active_energy: 1250.50, power: 45.25 },
//               { id: 2, created_at: '2024-01-30T23:59:00Z', active_energy: 1200.00, power: 42.00 }
//             ]
//           });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/readings?page=1&pageSize=50')
//           .expect(200);

//         expect(response.body.success).toBe(true);
//         expect(response.body.data.items).toHaveLength(2);
//         expect(response.body.data.pagination).toBeDefined();
//         expect(response.body.data.pagination.page).toBe(1);
//         expect(response.body.data.pagination.pageSize).toBe(50);
//         expect(response.body.data.pagination.total).toBe(100);
//         expect(response.body.data.pagination.totalPages).toBe(2);
//         expect(response.body.data.pagination.hasMore).toBe(true);
//         expect(response.body.data.metadata).toBeDefined();
//         expect(response.body.data.metadata.card_id).toBe(1);
//         expect(response.body.data.metadata.selected_columns).toEqual(['active_energy', 'power']);
//       });

//       it('should support sorting by column', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
//         const db = require('../config/database');

//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1,
//           meter_element_id: 1,
//           time_frame_type: 'last_month',
//           selected_columns: ['active_energy'],
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         jest.spyOn(TimeFrameCalculationService, 'calculateTimeFrame').mockResolvedValueOnce({
//           start: new Date('2024-01-01'),
//           end: new Date('2024-01-31'),
//           type: 'last_month'
//         });

//         jest.spyOn(db, 'query')
//           .mockResolvedValueOnce({
//             rows: [{ total: 1 }]
//           })
//           .mockResolvedValueOnce({
//             rows: [{ id: 1, created_at: '2024-01-31T23:59:00Z', active_energy: 1250.50 }]
//           });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/readings?sortBy=active_energy&sortOrder=asc')
//           .expect(200);

//         expect(response.body.success).toBe(true);
//         expect(response.body.data.metadata.sort_by).toBe('active_energy');
//         expect(response.body.data.metadata.sort_order).toBe('ASC');
//       });

//       it('should include time frame metadata in response', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
//         const db = require('../config/database');

//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1,
//           meter_element_id: 1,
//           time_frame_type: 'this_month_to_date',
//           selected_columns: ['power'],
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         const startDate = new Date();
//         startDate.setDate(1);
//         const endDate = new Date();

//         jest.spyOn(TimeFrameCalculationService, 'calculateTimeFrame').mockResolvedValueOnce({
//           start: startDate,
//           end: endDate,
//           type: 'this_month_to_date'
//         });

//         jest.spyOn(db, 'query')
//           .mockResolvedValueOnce({
//             rows: [{ total: 0 }]
//           })
//           .mockResolvedValueOnce({
//             rows: []
//           });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/readings')
//           .expect(200);

//         expect(response.body.data.metadata.time_frame).toBeDefined();
//         expect(response.body.data.metadata.time_frame.type).toBe('this_month_to_date');
//         expect(response.body.data.metadata.time_frame.start).toBeDefined();
//         expect(response.body.data.metadata.time_frame.end).toBeDefined();
//       });
//     });

//     describe('GET /api/dashboard/cards/:id/readings/export', () => {
//       it('should return 404 if card not found', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce(null);

//         const response = await request(app)
//           .get('/api/dashboard/cards/999/readings/export')
//           .expect(404);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toBe('Dashboard card not found');
//       });

//       it('should return 403 if card belongs to different tenant', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 999,
//           meter_element_id: 1,
//           time_frame_type: 'last_month',
//           selected_columns: ['active_energy'],
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/readings/export')
//           .expect(403);

//         expect(response.body.success).toBe(false);
//         expect(response.body.message).toContain('permission');
//       });

//       it('should export meter readings as CSV', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
//         const db = require('../config/database');

//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test Card',
//           tenant_id: 1,
//           meter_element_id: 1,
//           time_frame_type: 'last_month',
//           selected_columns: ['active_energy', 'power'],
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         jest.spyOn(TimeFrameCalculationService, 'calculateTimeFrame').mockResolvedValueOnce({
//           start: new Date('2024-01-01'),
//           end: new Date('2024-01-31'),
//           type: 'last_month'
//         });

//         jest.spyOn(db, 'query').mockResolvedValueOnce({
//           rows: [
//             { id: 1, created_at: '2024-01-31T23:59:00Z', active_energy: 1250.50, power: 45.25 },
//             { id: 2, created_at: '2024-01-30T23:59:00Z', active_energy: 1200.00, power: 42.00 }
//           ]
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/readings/export')
//           .expect(200);

//         expect(response.headers['content-type']).toContain('text/csv');
//         expect(response.headers['content-disposition']).toContain('attachment');
//         expect(response.headers['content-disposition']).toContain('.csv');
//         expect(response.text).toContain('Meter Reading Export');
//         expect(response.text).toContain('Test Card');
//         expect(response.text).toContain('Id,Created At,Active Energy,Power');
//       });

//       it('should escape special characters in CSV', async () => {
//         const Dashboard = require('../models/DashboardWithSchema');
//         const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
//         const db = require('../config/database');

//         jest.spyOn(Dashboard, 'findById').mockResolvedValueOnce({
//           id: 1,
//           card_name: 'Test, Card "Special"',
//           tenant_id: 1,
//           meter_element_id: 1,
//           time_frame_type: 'last_month',
//           selected_columns: ['active_energy'],
//           custom_start_date: null,
//           custom_end_date: null
//         });

//         jest.spyOn(TimeFrameCalculationService, 'calculateTimeFrame').mockResolvedValueOnce({
//           start: new Date('2024-01-01'),
//           end: new Date('2024-01-31'),
//           type: 'last_month'
//         });

//         jest.spyOn(db, 'query').mockResolvedValueOnce({
//           rows: [
//             { id: 1, created_at: '2024-01-31T23:59:00Z', active_energy: 1250.50 }
//           ]
//         });

//         const response = await request(app)
//           .get('/api/dashboard/cards/1/readings/export')
//           .expect(200);

//         expect(response.text).toContain('"Test, Card ""Special"""');
//       });
//     });
//   });
// });
