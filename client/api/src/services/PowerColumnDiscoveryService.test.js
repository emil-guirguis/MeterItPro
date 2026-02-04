// /**
//  * Tests for PowerColumnDiscoveryService
//  */

// const PowerColumnDiscoveryService = require('./PowerColumnDiscoveryService');
// const db = require('../config/database');

// // Mock the database module
// jest.mock('../config/database');

// describe('PowerColumnDiscoveryService', () => {
//   beforeEach(() => {
//     // Clear cache before each test
//     PowerColumnDiscoveryService.invalidateCache();
//     jest.clearAllMocks();
//   });

//   describe('discoverColumns', () => {
//     it('should discover numeric columns from meter_reading table', async () => {
//       // Mock database response
//       const mockColumns = [
//         {
//           column_name: 'id',
//           data_type: 'bigint',
//           udt_name: 'int8',
//           is_nullable: 'NO',
//           column_default: "nextval('meter_reading_id_seq'::regclass)"
//         },
//         {
//           column_name: 'active_energy',
//           data_type: 'numeric',
//           udt_name: 'numeric',
//           is_nullable: 'YES',
//           column_default: null
//         },
//         {
//           column_name: 'power',
//           data_type: 'double precision',
//           udt_name: 'float8',
//           is_nullable: 'YES',
//           column_default: null
//         },
//         {
//           column_name: 'voltage',
//           data_type: 'real',
//           udt_name: 'float4',
//           is_nullable: 'YES',
//           column_default: null
//         },
//         {
//           column_name: 'created_at',
//           data_type: 'timestamp without time zone',
//           udt_name: 'timestamp',
//           is_nullable: 'NO',
//           column_default: 'CURRENT_TIMESTAMP'
//         },
//         {
//           column_name: 'tenant_id',
//           data_type: 'bigint',
//           udt_name: 'int8',
//           is_nullable: 'NO',
//           column_default: null
//         }
//       ];

//       db.query.mockResolvedValueOnce({ rows: mockColumns });

//       const columns = await PowerColumnDiscoveryService.discoverColumns();

//       // Should filter out system columns (id, created_at, tenant_id)
//       // Should include numeric columns (active_energy, power, voltage)
//       expect(columns).toHaveLength(3);
//       expect(columns.map(c => c.name)).toEqual(['active_energy', 'power', 'voltage']);
//     });

//     it('should filter out system columns', async () => {
//       const mockColumns = [
//         {
//           column_name: 'id',
//           data_type: 'bigint',
//           udt_name: 'int8',
//           is_nullable: 'NO',
//           column_default: null
//         },
//         {
//           column_name: 'created_at',
//           data_type: 'timestamp without time zone',
//           udt_name: 'timestamp',
//           is_nullable: 'NO',
//           column_default: null
//         },
//         {
//           column_name: 'tenant_id',
//           data_type: 'bigint',
//           udt_name: 'int8',
//           is_nullable: 'NO',
//           column_default: null
//         },
//         {
//           column_name: 'meter_id',
//           data_type: 'bigint',
//           udt_name: 'int8',
//           is_nullable: 'NO',
//           column_default: null
//         },
//         {
//           column_name: 'meter_element_id',
//           data_type: 'bigint',
//           udt_name: 'int8',
//           is_nullable: 'NO',
//           column_default: null
//         },
//         {
//           column_name: 'is_synchronized',
//           data_type: 'boolean',
//           udt_name: 'bool',
//           is_nullable: 'YES',
//           column_default: null
//         }
//       ];

//       db.query.mockResolvedValueOnce({ rows: mockColumns });

//       const columns = await PowerColumnDiscoveryService.discoverColumns();

//       // All columns are system columns, should return empty array
//       expect(columns).toHaveLength(0);
//     });

//     it('should filter out non-numeric columns', async () => {
//       const mockColumns = [
//         {
//           column_name: 'active_energy',
//           data_type: 'numeric',
//           udt_name: 'numeric',
//           is_nullable: 'YES',
//           column_default: null
//         },
//         {
//           column_name: 'device_name',
//           data_type: 'character varying',
//           udt_name: 'varchar',
//           is_nullable: 'YES',
//           column_default: null
//         },
//         {
//           column_name: 'power',
//           data_type: 'double precision',
//           udt_name: 'float8',
//           is_nullable: 'YES',
//           column_default: null
//         },
//         {
//           column_name: 'notes',
//           data_type: 'text',
//           udt_name: 'text',
//           is_nullable: 'YES',
//           column_default: null
//         }
//       ];

//       db.query.mockResolvedValueOnce({ rows: mockColumns });

//       const columns = await PowerColumnDiscoveryService.discoverColumns();

//       // Should only include numeric columns
//       expect(columns).toHaveLength(2);
//       expect(columns.map(c => c.name)).toEqual(['active_energy', 'power']);
//     });

