/**
 * Notification Agent Service
 * 
 * Monitors meter health and creates notifications for failing or stale readings.
 * Runs on a configurable cron schedule (default: every 2 hours).
 * Uses tenant_id from global cache (set during user authentication).
 */

const cron = require('node-cron');
const NotificationService = require('./NotificationService');
const NotificationSettings = require('../models/NotificationSettingsWithSchema');
const { CRON_CONSTANTS } = require('../constants/cronConstants');

class NotificationAgent {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
    this.lastRunTime = null;
    this.lastRunStatus = null;
  }

  /**
   * Initialize and start the notification agent
   */
  async initialize() {
    try {
      console.log('🔔 Initializing NotificationAgent...');

      // Use default schedule since we don't have a global settings anymore
      const schedule = CRON_CONSTANTS.NOTIFICATION_HEALTH_CHECK.DEFAULT;

      console.log(`📅 NotificationAgent schedule: ${schedule}`);

      // Start the cron job
      this.start(schedule);

      console.log('✅ NotificationAgent initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing NotificationAgent:', error);
      throw error;
    }
  }

  /**
   * Start the cron job with the given schedule
   */
  start(schedule) {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    this.cronJob = cron.schedule(schedule, async () => {
      await this.run();
    });

    this.isRunning = true;
    console.log(`✅ NotificationAgent cron job started with schedule: ${schedule}`);
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('⏹️ NotificationAgent cron job stopped');
    }
  }

  /**
   * Restart the cron job with a new schedule
   */
  restart(newSchedule) {
    console.log(`🔄 Restarting NotificationAgent with new schedule: ${newSchedule}`);
    this.stop();
    this.start(newSchedule);
  }

  /**
   * Run the health check and create notifications
   */
  async run() {
    try {
      this.lastRunTime = new Date();
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔔 NotificationAgent running at ${this.lastRunTime.toISOString()}`);
      console.log(`${'='.repeat(80)}`);

      // Get tenant ID from global cache (set during authentication)
      const tenantId = global.currentTenantId;

      if (!tenantId) {
        console.log('⚠️ No tenant context available. Agent requires authenticated user context.');
        this.lastRunStatus = 'no_tenant_context';
        return;
      }

      console.log(`📊 Processing notifications for tenant ${tenantId}`);

      try {
        // Get tenant settings
        const settings = await NotificationSettings.getByTenant(tenantId);

        // Check meter health for this tenant
        const issues = await this.checkMeterHealthForTenant(tenantId);

        if (!issues || issues.length === 0) {
          console.log(`✅ No meter health issues for tenant ${tenantId}`);
          this.lastRunStatus = 'success_no_issues';
          return;
        }

        console.log(`📊 Found ${issues.length} meter health issues for tenant ${tenantId}`);

        // Process each issue and create notifications
        let createdCount = 0;
        let duplicateCount = 0;

        for (const issue of issues) {
          try {
            // @ts-ignore - issue_type and description come from SQL query
            const issueType = issue?.issue_type || 'unknown';
            // @ts-ignore - issue_type and description come from SQL query
            const description = issue?.description || '';

            const notification = await NotificationService.createIfNotExists(
              tenantId,
              issueType,
              description
            );

            if (notification) {
              createdCount++;
              console.log(`✅ Created notification for tenant ${tenantId}, type ${issueType}`);
            } else {
              duplicateCount++;
              console.log(`⚠️ Duplicate notification for tenant ${tenantId}, type ${issueType}`);
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Error creating notification for tenant ${tenantId}:`, errorMsg);
          }
        }

        console.log(`\n📈 Summary: Created ${createdCount} notifications, ${duplicateCount} duplicates`);
        this.lastRunStatus = 'success';
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Error processing tenant ${tenantId}:`, errorMsg);
        this.lastRunStatus = 'error';
        throw err;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('❌ Error in NotificationAgent.run():', errorMsg);
      this.lastRunStatus = 'error';
      throw err;
    }
  }

  /**
   * Check meter health for a specific tenant
   * Returns array of health issues with type and description
   */
  async checkMeterHealthForTenant(tenantId) {
    try {
      console.log(`📡 Checking meter health for tenant ${tenantId}...`);

      const db = require('../config/database');

      // Get meters with stale or failing readings
      const result = await db.query(
        `SELECT DISTINCT
          m.meter_id,
          m.meter_name,
          CASE 
            WHEN mr.status = 'error' THEN 'meter_error'
            WHEN mr.status = 'stale' THEN 'meter_stale'
            ELSE 'meter_unknown'
          END as issue_type,
          CASE
            WHEN mr.status = 'error' THEN 'Meter reading error detected'
            WHEN mr.status = 'stale' THEN 'Meter reading is stale (no update in past 1 hour)'
            ELSE 'Unknown meter issue'
          END as description
        FROM meter m
        LEFT JOIN meter_readings mr ON m.meter_id = mr.meter_id
        WHERE m.tenant_id = $1
          AND (mr.status = 'error' OR (mr.status = 'stale' AND mr.updated_at < NOW() - INTERVAL '1 hour'))
        LIMIT 100`,
        [tenantId]
      );

      return result.rows;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error checking meter health for tenant ${tenantId}:`, errorMsg);
      return [];
    }
  }

  /**
   * Get the status of the notification agent
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      lastRunStatus: this.lastRunStatus
    };
  }
}

// Create singleton instance
const notificationAgent = new NotificationAgent();

module.exports = notificationAgent;
