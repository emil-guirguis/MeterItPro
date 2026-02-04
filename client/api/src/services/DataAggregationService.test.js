// /**
//  * Tests for DataAggregationService
//  */

// const DataAggregationService = require('./DataAggregationService');
// const db = require('../config/database');

// // Mock the database module
// jest.mock('../config/database');

// describe('DataAggregationService', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('validateAggregationOptions', () => {
//     it('should accept valid aggregation options', () => {
//       const options = {
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy', 'power'],
//         startDate: new Date('2024-01-01'),
//         endDate: new Date('2024-01-31')
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).not.toThrow();
//     });

//     it('should throw error if meterElementId is missing', () => {
//       const options = {
//         tenantId: 1,
//         selectedColumns: ['active_energy'],
//         startDate: new Date('2024-01-01'),
//         endDate: new Date('2024-01-31')
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'meterElementId is required'
//       );
//     });

//     it('should throw error if tenantId is missing', () => {
//       const options = {
//         meterElementId: 5,
//         selectedColumns: ['active_energy'],
//         startDate: new Date('2024-01-01'),
//         endDate: new Date('2024-01-31')
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'tenantId is required'
//       );
//     });

//     it('should throw error if selectedColumns is empty', () => {
//       const options = {
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: [],
//         startDate: new Date('2024-01-01'),
//         endDate: new Date('2024-01-31')
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'selectedColumns must be a non-empty array'
//       );
//     });

//     it('should throw error if selectedColumns is not an array', () => {
//       const options = {
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: 'active_energy',
//         startDate: new Date('2024-01-01'),
//         endDate: new Date('2024-01-31')
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'selectedColumns must be a non-empty array'
//       );
//     });

//     it('should throw error if startDate is missing', () => {
//       const options = {
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy'],
//         endDate: new Date('2024-01-31')
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'startDate is required'
//       );
//     });

//     it('should throw error if endDate is missing', () => {
//       const options = {
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy'],
//         startDate: new Date('2024-01-01')
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'endDate is required'
//       );
//     });

//     it('should throw error if startDate is invalid', () => {
//       const options = {
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy'],
//         startDate: 'invalid-date',
//         endDate: new Date('2024-01-31')
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'Invalid startDate'
//       );
//     });

//     it('should throw error if endDate is invalid', () => {
//       const options = {
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy'],
//         startDate: new Date('2024-01-01'),
//         endDate: 'invalid-date'
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'Invalid endDate'
//       );
//     });

//     it('should throw error if startDate is after endDate', () => {
//       const options = {
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy'],
//         startDate: new Date('2024-01-31'),
//         endDate: new Date('2024-01-01')
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'startDate must be before endDate'
//       );
//     });

//     it('should throw error if startDate equals endDate', () => {
//       const sameDate = new Date('2024-01-15');
//       const options = {
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy'],
//         startDate: sameDate,
//         endDate: sameDate
//       };

//       expect(() => DataAggregationService.validateAggregationOptions(options)).toThrow(
//         'startDate must be before endDate'
//       );
//     });
//   });

//   describe('getAggregationFunction', () => {
//     it('should return SUM for energy columns', () => {
//       expect(DataAggregationService.getAggregationFunction('active_energy')).toBe('SUM');
//       expect(DataAggregationService.getAggregationFunction('reactive_energy')).toBe('SUM');
//       expect(DataAggregationService.getAggregationFunction('apparent_energy')).toBe('SUM');
//       expect(DataAggregationService.getAggregationFunction('kwh')).toBe('SUM');
//       expect(DataAggregationService.getAggregationFunction('kvarh')).toBe('SUM');
//     });

//     it('should return MAX for power columns', () => {
//       expect(DataAggregationService.getAggregationFunction('power')).toBe('MAX');
//       expect(DataAggregationService.getAggregationFunction('active_power')).toBe('MAX');
//       expect(DataAggregationService.getAggregationFunction('reactive_power')).toBe('MAX');
//       expect(DataAggregationService.getAggregationFunction('apparent_power')).toBe('MAX');
//       expect(DataAggregationService.getAggregationFunction('kw')).toBe('MAX');
//       expect(DataAggregationService.getAggregationFunction('current')).toBe('MAX');
//       expect(DataAggregationService.getAggregationFunction('voltage')).toBe('MAX');
//     });

//     it('should return AVG for factor columns', () => {
//       expect(DataAggregationService.getAggregationFunction('power_factor')).toBe('AVG');
//       expect(DataAggregationService.getAggregationFunction('voltage_thd')).toBe('AVG');
//       expect(DataAggregationService.getAggregationFunction('current_distortion')).toBe('AVG');
//       expect(DataAggregationService.getAggregationFunction('harmonic_content')).toBe('AVG');
//     });

