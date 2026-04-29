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
  cron: string;
  recipients: string[];
  config: Record<string, any>;
  active: boolean;
  meter_selections: string | null;
  created_at: Date;
  updated_at: Date;
}

export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  /** Tracks the cron expression each notification rule job was scheduled with. */
  private notificationRuleCrons: Map<string, string> = new Map();
  /** Tracks the cron expression each report job was scheduled with. */
  private reportCrons: Map<string, string> = new Map();
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
      // Reports and notification rules are now executed by the Cloudflare Worker
      // (Cron Trigger + Resend). Do not schedule them here — that would cause
      // duplicate emails alongside the Worker's scheduled runs.
      await this.initializeHealthCheck();

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
   */
  private async initializeNotificationRules(): Promise<void> {
    try {
      const { added } = await this.reconcileNotificationRules();
      logger.info(`Notification rules initialized: ${added} jobs scheduled`);
    } catch (error) {
      logger.error('Failed to initialize notification rules', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Schedule a periodic reconcile (every 5 minutes) that syncs running
   * notification-rule jobs with the current state in the database.
   * Handles rule creation, deletion, toggling active/inactive, and schedule changes.
   */
  private scheduleNotificationRuleReconcile(): void {
    const RECONCILE_KEY = 'notification_rule_reconcile';
    const task = cron.schedule('*/5 * * * *', async () => {
      logger.debug('Reconciling notification rule jobs with database');
      try {
        await this.reconcileNotificationRules();
      } catch (error) {
        logger.error('Error reconciling notification rules', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
    this.jobs.set(RECONCILE_KEY, task);
  }

  /**
   * Public method — synchronises running cron jobs with the current active rules
   * in the database. Called by the reconcile loop and the debug endpoint.
   */
  async reconcileNotificationRules(): Promise<{ added: number; removed: number; updated: number }> {
    const activeRules = await this.notificationRuleAgent.loadActiveRules();
    const activeIds = new Set(activeRules.map(r => `notification_rule_${r.notification_rule_id}`));

    let added = 0, removed = 0, updated = 0;

    // Remove jobs for rules that are no longer active / were deleted
    for (const key of this.jobs.keys()) {
      if (!key.startsWith('notification_rule_')) continue;
      if (key === 'notification_rule_reconcile') continue;
      if (!activeIds.has(key)) {
        const task = this.jobs.get(key)!;
        task.stop();
        this.jobs.delete(key);
        this.notificationRuleCrons.delete(key);
        logger.info(`Removed notification rule job: ${key}`);
        removed++;
      }
    }

    // Add or update jobs for active rules
    for (const rule of activeRules) {
      const jobKey = `notification_rule_${rule.notification_rule_id}`;
      const cronExpr = this.isValidCronExpression(rule.schedule_cron)
        ? rule.schedule_cron
        : '0 * * * *';

      const existingCron = this.notificationRuleCrons.get(jobKey);

      if (this.jobs.has(jobKey) && existingCron === cronExpr) {
        // Already running with the correct schedule — nothing to do
        continue;
      }

      // Stop old job if the schedule changed
      if (this.jobs.has(jobKey)) {
        const old = this.jobs.get(jobKey)!;
        old.stop();
        this.jobs.delete(jobKey);
        updated++;
      } else {
        added++;
      }

      try {
        const task = cron.schedule(cronExpr, async () => {
          logger.info(`Executing notification rule: ${rule.name} (${rule.notification_rule_id})`);
          await this.notificationRuleAgent.executeRule(rule);
        });
        this.jobs.set(jobKey, task);
        this.notificationRuleCrons.set(jobKey, cronExpr);
        logger.info(`Scheduled notification rule "${rule.name}" [${rule.notification_rule_id}] cron: ${cronExpr}`);
      } catch (err) {
        logger.warn(`Failed to schedule notification rule ${rule.notification_rule_id}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (added || removed || updated) {
      logger.info(`Notification rule reconcile: +${added} added, -${removed} removed, ~${updated} updated`);
    }
    return { added, removed, updated };
  }

  /**
   * Load all active reports from the database
   */
  private async loadActiveReports(): Promise<Report[]> {
    try {
      const result = await db.query<Report>(
        `SELECT report_id as id, name, type, cron, recipients, config,
                active, meter_selections, created_at, updated_at
         FROM report
         WHERE active = true
         ORDER BY created_at ASC`
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to load active reports', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Schedule a periodic reconcile (every 5 minutes) that syncs running
   * report jobs with the current state in the database.
   */
  private scheduleReportReconcile(): void {
    const task = cron.schedule('*/5 * * * *', async () => {
      logger.debug('Reconciling report jobs with database');
      try {
        await this.reconcileReports();
      } catch (error) {
        logger.error('Error reconciling reports', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
    this.jobs.set('report_reconcile', task);
  }

  /**
   * Synchronises running report cron jobs with the current active reports
   * in the database. Handles adds, removes, and schedule changes.
   */
  async reconcileReports(): Promise<{ added: number; removed: number; updated: number }> {
    const activeReports = await this.loadActiveReports();
    const activeIds = new Set(activeReports.map(r => `report_${r.id}`));

    let added = 0, removed = 0, updated = 0;

    // Remove jobs for reports that were deleted or deactivated
    for (const key of this.jobs.keys()) {
      if (!key.startsWith('report_') || key === 'report_reconcile') continue;
      if (!activeIds.has(key)) {
        this.jobs.get(key)!.stop();
        this.jobs.delete(key);
        this.reportCrons.delete(key);
        logger.info(`Removed report job: ${key}`);
        removed++;
      }
    }

    // Add or update jobs for active reports
    for (const report of activeReports) {
      const jobKey = `report_${report.id}`;
      const cronExpr = this.isValidCronExpression(report.cron) ? report.cron : '0 9 * * *';
      const existingCron = this.reportCrons.get(jobKey);

      if (this.jobs.has(jobKey) && existingCron === cronExpr) continue;

      if (this.jobs.has(jobKey)) {
        this.jobs.get(jobKey)!.stop();
        this.jobs.delete(jobKey);
        updated++;
      } else {
        added++;
      }

      try {
        const task = cron.schedule(cronExpr, async () => {
          logger.info(`Executing scheduled report: ${report.name} (${report.id})`);
          try {
            await this.reportExecutor.execute(report);
          } catch (err) {
            logger.error(`Failed to execute report ${report.id}`, {
              error: err instanceof Error ? err.message : String(err),
            });
          }
        });
        this.jobs.set(jobKey, task);
        this.reportCrons.set(jobKey, cronExpr);
        logger.info(`Scheduled report "${report.name}" [${report.id}] cron: ${cronExpr}`);
      } catch (err) {
        logger.warn(`Failed to schedule report ${report.id}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (added || removed || updated) {
      logger.info(`Report reconcile: +${added} added, -${removed} removed, ~${updated} updated`);
    }
    return { added, removed, updated };
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
    const rule = await this.notificationRuleAgent.loadRuleById(ruleId);
    if (!rule) return { found: false };
    await this.notificationRuleAgent.executeRule(rule);
    return { found: true };
  }

  /**
   * Immediately run all active reports (used by the debug endpoint).
   */
  async runAllReports(): Promise<{ reports_executed: number }> {
    const reports = await this.loadActiveReports();
    for (const report of reports) {
      await this.reportExecutor.execute(report);
    }
    return { reports_executed: reports.length };
  }

  /**
   * Load a single report by ID regardless of active status.
   */
  private async loadReportById(reportId: string): Promise<Report | null> {
    const result = await db.query<Report>(
      `SELECT report_id as id, name, type, cron, recipients, config,
              active, meter_selections, created_at, updated_at
       FROM report
       WHERE report_id = $1`,
      [reportId]
    );
    return result.rows[0] ?? null;
  }

  /**
   * Immediately run a single report by ID (used by the debug endpoint).
   */
  async runReport(reportId: string): Promise<{ found: boolean }> {
    const report = await this.loadReportById(reportId);
    if (!report) return { found: false };
    await this.reportExecutor.execute(report);
    return { found: true };
  }

  /**
   * Generate an HTML preview for a report without sending emails.
   */
  async previewReport(reportId: string): Promise<{ found: false } | { found: true; html: string }> {
    const report = await this.loadReportById(reportId);
    if (!report) return { found: false };
    const html = await this.reportExecutor.generatePreviewHtml(report);
    return { found: true, html };
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
