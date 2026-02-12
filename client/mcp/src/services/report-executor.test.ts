// /* import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { ReportExecutor } from './report-executor.js';
// import { db } from '../database/client.js';
// import { logger } from '../utils/logger.js';
// import type { Report } from './scheduler-service.js';

// // Mock dependencies
// vi.mock('../database/client.js');
// vi.mock('../utils/logger.js');
// vi.mock('./email-sender.js');

// describe('ReportExecutor', () => {
//   let executor: ReportExecutor;

//   beforeEach(() => {
//     vi.clearAllMocks();
//     executor = new ReportExecutor();
//   });

//   describe('report execution', () => {
//     it('should execute a report successfully', async () => {
//       const report: Report = {
//         id: '1',
//         name: 'Test Report',
//         type: 'meter_readings',
//         schedule: '0 9 * * *',
//         recipients: ['test@example.com'],
//         config: {},
//         enabled: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       // Mock database queries
//       vi.mocked(db.query)
//         .mockResolvedValueOnce({
//           rows: [{ id: 1, value: 100 }],
//           rowCount: 1,
//           command: 'SELECT',
//           oid: 0,
//           fields: [],
//         } as any)
//         .mockResolvedValueOnce({
//           rows: [{ id: 'history-1' }],
//           rowCount: 1,
//           command: 'INSERT',
//           oid: 0,
//           fields: [],
//         } as any);

//       await executor.execute(report);

//       // Verify history entry was created
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('INSERT INTO report_history'),
//         expect.arrayContaining(['1', 'success', null])
//       );
//     });

//     it('should create history entry with failed status on error', async () => {
//       const report: Report = {
//         id: '1',
//         name: 'Test Report',
//         type: 'invalid_type',
//         schedule: '0 9 * * *',
//         recipients: ['test@example.com'],
//         config: {},
//         enabled: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       // Mock database query to fail
//       vi.mocked(db.query).mockRejectedValueOnce(new Error('Database error'));

//       await expect(executor.execute(report)).rejects.toThrow();

//       // Verify error was logged
//       expect(logger.error).toHaveBeenCalledWith(
//         expect.stringContaining('Failed to execute report'),
//         expect.any(Object)
//       );
//     });

//     it('should send emails after successful execution', async () => {
//       const report: Report = {
//         id: '1',
//         name: 'Test Report',
//         type: 'meter_readings',
//         schedule: '0 9 * * *',
//         recipients: ['test@example.com', 'test2@example.com'],
//         config: {},
//         enabled: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       // Mock database queries
//       vi.mocked(db.query)
//         .mockResolvedValueOnce({
//           rows: [{ id: 1, value: 100 }],
//           rowCount: 1,
//           command: 'SELECT',
//           oid: 0,
//           fields: [],
//         } as any)
//         .mockResolvedValueOnce({
//           rows: [{ id: 'history-1' }],
//           rowCount: 1,
//           command: 'INSERT',
//           oid: 0,
//           fields: [],
//         } as any);

//       await executor.execute(report);

//       // Verify execution completed successfully
//       expect(logger.info).toHaveBeenCalled();
//       const calls = vi.mocked(logger.info).mock.calls;
//       const successCall = calls.find(call => 
//         typeof call[0] === 'string' && call[0].includes('Successfully executed report')
//       );
//       expect(successCall).toBeDefined();
//     });
//   });

//   describe('report data generation', () => {
//     it('should generate meter readings report', async () => {
//       const report: Report = {
//         id: '1',
//         name: 'Meter Readings',
//         type: 'meter_readings',
//         schedule: '0 9 * * *',
//         recipients: ['test@example.com'],
//         config: {},
//         enabled: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       const mockReadings = [
//         { meter_id: 1, meter_element_id: 1, name: 'Meter 1', tenant_id: 1, data_point: 'power', value: 100, timestamp: new Date() },
//         { meter_id: 2, meter_element_id: 1, name: 'Meter 2', tenant_id: 1, data_point: 'power', value: 200, timestamp: new Date() },
//       ];

//       vi.mocked(db.query)
//         .mockResolvedValueOnce({
//           rows: mockReadings,
//           rowCount: 2,
//           command: 'SELECT',
//           oid: 0,
//           fields: [],
//         } as any)
//         .mockResolvedValueOnce({
//           rows: [{ id: 'history-1' }],
//           rowCount: 1,
//           command: 'INSERT',
//           oid: 0,
//           fields: [],
//         } as any);

//       await executor.execute(report);

//       // Verify that a query was made for meter readings
//       const queryCalls = vi.mocked(db.query).mock.calls;
//       const meterReadingsCall = queryCalls.find(call =>
//         typeof call[0] === 'string' && call[0].includes('meter_reading')
//       );
//       expect(meterReadingsCall).toBeDefined();
//     });

//     it('should generate usage summary report', async () => {
//       const report: Report = {
//         id: '1',
//         name: 'Usage Summary',
//         type: 'usage_summary',
//         schedule: '0 9 * * *',
//         recipients: ['test@example.com'],
//         config: {},
//         enabled: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       const mockSummary = [
//         { tenant_id: 1, meter_count: 5, reading_count: 100, avg_value: 150, max_value: 200, min_value: 100, unit: 'kW' },
//       ];

