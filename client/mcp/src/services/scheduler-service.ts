import cron from 'node-cron';
import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';
import { ReportExecutor } from './report-executor.js';
import { checkMeterHealth } from '../tools/check-meter-health.js';
import { NotificationRuleAgent } from './notification-rule-agent.js';

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
  private notificationRuleAgent: NotificationRuleAgent;

  constructor() {
    this.reportExecutor = new ReportExecutor();
    this.notificationRuleAgent = new NotificationRuleAgent();
  }

  /**
   * Initialize the scheduler by loading all active reports from the database
   * and creating cron jobs for each one
   */
  async initialize(): Promise<void> {
    logger.info('Initializing SchedulerService...');
    
    try {
      const reports = await this.loadActiveReports();
      logger.info(`Loaded ${reports.length} active reports from database`);

      for (const report of reports) {
        await this.createJob(report);
      }

      await this.initializeHealthCheck();
      await this.initializeNotificationRules();

      logger.info(`SchedulerService initialized with ${this.jobs.size} active jobs`);
    } catch (error) {
      logger.error('Failed to initialize SchedulerService', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Initialize the health check cron job.
   * Runs immediately on startup, then every 60 minutes.
   */
  private async initializeHealthCheck(): Promise<void> {
    const HEALTH_CHECK_KEY = 'health_check';
    const DEFAULT_CRON = '0 * * * *'; // every 60 minutes

    const runHealthCheck = async () => {
      logger.info('Running meter health check');
      try {
        const result = await checkMeterHealth({});
        const text = result.content[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          logger.info('Health check completed', { summary: parsed.summary });
        }
      } catch (error) {
        logger.error('Health check failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    try {
      // Stop existing health check job if present
      if (this.jobs.has(HEALTH_CHECK_KEY)) {
        const existing = this.jobs.get(HEALTH_CHECK_KEY);
        if (existing) existing.stop();
        this.jobs.delete(HEALTH_CHECK_KEY);
      }

      // Load cron expression from notification_settings for this tenant
      let cronExpression = DEFAULT_CRON;
      try {
        const tenantResult = await db.query(`SELECT tenant_id FROM tenant LIMIT 1`);
        if (tenantResult.rows.length > 0) {
          const tenantId = tenantResult.rows[0].tenant_id;
          const result = await db.query(
            `SELECT health_check_cron FROM notification_settings WHERE tenant_id = $1 LIMIT 1`,
            [tenantId]
          );
          if (result.rows.length > 0 && result.rows[0].health_check_cron) {
            cronExpression = result.rows[0].health_check_cron;
          }
        }
      } catch (dbError) {
        logger.warn('Could not load notification_settings, using default cron for health check', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
      }

      if (!this.isValidCronExpression(cronExpression)) {
        logger.warn(`Invalid health check cron expression: ${cronExpression}, using default`);
        cronExpression = DEFAULT_CRON;
      }

      // Run immediately at startup
      await runHealthCheck();

      // Then schedule recurring runs
      const task = cron.schedule(cronExpression, runHealthCheck);
      this.jobs.set(HEALTH_CHECK_KEY, task);
      logger.info(`Health check job scheduled with cron: ${cronExpression}`);
    } catch (error) {
      logger.error('Failed to initialize health check job', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load all active notification rules and create a cron job for each one.
   * Each job calls NotificationRuleAgent.executeRule(rule) on its schedule.
   */
  private async initializeNotificationRules(): Promise<void> {
    try {
      const rules = await this.notificationRuleAgent.loadActiveRules();
      logger.info(`Loaded ${rules.length} active notification rules`);

      for (const rule of rules) {
        const jobKey = `notification_rule_${rule.notification_rule_id}`;

        if (this.jobs.has(jobKey)) continue;

        const cronExpr = this.isValidCronExpression(rule.schedule_cron)
          ? rule.schedule_cron
          : '0 * * * *';

        try {
          const task = cron.schedule(cronExpr, async () => {
            logger.info(`Executing notification rule: ${rule.name} (${rule.notification_rule_id})`);
            await this.notificationRuleAgent.executeRule(rule);
          });
          this.jobs.set(jobKey, task);
          logger.info(`Scheduled notification rule "${rule.name}" with cron: ${cronExpr}`);
        } catch (err) {
          logger.warn(`Failed to schedule notification rule ${rule.notification_rule_id}`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (error) {
      logger.error('Failed to initialize notification rules', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load all active reports from the database
   */
  private async loadActiveReports(): Promise<Report[]> {
    try {
      const query = `
        SELECT report_id as id, name, type, schedule, recipients, config, active, created_at, updated_at
        FROM report
        WHERE active = true
        ORDER BY created_at ASC
      `;
      
      const result = await db.query<Report>(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to load active reports', {
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
   * Immediately run all active notification rules (used by the debug endpoint).
   */
  async runAllNotificationRules(): Promise<{ rules_executed: number }> {
    const rules = await this.notificationRuleAgent.loadActiveRules();
    for (const rule of rules) {
      await this.notificationRuleAgent.executeRule(rule);
    }
    return { rules_executed: rules.length };
  }

  /**
   * Immediately run a single notification rule by ID (used by the per-rule debug endpoint).
   */
  async runNotificationRule(ruleId: string): Promise<{ found: boolean }> {
    const rules = await this.notificationRuleAgent.loadActiveRules();
    const rule = rules.find(r => String(r.notification_rule_id) === String(ruleId));
    if (!rule) return { found: false };
    await this.notificationRuleAgent.executeRule(rule);
    return { found: true };
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
