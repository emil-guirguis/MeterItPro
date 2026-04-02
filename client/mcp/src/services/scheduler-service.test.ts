import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchedulerService, Report } from './scheduler-service.js';
import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

// Mock dependencies
vi.mock('../database/client.js');
vi.mock('../utils/logger.js');
vi.mock('./report-executor.js');

describe('SchedulerService', () => {
  let scheduler: SchedulerService;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduler = new SchedulerService();
  });

  afterEach(async () => {
    try {
      await scheduler.shutdown();
    } catch (error) {
      // Ignore shutdown errors in tests
    }
  });

  describe('initialization', () => {
    it('should load enabled reports from database on initialization', async () => {
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Daily Report',
          type: 'meter_readings',
          schedule: '0 9 * * *',
          recipients: ['test@example.com'],
          config: {},
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(db.query).mockResolvedValueOnce({
        rows: mockReports,
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as any);

      await scheduler.initialize();

      expect(db.query).toHaveBeenCalled();
      // Check that logger.info was called with the expected message
      const calls = vi.mocked(logger.info).mock.calls;
      const loadedCall = calls.find(call => 
        typeof call[0] === 'string' && call[0].includes('Loaded')
      );
      expect(loadedCall).toBeDefined();
    });

    it('should create cron jobs for each enabled report', async () => {
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Daily Report',
          type: 'meter_readings',
          schedule: '0 9 * * *',
          recipients: ['test@example.com'],
          config: {},
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          name: 'Weekly Report',
          type: 'usage_summary',
          schedule: '0 10 * * 1',
          recipients: ['test@example.com'],
          config: {},
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(db.query).mockResolvedValueOnce({
        rows: mockReports,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as any);

      await scheduler.initialize();

      const jobStatus = scheduler.getJobStatus();
      expect(jobStatus.size).toBe(2);
      expect(jobStatus.has('1')).toBe(true);
      expect(jobStatus.has('2')).toBe(true);
    });

    it('should skip reports with invalid cron expressions', async () => {
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Invalid Report',
          type: 'meter_readings',
          schedule: 'invalid cron',
          recipients: ['test@example.com'],
          config: {},
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(db.query).mockResolvedValueOnce({
        rows: mockReports,
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      } as any);

      await scheduler.initialize();

      const jobStatus = scheduler.getJobStatus();
      expect(jobStatus.size).toBe(0);
      // Check that a warning was logged
      const calls = vi.mocked(logger.warn).mock.calls;
      const warnCall = calls.find(call => 
        typeof call[0] === 'string' && call[0].includes('Invalid cron expression')
      );
      expect(warnCall).toBeDefined();
    });

    it('should handle database errors during initialization', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(db.query).mockRejectedValueOnce(error);

      await expect(scheduler.initialize()).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize'),
        expect.any(Object)
      );
    });
  });

  describe('job management', () => {
    it('should update a job when report configuration changes', async () => {
      const report: Report = {
        id: '1',
        name: 'Updated Report',
        type: 'meter_readings',
        schedule: '0 10 * * *',
        recipients: ['test@example.com'],
        config: {},
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Create initial job
      await scheduler.updateJob(report);
      let jobStatus = scheduler.getJobStatus();
      expect(jobStatus.has('1')).toBe(true);

      // Update job with new schedule
      const updatedReport = { ...report, schedule: '0 11 * * *' };
      await scheduler.updateJob(updatedReport);
      jobStatus = scheduler.getJobStatus();
      expect(jobStatus.has('1')).toBe(true);
    });

    it('should delete a job when requested', async () => {
      const report: Report = {
        id: '1',
        name: 'Report to Delete',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['test@example.com'],
        config: {},
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Create job
      await scheduler.updateJob(report);
      let jobStatus = scheduler.getJobStatus();
      expect(jobStatus.has('1')).toBe(true);

      // Delete job
      await scheduler.deleteJob('1');
      jobStatus = scheduler.getJobStatus();
      expect(jobStatus.has('1')).toBe(false);
    });

    it('should not create job for disabled report', async () => {
      const report: Report = {
        id: '1',
        name: 'Disabled Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['test@example.com'],
        config: {},
        enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await scheduler.updateJob(report);
      const jobStatus = scheduler.getJobStatus();
      expect(jobStatus.has('1')).toBe(false);
    });

    it('should handle errors when deleting non-existent job', async () => {
      // Should not throw error
      await expect(scheduler.deleteJob('non-existent')).resolves.not.toThrow();
    });
  });

  describe('cron expression validation', () => {
    it('should validate correct cron expressions', async () => {
      const validExpressions = [
        '0 9 * * *',           // Daily at 9 AM
        '0 10 * * 1',          // Weekly on Monday at 10 AM
        '0 0 1 * *',           // Monthly on 1st at midnight
        '*/5 * * * *',         // Every 5 minutes
        '0 0 * * 0',           // Weekly on Sunday
      ];

      for (const expr of validExpressions) {
        const report: Report = {
          id: `test-${expr}`,
          name: 'Test Report',
          type: 'meter_readings',
          schedule: expr,
          recipients: ['test@example.com'],
          config: {},
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        await scheduler.updateJob(report);
        const jobStatus = scheduler.getJobStatus();
        expect(jobStatus.has(`test-${expr}`)).toBe(true);
      }
    });

    it('should reject invalid cron expressions', async () => {
      const invalidExpressions = [
        'invalid',
        'not a cron',
        'this is definitely not valid',
      ];

      for (const expr of invalidExpressions) {
        const report: Report = {
          id: `test-${expr}`,
          name: 'Test Report',
          type: 'meter_readings',
          schedule: expr,
          recipients: ['test@example.com'],
          config: {},
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Invalid cron expressions should not create jobs
        try {
          await scheduler.updateJob(report);
        } catch (error) {
          // Expected to fail or not create job
        }
        
        const jobStatus = scheduler.getJobStatus();
        expect(jobStatus.has(`test-${expr}`)).toBe(false);
      }
    });
  });

  describe('shutdown', () => {
    it('should stop all jobs on shutdown', async () => {
      const report: Report = {
        id: '1',
        name: 'Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['test@example.com'],
        config: {},
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await scheduler.updateJob(report);
      let jobStatus = scheduler.getJobStatus();
      expect(jobStatus.size).toBe(1);

      await scheduler.shutdown();
      jobStatus = scheduler.getJobStatus();
      expect(jobStatus.size).toBe(0);
    });

    it('should handle errors during shutdown gracefully', async () => {
      const report: Report = {
        id: '1',
        name: 'Report',
        type: 'meter_readings',
        schedule: '0 9 * * *',
        recipients: ['test@example.com'],
        config: {},
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await scheduler.updateJob(report);
      await expect(scheduler.shutdown()).resolves.not.toThrow();
    });
  });

  describe('job status', () => {
    it('should return correct job status', async () => {
      const reports: Report[] = [
        {
          id: '1',
          name: 'Report 1',
          type: 'meter_readings',
          schedule: '0 9 * * *',
          recipients: ['test@example.com'],
          config: {},
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          name: 'Report 2',
          type: 'usage_summary',
          schedule: '0 10 * * *',
          recipients: ['test@example.com'],
          config: {},
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      for (const report of reports) {
        await scheduler.updateJob(report);
      }

      const jobStatus = scheduler.getJobStatus();
      expect(jobStatus.size).toBe(2);
      expect(jobStatus.get('1')).toBe(true);
      expect(jobStatus.get('2')).toBe(true);
    });
  });
});