//       vi.mocked(db.query)
//         .mockResolvedValueOnce({
//           rows: mockSummary,
//           rowCount: 1,
//           command: 'SELECT',
//           oid: 0,
//           fields: [],
//         } as any)
//         .mockResolvedValueOnce({
//           rows: [{ id: 'history-1' }],
//           rowCount: 1,
//           command: 'INSERT',
//           oid: 0,
//           fields: [],
//         } as any);

//       await executor.execute(report);

//       // Verify that a query was made for usage summary
//       const queryCalls = vi.mocked(db.query).mock.calls;
//       const usageSummaryCall = queryCalls.find(call =>
//         typeof call[0] === 'string' && call[0].includes('tenant_id')
//       );
//       expect(usageSummaryCall).toBeDefined();
//     });

//     it('should generate daily summary report', async () => {
//       const report: Report = {
//         id: '1',
//         name: 'Daily Summary',
//         type: 'daily_summary',
//         schedule: '0 9 * * *',
//         recipients: ['test@example.com'],
//         config: {},
//         enabled: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       const mockDaily = [
//         { date: '2024-01-01', active_meters: 10, reading_count: 100, avg_value: 150 },
//       ];

//       vi.mocked(db.query)
//         .mockResolvedValueOnce({
//           rows: mockDaily,
//           rowCount: 1,
//           command: 'SELECT',
//           oid: 0,
//           fields: [],
//         } as any)
//         .mockResolvedValueOnce({
//           rows: [{ id: 'history-1' }],
//           rowCount: 1,
//           command: 'INSERT',
//           oid: 0,
//           fields: [],
//         } as any);

//       await executor.execute(report);

//       // Verify that a query was made for daily summary
//       const queryCalls = vi.mocked(db.query).mock.calls;
//       const dailySummaryCall = queryCalls.find(call =>
//         typeof call[0] === 'string' && call[0].includes('DATE(r.timestamp)')
//       );
//       expect(dailySummaryCall).toBeDefined();
//     });

//     it('should handle unknown report types gracefully', async () => {
//       const report: Report = {
//         id: '1',
//         name: 'Unknown Type',
//         type: 'unknown_type',
//         schedule: '0 9 * * *',
//         recipients: ['test@example.com'],
//         config: {},
//         enabled: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       vi.mocked(db.query).mockResolvedValueOnce({
//         rows: [{ id: 'history-1' }],
//         rowCount: 1,
//         command: 'INSERT',
//         oid: 0,
//         fields: [],
//       } as any);

//       await executor.execute(report);

//       // Verify that a warning was logged for unknown type
//       const warnCalls = vi.mocked(logger.warn).mock.calls;
//       const unknownTypeCall = warnCalls.find(call =>
//         typeof call[0] === 'string' && call[0].includes('Unknown report type')
//       );
//       expect(unknownTypeCall).toBeDefined();
//     });
//   });

//   describe('history entry creation', () => {
//     it('should create history entry with success status', async () => {
//       const report: Report = {
//         id: '1',
//         name: 'Test Report',
//         type: 'meter_readings',
//         schedule: '0 9 * * *',
//         recipients: ['test@example.com'],
//         config: {},
//         enabled: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       vi.mocked(db.query)
//         .mockResolvedValueOnce({
//           rows: [{ id: 1, value: 100 }],
//           rowCount: 1,
//           command: 'SELECT',
//           oid: 0,
//           fields: [],
//         } as any)
//         .mockResolvedValueOnce({
//           rows: [{ id: 'history-1' }],
//           rowCount: 1,
//           command: 'INSERT',
//           oid: 0,
//           fields: [],
//         } as any);

//       await executor.execute(report);

//       const insertCall = vi.mocked(db.query).mock.calls.find(call =>
//         call[0].includes('INSERT INTO report_history')
//       );

//       expect(insertCall).toBeDefined();
//       expect(insertCall![1]).toContain('success');
//     });

//     it('should create history entry with error message on failure', async () => {
//       const report: Report = {
//         id: '1',
//         name: 'Test Report',
//         type: 'meter_readings',
//         schedule: '0 9 * * *',
//         recipients: ['test@example.com'],
//         config: {},
//         enabled: true,
//         created_at: new Date(),
//         updated_at: new Date(),
//       };

//       const errorMessage = 'Test error message';
//       vi.mocked(db.query)
//         .mockRejectedValueOnce(new Error(errorMessage))
//         .mockResolvedValueOnce({
//           rows: [{ id: 'history-1' }],
//           rowCount: 1,
//           command: 'INSERT',
//           oid: 0,
//           fields: [],
//         } as any);

//       await expect(executor.execute(report)).rejects.toThrow();

//       const insertCall = vi.mocked(db.query).mock.calls.find(call =>
//         call[0].includes('INSERT INTO report_history')
//       );

//       expect(insertCall).toBeDefined();
//       expect(insertCall![1]).toContain('failed');
//       expect(insertCall![1]).toContain(errorMessage);
//     });
//   });
// });
//  */