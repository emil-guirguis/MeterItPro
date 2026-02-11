import cron from 'node-cron';
import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';
import { ReportExecutor } from './report-executor.js';

export interface Report {
  id: string;
  name: string;
  type: string;
  schedule: string;
  recipients: string[];
  config: Record<string, any>;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private reportExecutor: ReportExecutor;

  constructor() {
    this.reportExecutor = new ReportExecutor();
  }

  /**
   * Initialize the scheduler by loading all enabled reports from the database
   * and creating cron jobs for each one
   */
  async initialize(): Promise<void> {
    logger.info('Initializing SchedulerService...');
    
    try {
      const reports = await this.loadEnabledReports();
      logger.info(`Loaded ${reports.length} enabled reports from database`);
      
      for (const report of reports) {
        await this.createJob(report);
      }
      
      logger.info(`SchedulerService initialized with ${this.jobs.size} active jobs`);
    } catch (error) {
      logger.error('Failed to initialize SchedulerService', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Load all enabled reports from the database
   */
  private async loadEnabledReports(): Promise<Report[]> {
    try {
      const query = `
        SELECT report_id as id, name, type, schedule, recipients, config, enabled, created_at, updated_at
        FROM report
        WHERE enabled = true
        ORDER BY created_at ASC
      `;
      
      const result = await db.query<Report>(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to load enabled reports', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a cron job for a report
   */
  private async createJob(report: Report): Promise<void> {
    try {
      // Validate cron expression
      if (!this.isValidCronExpression(report.schedule)) {
        logger.warn(`Invalid cron expression for report ${report.id}: ${report.schedule}`);
        return;
      }

      // Check if job already exists
      if (this.jobs.has(report.id)) {
        logger.warn(`Job already exists for report ${report.id}, skipping creation`);
        return;
      }

      // Create the cron job
      try {
        const task = cron.schedule(report.schedule, async () => {
          logger.info(`Executing scheduled report: ${report.name} (${report.id})`);
          try {
            await this.reportExecutor.execute(report);
          } catch (error) {
            logger.error(`Failed to execute report ${report.id}`, {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });

        this.jobs.set(report.id, task);
        logger.info(`Created cron job for report: ${report.name} (${report.id}) with schedule: ${report.schedule}`);
      } catch (scheduleError) {
        logger.warn(`Failed to schedule cron job for report ${report.id}: ${report.schedule}`, {
          error: scheduleError instanceof Error ? scheduleError.message : String(scheduleError),
        });
      }
    } catch (error) {
      logger.error(`Failed to create job for report ${report.id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update a report's cron job (delete old, create new)
   */
  async updateJob(report: Report): Promise<void> {
    try {
      logger.info(`Updating job for report: ${report.name} (${report.id})`);
      
      // Delete existing job if it exists
      if (this.jobs.has(report.id)) {
        const task = this.jobs.get(report.id);
        if (task) {
          task.stop();
        }
        this.jobs.delete(report.id);
        logger.info(`Stopped and removed old job for report ${report.id}`);
      }

      // Create new job if report is enabled
      if (report.enabled) {
        await this.createJob(report);
      } else {
        logger.info(`Report ${report.id} is disabled, not creating new job`);
      }
    } catch (error) {
      logger.error(`Failed to update job for report ${report.id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a report's cron job
   */
  async deleteJob(reportId: string): Promise<void> {
    try {
      if (this.jobs.has(reportId)) {
        const task = this.jobs.get(reportId);
        if (task) {
          task.stop();
        }
        this.jobs.delete(reportId);
        logger.info(`Deleted cron job for report: ${reportId}`);
      }
    } catch (error) {
      logger.error(`Failed to delete job for report ${reportId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate a cron expression
   */
  private isValidCronExpression(expression: string): boolean {
    try {
      const isValid = cron.validate(expression);
      return isValid === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the status of all jobs
   */
  getJobStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    for (const [reportId, task] of this.jobs.entries()) {
      status.set(reportId, true);
    }
    return status;
  }

  /**
   * Stop all jobs and shutdown the scheduler
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down SchedulerService...');
    
    try {
      for (const [reportId, task] of this.jobs.entries()) {
        task.stop();
        logger.info(`Stopped job for report: ${reportId}`);
      }
      
      this.jobs.clear();
      logger.info('SchedulerService shutdown complete');
    } catch (error) {
      logger.error('Error during SchedulerService shutdown', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
