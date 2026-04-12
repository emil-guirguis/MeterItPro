import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchedulerService, Report } from './scheduler-service.js';
import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

// Mock dependencies
vi.mock('../database/client.js');
vi.mock('../utils/logger.js');
vi.mock('./report-executor.js');
vi.mock('./notification-rule-agent.js');
vi.mock('../tools/check-meter-health.js');

const makeReport = (overrides: Partial<Report> = {}): Report => ({
  id: '1',
  name: 'Daily Report',
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

const reportsResult = (reports: Report[]) => ({
  rows: reports,
  rowCount: reports.length,
  command: 'SELECT',
  oid: 0,
  fields: [],
}) as any;

const emptyResult = reportsResult([]);

describe('SchedulerService', () => {
  let scheduler: SchedulerService;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduler = new SchedulerService();
  });

  afterEach(async () => {
    try {
      await scheduler.shutdown();
    } catch {
      // Ignore shutdown errors in tests
    }
  });

  describe('reconcileReports', () => {
    it('should load active reports from database and create cron jobs', async () => {
      vi.mocked(db.query).mockResolvedValue(reportsResult([makeReport()]));

      await scheduler.reconcileReports();

      expect(db.query).toHaveBeenCalled();
      const status = scheduler.getJobStatus();
      expect(status.has('report_1')).toBe(true);
    });

    it('should create cron jobs for each active report', async () => {
      vi.mocked(db.query).mockResolvedValue(
        reportsResult([
          makeReport({ id: '1' }),
          makeReport({ id: '2', type: 'usage_summary', schedule: '0 10 * * 1' }),
        ])
      );

      await scheduler.reconcileReports();

      const status = scheduler.getJobStatus();
      expect(status.has('report_1')).toBe(true);
      expect(status.has('report_2')).toBe(true);
    });

    it('should fall back to default cron when expression is invalid', async () => {
      vi.mocked(db.query).mockResolvedValue(
        reportsResult([makeReport({ schedule: 'invalid cron' })])
      );

      await scheduler.reconcileReports();

      // Job is still created with the fallback schedule
      expect(scheduler.getJobStatus().has('report_1')).toBe(true);
    });

    it('should remove jobs for reports no longer active', async () => {
      // First reconcile: report is active
      vi.mocked(db.query).mockResolvedValueOnce(reportsResult([makeReport()]));
      await scheduler.reconcileReports();
      expect(scheduler.getJobStatus().has('report_1')).toBe(true);

      // Second reconcile: no active reports
      vi.mocked(db.query).mockResolvedValueOnce(emptyResult);
      await scheduler.reconcileReports();
      expect(scheduler.getJobStatus().has('report_1')).toBe(false);
    });

    it('should throw when database query fails', async () => {
      vi.mocked(db.query).mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(scheduler.reconcileReports()).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load active reports'),
        expect.any(Object)
      );
    });
  });

  describe('shutdown', () => {
    it('should stop all jobs on shutdown', async () => {
      vi.mocked(db.query).mockResolvedValue(reportsResult([makeReport()]));
      await scheduler.reconcileReports();

      const statusBefore = scheduler.getJobStatus();
      expect(statusBefore.size).toBeGreaterThan(0);

      await scheduler.shutdown();

      expect(scheduler.getJobStatus().size).toBe(0);
    });

    it('should not throw when there are no jobs to stop', async () => {
      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });
  });

  describe('getJobStatus', () => {
    it('should return a map of currently running jobs', async () => {
      vi.mocked(db.query).mockResolvedValue(
        reportsResult([
          makeReport({ id: '1' }),
          makeReport({ id: '2', schedule: '0 10 * * *' }),
        ])
      );

      await scheduler.reconcileReports();

      const status = scheduler.getJobStatus();
      expect(status.get('report_1')).toBe(true);
      expect(status.get('report_2')).toBe(true);
    });

    it('should return an empty map when no jobs are running', async () => {
      const status = scheduler.getJobStatus();
      expect(status.size).toBe(0);
    });
  });
});