//     it('should use cache on subsequent calls', async () => {
//       const mockColumns = [
//         {
//           column_name: 'active_energy',
//           data_type: 'numeric',
//           udt_name: 'numeric',
//           is_nullable: 'YES',
//           column_default: null
//         }
//       ];

//       db.query.mockResolvedValueOnce({ rows: mockColumns });

//       // First call
//       const columns1 = await PowerColumnDiscoveryService.discoverColumns();
//       expect(db.query).toHaveBeenCalledTimes(1);

//       // Second call should use cache
//       const columns2 = await PowerColumnDiscoveryService.discoverColumns();
//       expect(db.query).toHaveBeenCalledTimes(1); // Still 1, not 2

//       // Results should be identical
//       expect(columns1).toEqual(columns2);
//     });

//     it('should invalidate cache when requested', async () => {
//       const mockColumns = [
//         {
//           column_name: 'active_energy',
//           data_type: 'numeric',
//           udt_name: 'numeric',
//           is_nullable: 'YES',
//           column_default: null
//         }
//       ];

//       db.query.mockResolvedValueOnce({ rows: mockColumns });
//       db.query.mockResolvedValueOnce({ rows: mockColumns });

//       // First call
//       await PowerColumnDiscoveryService.discoverColumns();
//       expect(db.query).toHaveBeenCalledTimes(1);

//       // Invalidate cache
//       PowerColumnDiscoveryService.invalidateCache();

//       // Second call should query database again
//       await PowerColumnDiscoveryService.discoverColumns();
//       expect(db.query).toHaveBeenCalledTimes(2);
//     });
//   });

//   describe('transformColumnMetadata', () => {
//     it('should transform column metadata correctly', () => {
//       const column = {
//         column_name: 'active_energy',
//         data_type: 'numeric',
//         udt_name: 'numeric',
//         is_nullable: 'YES',
//         column_default: null
//       };

//       const transformed = PowerColumnDiscoveryService.transformColumnMetadata(column);

//       expect(transformed).toEqual({
//         name: 'active_energy',
//         type: 'numeric',
//         label: 'Active Energy',
//         nullable: true,
//         hasDefault: false
//       });
//     });

//     it('should generate correct labels from column names', () => {
//       const testCases = [
//         { input: 'active_energy', expected: 'Active Energy' },
//         { input: 'power_factor', expected: 'Power Factor' },
//         { input: 'phase_a_voltage', expected: 'Phase A Voltage' },
//         { input: 'total_active_power', expected: 'Total Active Power' }
//       ];

//       testCases.forEach(({ input, expected }) => {
//         const label = PowerColumnDiscoveryService.generateLabel(input);
//         expect(label).toBe(expected);
//       });
//     });
//   });

//   describe('isNumericColumn', () => {
//     it('should identify numeric columns', () => {
//       const numericColumn = {
//         column_name: 'active_energy',
//         data_type: 'numeric',
//         udt_name: 'numeric',
//         is_nullable: 'YES',
//         column_default: null
//       };

//       expect(PowerColumnDiscoveryService.isNumericColumn(numericColumn)).toBe(true);
//     });

//     it('should reject non-numeric columns', () => {
//       const stringColumn = {
//         column_name: 'device_name',
//         data_type: 'character varying',
//         udt_name: 'varchar',
//         is_nullable: 'YES',
//         column_default: null
//       };

//       expect(PowerColumnDiscoveryService.isNumericColumn(stringColumn)).toBe(false);
//     });

//     it('should reject system columns', () => {
//       const systemColumn = {
//         column_name: 'id',
//         data_type: 'bigint',
//         udt_name: 'int8',
//         is_nullable: 'NO',
//         column_default: null
//       };

//       expect(PowerColumnDiscoveryService.isNumericColumn(systemColumn)).toBe(false);
//     });
//   });

//   describe('cache management', () => {
//     it('should report cache statistics correctly', () => {
//       const stats = PowerColumnDiscoveryService.getCacheStats();

//       expect(stats).toEqual({
//         isCached: false,
//         columnCount: 0,
//         cacheAge: null,
//         cacheTTL: 3600000,
//         isValid: false
//       });
//     });

//     it('should track cache validity', async () => {
//       const mockColumns = [
//         {
//           column_name: 'active_energy',
//           data_type: 'numeric',
//           udt_name: 'numeric',
//           is_nullable: 'YES',
//           column_default: null
//         }
//       ];

//       db.query.mockResolvedValueOnce({ rows: mockColumns });

//       await PowerColumnDiscoveryService.discoverColumns();

//       const stats = PowerColumnDiscoveryService.getCacheStats();

//       expect(stats.isCached).toBe(true);
//       expect(stats.columnCount).toBe(1);
//       expect(stats.isValid).toBe(true);
//       expect(stats.cacheAge).toBeLessThan(1000); // Should be very recent
//     });
//   });
// });