//     it('should return SUM as default for unknown columns', () => {
//       expect(DataAggregationService.getAggregationFunction('xyz_metric')).toBe('SUM');
//       expect(DataAggregationService.getAggregationFunction('custom_data')).toBe('SUM');
//     });

//     it('should be case-insensitive', () => {
//       expect(DataAggregationService.getAggregationFunction('ACTIVE_ENERGY')).toBe('SUM');
//       expect(DataAggregationService.getAggregationFunction('Active_Power')).toBe('MAX');
//       expect(DataAggregationService.getAggregationFunction('Power_Factor')).toBe('AVG');
//     });
//   });

//   describe('buildAggregationQuery', () => {
//     it('should build query with single column', () => {
//       const query = DataAggregationService.buildAggregationQuery(['active_energy']);

//       expect(query).toContain('SUM("active_energy")');
//       expect(query).toContain('FROM meter_reading');
//       expect(query).toContain('WHERE');
//       expect(query).toContain('tenant_id = $1');
//       expect(query).toContain('meter_element_id = $2');
//       expect(query).toContain('created_at >= $3');
//       expect(query).toContain('created_at <= $4');
//     });

//     it('should build query with multiple columns', () => {
//       const query = DataAggregationService.buildAggregationQuery([
//         'active_energy',
//         'power',
//         'power_factor'
//       ]);

//       expect(query).toContain('SUM("active_energy")');
//       expect(query).toContain('MAX("power")');
//       expect(query).toContain('AVG("power_factor")');
//     });

//     it('should use correct aggregation functions for each column', () => {
//       const query = DataAggregationService.buildAggregationQuery([
//         'active_energy',
//         'reactive_energy',
//         'active_power',
//         'power_factor'
//       ]);

//       expect(query).toContain('SUM("active_energy")');
//       expect(query).toContain('SUM("reactive_energy")');
//       expect(query).toContain('MAX("active_power")');
//       expect(query).toContain('AVG("power_factor")');
//     });

//     it('should include WHERE clause with all filters', () => {
//       const query = DataAggregationService.buildAggregationQuery(['active_energy']);

//       expect(query).toContain('tenant_id = $1');
//       expect(query).toContain('meter_element_id = $2');
//       expect(query).toContain('created_at >= $3');
//       expect(query).toContain('created_at <= $4');
//     });
//   });

//   describe('getEmptyAggregationResult', () => {
//     it('should return object with null values for all columns', () => {
//       const result = DataAggregationService.getEmptyAggregationResult([
//         'active_energy',
//         'power',
//         'power_factor'
//       ]);

//       expect(result).toEqual({
//         active_energy: null,
//         power: null,
//         power_factor: null
//       });
//     });

//     it('should handle single column', () => {
//       const result = DataAggregationService.getEmptyAggregationResult(['active_energy']);

//       expect(result).toEqual({
//         active_energy: null
//       });
//     });

//     it('should handle empty array', () => {
//       const result = DataAggregationService.getEmptyAggregationResult([]);

//       expect(result).toEqual({});
//     });
//   });

//   describe('aggregateCardData', () => {
//     it('should aggregate data successfully with valid options', async () => {
//       const mockData = {
//         active_energy: 1250.50,
//         power: 45.25
//       };

//       db.query.mockResolvedValueOnce({
//         rows: [mockData]
//       });

//       const result = await DataAggregationService.aggregateCardData({
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy', 'power'],
//         startDate: new Date('2024-01-01'),
//         endDate: new Date('2024-01-31')
//       });

//       expect(result).toEqual(mockData);
//       expect(db.query).toHaveBeenCalled();
//     });

//     it('should return empty result when no meter readings found', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: []
//       });

//       const result = await DataAggregationService.aggregateCardData({
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy', 'power'],
//         startDate: new Date('2024-01-01'),
//         endDate: new Date('2024-01-31')
//       });

//       expect(result).toEqual({
//         active_energy: null,
//         power: null
//       });
//     });

//     it('should throw error if validation fails', async () => {
//       await expect(
//         DataAggregationService.aggregateCardData({
//           meterElementId: 5,
//           tenantId: 1,
//           selectedColumns: [],
//           startDate: new Date('2024-01-01'),
//           endDate: new Date('2024-01-31')
//         })
//       ).rejects.toThrow('selectedColumns must be a non-empty array');
//     });

//     it('should pass correct parameters to database query', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: [{ active_energy: 1250.50 }]
//       });

