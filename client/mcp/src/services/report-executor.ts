import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';
import { EmailSender } from './email-sender.js';
import type { Report } from './scheduler-service.js';

export interface ReportData {
  [key: string]: any;
}

export class ReportExecutor {
  private emailSender: EmailSender;

  constructor() {
    this.emailSender = new EmailSender();
  }

  /**
   * Execute a report: generate data, create history entry, and send emails
   */
  async execute(report: Report): Promise<void> {
    const executedAt = new Date();
    let historyId: string | null = null;

    try {
      logger.info(`Starting execution of report: ${report.name} (${report.id})`);

      // Generate report data based on type
      const reportData = await this.generateReportData(report);
      logger.info(`Generated report data for ${report.name}`, {
        reportId: report.id,
        dataSize: JSON.stringify(reportData).length,
      });

      // Create report history entry with success status
      historyId = await this.createHistoryEntry(
        report.id,
        executedAt,
        'success',
        null
      );
      logger.info(`Created history entry for report execution`, {
        reportId: report.id,
        historyId,
      });

      // Send emails to all recipients
      await this.emailSender.sendReportEmails(
        report,
        reportData,
        historyId,
        executedAt
      );

      logger.info(`Successfully executed report: ${report.name} (${report.id})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to execute report: ${report.name} (${report.id})`, {
        error: errorMessage,
      });

      // Create history entry with failed status and error message
      try {
        historyId = await this.createHistoryEntry(
          report.id,
          executedAt,
          'failed',
          errorMessage
        );
        logger.info(`Created failed history entry for report`, {
          reportId: report.id,
          historyId,
          error: errorMessage,
        });
      } catch (historyError) {
        logger.error(`Failed to create history entry for failed report execution`, {
          reportId: report.id,
          error: historyError instanceof Error ? historyError.message : String(historyError),
        });
      }

      throw error;
    }
  }

  /**
   * Generate report data based on report type
   */
  private async generateReportData(report: Report): Promise<ReportData> {
    try {
      switch (report.type) {
        case 'meter_readings':
          return await this.generateMeterReadingsReport();
        
        case 'usage_summary':
          return await this.generateUsageSummaryReport();
        
        case 'daily_summary':
          return await this.generateDailySummaryReport();
        
        default:
          logger.warn(`Unknown report type: ${report.type}, returning empty data`);
          return { type: report.type, data: [] };
      }
    } catch (error) {
      logger.error(`Failed to generate report data for type ${report.type}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate meter readings report
   */
  private async generateMeterReadingsReport(): Promise<ReportData> {
    try {
      const query = `
        SELECT 
          m.meter_id,
          m.meter_element_id,
          m.name,
          m.tenant_id,
          r.data_point,
          r.value,
          r.timestamp
        FROM meter_reading r
        JOIN meter m ON r.meter_id = m.meter_id
        WHERE r.timestamp >= NOW() - INTERVAL '24 hours'
        ORDER BY r.timestamp DESC
        LIMIT 1000
      `;

      const result = await db.query(query);
      
      return {
        type: 'meter_readings',
        generatedAt: new Date().toISOString(),
        recordCount: result.rows.length,
        data: result.rows,
      };
    } catch (error) {
      logger.error('Failed to generate meter readings report', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate usage summary report
   */
  private async generateUsageSummaryReport(): Promise<ReportData> {
    try {
      const query = `
        SELECT 
          m.tenant_id,
          COUNT(DISTINCT m.meter_id) as meter_count,
          COUNT(r.id) as reading_count,
          AVG(CAST(r.value AS FLOAT)) as avg_value,
          MAX(CAST(r.value AS FLOAT)) as max_value,
          MIN(CAST(r.value AS FLOAT)) as min_value,
          MAX(r.timestamp) as last_reading
        FROM meter m
        LEFT JOIN meter_reading r ON m.meter_id = r.meter_id AND r.timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY m.tenant_id
        ORDER BY m.tenant_id
      `;

      const result = await db.query(query);
      
      return {
        type: 'usage_summary',
        generatedAt: new Date().toISOString(),
        tenantCount: result.rows.length,
        data: result.rows,
      };
    } catch (error) {
      logger.error('Failed to generate usage summary report', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate daily summary report
   */
  private async generateDailySummaryReport(): Promise<ReportData> {
    try {
      const query = `
        SELECT 
          DATE(r.timestamp) as date,
          COUNT(DISTINCT m.meter_id) as active_meters,
          COUNT(r.id) as reading_count,
          AVG(CAST(r.value AS FLOAT)) as avg_value,
          MAX(CAST(r.value AS FLOAT)) as max_value,
          MIN(CAST(r.value AS FLOAT)) as min_value
        FROM meter_reading r
        JOIN meter m ON r.meter_id = m.meter_id
        WHERE r.timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(r.timestamp)
        ORDER BY DATE(r.timestamp) DESC
      `;

      const result = await db.query(query);
      
      return {
        type: 'daily_summary',
        generatedAt: new Date().toISOString(),
        dayCount: result.rows.length,
        data: result.rows,
      };
    } catch (error) {
      logger.error('Failed to generate daily summary report', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a report history entry in the database
   */
  private async createHistoryEntry(
    reportId: string,
    executedAt: Date,
    status: 'success' | 'failed',
    errorMessage: string | null
  ): Promise<string> {
    try {
      const query = `
        INSERT INTO report_history (report_id, executed_at, status, error_message, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING report_history_id as id
      `;

      const result = await db.query<{ id: string }>(query, [
        reportId,
        executedAt,
        status,
        errorMessage,
        new Date(),
      ]);

      if (result.rows.length === 0) {
        throw new Error('Failed to create history entry: no rows returned');
      }

      return result.rows[0].id;
    } catch (error) {
      logger.error('Failed to create report history entry', {
        reportId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
