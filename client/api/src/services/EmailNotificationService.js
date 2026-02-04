/**
 * Email Notification Service
 * 
 * Sends daily email summaries of outstanding notifications.
 * Runs on a configurable cron schedule (default: 9 AM daily).
 */

const cron = require('node-cron');
const NotificationService = require('./NotificationService');
const NotificationSettings = require('../models/NotificationSettingsWithSchema');
const EmailService = require('./EmailService');
const db = require('../config/database');
const { CRON_CONSTANTS } = require('../constants/cronConstants');

class EmailNotificationService {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
    this.lastRunTime = null;
    this.lastRunStatus = null;
  }

  /**
   * Initialize and start the email notification service
   */
  async initialize(tenantId = 1) {
    try {
      console.log('📧 Initializing EmailNotificationService...');

      // Get current settings for tenant
      const settings = await NotificationSettings.getByTenant(tenantId);
      const schedule = (settings && settings['daily_meter_health_email_time']) || CRON_CONSTANTS.NOTIFICATION_DAILY_EMAIL.DEFAULT;

      console.log(`📅 EmailNotificationService schedule: ${schedule}`);

      // Start the cron job
      this.start(schedule);

      console.log('✅ EmailNotificationService initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error initializing EmailNotificationService:', errorMessage);
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
    console.log(`✅ EmailNotificationService cron job started with schedule: ${schedule}`);
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('⏹️ EmailNotificationService cron job stopped');
    }
  }

  /**
   * Restart the cron job with a new schedule
   */
  restart(newSchedule) {
    console.log(`🔄 Restarting EmailNotificationService with new schedule: ${newSchedule}`);
    this.stop();
    this.start(newSchedule);
  }

  /**
   * Run the daily email notification
   */
  async run(tenantId = 1) {
    try {
      this.lastRunTime = new Date();
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📧 EmailNotificationService running at ${this.lastRunTime.toISOString()}`);
      console.log(`${'='.repeat(80)}`);

      // Get current settings for tenant
      const settings = await NotificationSettings.getByTenant(tenantId);

      // Check if notifications are enabled
      if (!settings) {
        console.log('⚠️ Notification settings not found. Skipping email send.');
        this.lastRunStatus = 'disabled';
        return;
      }

      // Get all non-cleared notifications
      const result = await NotificationService.listNotifications(1000, 0);
      const notifications = result.notifications;

      if (!notifications || notifications.length === 0) {
        console.log('ℹ️ No notifications to send. Skipping email.');
        this.lastRunStatus = 'no_notifications';
        return;
      }

      console.log(`📊 Found ${notifications.length} notifications to send`);

      // Get email template
      const emailTemplateId = settings['email_template_id'];
      if (!emailTemplateId) {
        console.log('⚠️ No email template configured. Skipping email send.');
        this.lastRunStatus = 'no_template';
        return;
      }

      const template = await this.getEmailTemplate(emailTemplateId);
      if (!template) {
        console.log('⚠️ Email template not found. Skipping email send.');
        this.lastRunStatus = 'template_not_found';
        return;
      }

      // Populate template variables
      const emailContent = this.populateTemplate(template, notifications);

      // Send email
      await this.sendEmail(template, emailContent);

      console.log('✅ Email sent successfully');
      this.lastRunStatus = 'success';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error in EmailNotificationService.run():', errorMessage);
      this.lastRunStatus = 'error';
      throw error;
    }
  }

  /**
   * Get email template by ID
   */
  async getEmailTemplate(templateId) {
    try {
      const result = await db.query(
        'SELECT * FROM email_templates WHERE id = $1',
        [templateId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error getting email template:', errorMessage);
      throw error;
    }
  }

  /**
   * Populate email template with notification data
   */
  populateTemplate(template, notifications) {
    let subject = template.subject || '';
    let body = template.body || template.content || '';

    // Replace template variables
    const notificationCount = notifications.length;
    const currentDate = new Date().toLocaleDateString();
    const loginUrl = process.env.SYSTEM_LOGIN_URL || 'http://localhost:3000/login';

    // Format notifications for email
    const notificationsList = notifications
      .map(n => `- Meter: ${n.meter_id}, Element: ${n.element_id}, Type: ${n.notification_type}, Created: ${n.created_at}`)
      .join('\n');

    subject = subject
      .replace(/{{notification_count}}/g, notificationCount)
      .replace(/{{current_date}}/g, currentDate);

    body = body
      .replace(/{{notification_count}}/g, notificationCount)
      .replace(/{{notifications}}/g, notificationsList)
      .replace(/{{login_url}}/g, loginUrl)
      .replace(/{{current_date}}/g, currentDate);

    return {
      subject,
      body
    };
  }

  /**
   * Send email
   */
  async sendEmail(template, emailContent) {
    try {
      const sendTo = template.send_to || process.env.NOTIFICATION_EMAIL_TO;
      const sendFrom = template.send_from || process.env.NOTIFICATION_EMAIL_FROM;

      if (!sendTo || !sendFrom) {
        throw new Error('Missing sendTo or sendFrom email addresses');
      }

      console.log(`📨 Sending email to ${sendTo} from ${sendFrom}`);

      // Use EmailService to send email
      if (EmailService && EmailService.sendEmail) {
        await EmailService.sendEmail({
          to: sendTo,
          from: sendFrom,
          subject: emailContent.subject,
          html: emailContent.body
        });
      } else {
        console.log('⚠️ EmailService not available. Email not sent.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error sending email:', errorMessage);
      throw error;
    }
  }

  /**
   * Get the status of the email notification service
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
const emailNotificationService = new EmailNotificationService();

module.exports = emailNotificationService;
