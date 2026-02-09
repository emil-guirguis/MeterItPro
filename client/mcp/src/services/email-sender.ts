import nodemailer from 'nodemailer';
import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import type { Report } from './scheduler-service.js';
import type { ReportData } from './report-executor.js';

export class EmailSender {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize the email transporter
   */
  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });
      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Send report emails to all configured recipients
   */
  async sendReportEmails(
    report: Report,
    reportData: ReportData,
    historyId: string,
    sentAt: Date
  ): Promise<void> {
    try {
      logger.info(`Sending report emails for report: ${report.name}`, {
        recipientCount: report.recipients.length,
      });

      // Send email to each recipient
      for (const recipient of report.recipients) {
        try {
          await this.sendEmailToRecipient(
            report,
            reportData,
            recipient,
            historyId,
            sentAt
          );
        } catch (error) {
          logger.error(`Failed to send email to recipient: ${recipient}`, {
            reportId: report.id,
            error: error instanceof Error ? error.message : String(error),
          });
          // Continue with next recipient even if one fails
        }
      }

      logger.info(`Completed sending report emails for report: ${report.name}`);
    } catch (error) {
      logger.error(`Failed to send report emails for report: ${report.name}`, {
        reportId: report.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Send email to a single recipient
   */
  private async sendEmailToRecipient(
    report: Report,
    reportData: ReportData,
    recipient: string,
    historyId: string,
    sentAt: Date
  ): Promise<void> {
    let emailLogId: string | null = null;
    let deliveryStatus: 'sent' | 'failed' = 'sent';
    let errorDetails: string | null = null;

    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      // Prepare email content
      const emailContent = this.formatEmailContent(report, reportData);

      // Send email
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to: recipient,
        subject: `Report: ${report.name}`,
        html: emailContent,
      });

      logger.info(`Email sent successfully to ${recipient}`, {
        reportId: report.id,
        messageId: info.messageId,
      });

      // Create email log entry with success status
      emailLogId = await this.createEmailLogEntry(
        report.id,
        historyId,
        recipient,
        sentAt,
        'delivered',
        null
      );

      logger.info(`Created email log entry for successful delivery`, {
        reportId: report.id,
        historyId,
        recipient,
        emailLogId,
      });
    } catch (error) {
      deliveryStatus = 'failed';
      errorDetails = error instanceof Error ? error.message : String(error);

      logger.error(`Failed to send email to ${recipient}`, {
        reportId: report.id,
        error: errorDetails,
      });

      // Create email log entry with failed status
      try {
        emailLogId = await this.createEmailLogEntry(
          report.id,
          historyId,
          recipient,
          sentAt,
          'failed',
          errorDetails
        );

        logger.info(`Created email log entry for failed delivery`, {
          reportId: report.id,
          historyId,
          recipient,
          emailLogId,
          error: errorDetails,
        });
      } catch (logError) {
        logger.error(`Failed to create email log entry for failed delivery`, {
          reportId: report.id,
          recipient,
          error: logError instanceof Error ? logError.message : String(logError),
        });
      }

      throw error;
    }
  }

  /**
   * Format email content as HTML
   */
  private formatEmailContent(report: Report, reportData: ReportData): string {
    const timestamp = new Date().toISOString();
    
    let dataHtml = '<p>No data available</p>';
    
    if (reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0) {
      // Create a simple table from the data
      const headers = Object.keys(reportData.data[0]);
      dataHtml = `
        <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              ${headers.map(h => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${reportData.data.slice(0, 100).map(row => `
              <tr>
                ${headers.map(h => `<td style="border: 1px solid #ddd; padding: 8px;">${this.formatValue(row[h])}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${reportData.data.length > 100 ? `<p><em>Showing first 100 of ${reportData.data.length} records</em></p>` : ''}
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px; }
            .content { margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.name}</h1>
            <p>Report Type: ${report.type}</p>
          </div>
          
          <div class="content">
            <p><strong>Generated:</strong> ${timestamp}</p>
            <p><strong>Records:</strong> ${reportData.recordCount || reportData.siteCount || reportData.dayCount || 'N/A'}</p>
            
            ${dataHtml}
          </div>
          
          <div class="footer">
            <p>This is an automated report. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Format a value for display in email
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    return String(value);
  }

  /**
   * Create an email log entry in the database
   */
  private async createEmailLogEntry(
    reportId: string,
    historyId: string,
    recipient: string,
    sentAt: Date,
    status: 'sent' | 'failed' | 'delivered',
    errorDetails: string | null
  ): Promise<string> {
    try {
      const query = `
        INSERT INTO report_email_logs (report_id, report_history_id, recipient, sent_at, status, error_details, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING report_email_logs_id as id
      `;

      const result = await db.query<{ id: string }>(query, [
        reportId,
        historyId,
        recipient,
        sentAt,
        status,
        errorDetails,
        new Date(),
      ]);

      if (result.rows.length === 0) {
        throw new Error('Failed to create email log entry: no rows returned');
      }

      return result.rows[0].id;
    } catch (error) {
      logger.error('Failed to create email log entry', {
        reportId,
        historyId,
        recipient,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
