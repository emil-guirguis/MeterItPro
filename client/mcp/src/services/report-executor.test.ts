import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportExecutor } from './report-executor.js';
import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';
import type { Report } from './scheduler-service.js';

// Mock dependencies
vi.mock('../database/client.js');
vi.mock('../utils/logger.js');
vi.mock('./email-sender.js');

const makeReport = (overrides: Partial<Report> = {}): Report => ({
  id: '1',
  name: 'Test Report',
  type: 'meter_readings',
  schedule: '0 9 * * *',
  recipients: ['test@example.com'],
  config: {},
  active: true,
  meter_selections: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

// When meter_selections is null, execute() calls getMeterElementPairs which SELECTs all active pairs
const pairsResult = {
  rows: [{ meter_id: '1', meter_element_id: '1' }],
  rowCount: 1, command: 'SELECT', oid: 0, fields: [],
} as any;

const readingsResult = {
  rows: [{ meter_name: 'Meter 1', element: 'A-Main', created_at: new Date(), kwh: 100, kw: 10, power_factor: 0.95 }],
  rowCount: 1, command: 'SELECT', oid: 0, fields: [],
} as any;

const emptyResult = {
  rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [],
} as any;

const historyInsert = (id = 'history-1') => ({
  rows: [{ id }], rowCount: 1, command: 'INSERT', oid: 0, fields: [],
}) as any;

const historyUpdate = {
  rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [],
} as any;

describe('ReportExecutor', () => {
  let executor: ReportExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new ReportExecutor();
  });

  describe('execute — success path', () => {
    it('should create a pending history entry then update to success', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce(pairsResult)       // getMeterElementPairs
        .mockResolvedValueOnce(readingsResult)     // meter_reading SELECT
        .mockResolvedValueOnce(historyInsert())    // INSERT history (pending)
        .mockResolvedValueOnce(historyUpdate);     // UPDATE history (success)

      await executor.execute(makeReport());

      const insertCall = vi.mocked(db.query).mock.calls.find(call =>
        call[0].includes('INSERT INTO report_history')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall![1]).toContain('pending');

      const updateCall = vi.mocked(db.query).mock.calls.find(call =>
        call[0].includes('UPDATE report_history')
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1]).toContain('success');
    });

    it('should log success after execution', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce(pairsResult)
        .mockResolvedValueOnce(readingsResult)
        .mockResolvedValueOnce(historyInsert())
        .mockResolvedValueOnce(historyUpdate);

      await executor.execute(makeReport());

      const calls = vi.mocked(logger.info).mock.calls;
      const successCall = calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('Successfully executed report')
      );
      expect(successCall).toBeDefined();
    });
  });

  describe('execute — failure path', () => {
    it('should create a failed history entry when report data generation fails', async () => {
      vi.mocked(db.query)
        .mockRejectedValueOnce(new Error('DB error'))  // getMeterElementPairs fails
        .mockResolvedValueOnce(historyInsert());        // INSERT history (failed)

      await expect(executor.execute(makeReport())).rejects.toThrow('DB error');

      const insertCall = vi.mocked(db.query).mock.calls.find(call =>
        call[0].includes('INSERT INTO report_history')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall![1]).toContain('failed');
      expect(insertCall![1]).toContain('DB error');
    });

    it('should log error and rethrow on failure', async () => {
      vi.mocked(db.query)
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce(historyInsert());

      await expect(executor.execute(makeReport())).rejects.toThrow('Test error');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute report'),
        expect.any(Object)
      );
    });
  });

  describe('report data generation', () => {
    it('should query meter_reading table for meter_readings report', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce(pairsResult)
        .mockResolvedValueOnce(readingsResult)
        .mockResolvedValueOnce(historyInsert())
        .mockResolvedValueOnce(historyUpdate);

      await executor.execute(makeReport({ type: 'meter_readings' }));

      const readingCall = vi.mocked(db.query).mock.calls.find(call =>
        call[0].includes('meter_reading')
      );
      expect(readingCall).toBeDefined();
    });

    it('should query AVG/SUM aggregates for usage_summary report', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce(pairsResult)
        .mockResolvedValueOnce(emptyResult)
        .mockResolvedValueOnce(historyInsert())
        .mockResolvedValueOnce(historyUpdate);

      await executor.execute(makeReport({ type: 'usage_summary' }));

      const summaryCall = vi.mocked(db.query).mock.calls.find(call =>
        call[0].includes('AVG(r.kw)')
      );
      expect(summaryCall).toBeDefined();
    });

    it('should query DATE(r.created_at) for daily_summary report', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce(pairsResult)
        .mockResolvedValueOnce(emptyResult)
        .mockResolvedValueOnce(historyInsert())
        .mockResolvedValueOnce(historyUpdate);

      await executor.execute(makeReport({ type: 'daily_summary' }));

      const dailyCall = vi.mocked(db.query).mock.calls.find(call =>
        call[0].includes('DATE(r.created_at)')
      );
      expect(dailyCall).toBeDefined();
    });

    it('should log a warning for unknown report types', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce(historyInsert())  // INSERT history (pending)
        .mockResolvedValueOnce(historyUpdate);   // UPDATE history (success)

      await executor.execute(makeReport({ type: 'unknown_type' }));

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown report type')
      );
    });
  });

  describe('generatePreviewHtml', () => {
    it('should return a valid HTML document', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce(pairsResult)
        .mockResolvedValueOnce(readingsResult);

      const html = await executor.generatePreviewHtml(makeReport());
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Report');
    });

    it('should include a print button in the HTML', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce(pairsResult)
        .mockResolvedValueOnce(emptyResult);

      const html = await executor.generatePreviewHtml(makeReport());
      expect(html).toContain('window.print()');
    });

    it('should show no-data message when result is empty', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce(pairsResult)
        .mockResolvedValueOnce(emptyResult);

      const html = await executor.generatePreviewHtml(makeReport());
      expect(html).toContain('No data available');
    });
  });
});