//       const startDate = new Date('2024-01-01');
//       const endDate = new Date('2024-01-31');

//       await DataAggregationService.aggregateCardData({
//         meterElementId: 5,
//         tenantId: 1,
//         selectedColumns: ['active_energy'],
//         startDate,
//         endDate
//       });

//       expect(db.query).toHaveBeenCalledWith(
//         expect.any(String),
//         [1, 5, startDate.toISOString(), endDate.toISOString()]
//       );
//     });

//     it('should handle database errors gracefully', async () => {
//       db.query.mockRejectedValueOnce(new Error('Database connection failed'));

//       await expect(
//         DataAggregationService.aggregateCardData({
//           meterElementId: 5,
//           tenantId: 1,
//           selectedColumns: ['active_energy'],
//           startDate: new Date('2024-01-01'),
//           endDate: new Date('2024-01-31')
//         })
//       ).rejects.toThrow('Database connection failed');
//     });
//   });

//   describe('getAggregationStats', () => {
//     it('should return aggregation statistics', async () => {
//       const mockStats = {
//         total_readings: 1000,
//         earliest_reading: new Date('2024-01-01'),
//         latest_reading: new Date('2024-01-31'),
//         days_with_readings: 31
//       };

//       db.query.mockResolvedValueOnce({
//         rows: [mockStats]
//       });

//       const result = await DataAggregationService.getAggregationStats(5, 1);

//       expect(result).toEqual(mockStats);
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('COUNT(*)'),
//         [5, 1]
//       );
//     });

//     it('should return zero stats when no readings found', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: []
//       });

//       const result = await DataAggregationService.getAggregationStats(5, 1);

//       expect(result).toEqual({
//         total_readings: 0,
//         earliest_reading: null,
//         latest_reading: null,
//         days_with_readings: 0
//       });
//     });

//     it('should handle database errors', async () => {
//       db.query.mockRejectedValueOnce(new Error('Database error'));

//       await expect(
//         DataAggregationService.getAggregationStats(5, 1)
//       ).rejects.toThrow('Database error');
//     });
//   });

//   describe('validateSelectedColumns', () => {
//     it('should validate that selected columns exist', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: [
//           { column_name: 'active_energy' },
//           { column_name: 'power' }
//         ]
//       });

//       const result = await DataAggregationService.validateSelectedColumns([
//         'active_energy',
//         'power'
//       ]);

//       expect(result.valid).toEqual(['active_energy', 'power']);
//       expect(result.invalid).toEqual([]);
//       expect(result.isValid).toBe(true);
//     });

//     it('should identify invalid columns', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: [
//           { column_name: 'active_energy' }
//         ]
//       });

//       const result = await DataAggregationService.validateSelectedColumns([
//         'active_energy',
//         'invalid_column'
//       ]);

//       expect(result.valid).toEqual(['active_energy']);
//       expect(result.invalid).toEqual(['invalid_column']);
//       expect(result.isValid).toBe(false);
//     });

//     it('should handle empty result set', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: []
//       });

//       const result = await DataAggregationService.validateSelectedColumns([
//         'active_energy'
//       ]);

//       expect(result.valid).toEqual([]);
//       expect(result.invalid).toEqual(['active_energy']);
//       expect(result.isValid).toBe(false);
//     });

//     it('should handle database errors', async () => {
//       db.query.mockRejectedValueOnce(new Error('Database error'));

//       await expect(
//         DataAggregationService.validateSelectedColumns(['active_energy'])
//       ).rejects.toThrow('Database error');
//     });
//   });

//   describe('getColumnStats', () => {
//     it('should return column statistics', async () => {
//       const mockStats = {
//         count: 1000,
//         distinct_count: 500,
//         min_value: 0,
//         max_value: 100,
//         avg_value: 50,
//         sum_value: 50000
//       };

//       db.query.mockResolvedValueOnce({
//         rows: [mockStats]
//       });

//       const result = await DataAggregationService.getColumnStats('active_energy', 5, 1);

//       expect(result).toEqual(mockStats);
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('COUNT(*)'),
//         [5, 1]
//       );
//     });

//     it('should return null when no data found', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: []
//       });

//       const result = await DataAggregationService.getColumnStats('active_energy', 5, 1);

//       expect(result).toBeNull();
//     });

//     it('should handle database errors', async () => {
//       db.query.mockRejectedValueOnce(new Error('Database error'));

//       await expect(
//         DataAggregationService.getColumnStats('active_energy', 5, 1)
//       ).rejects.toThrow('Database error');
//     });
//   });
// });
