import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';
import { EmailSender } from './email-sender.js';
import type { Report } from './scheduler-service.js';

export interface ReportData {
  [key: string]: any;
}

interface MeterSelection {
  id: string;
  meter_id: number | null;
  meter_element_ids: number[] | null;
  register_field_names: string[];
}

interface MeterElementPair {
  meter_id: string;
  meter_element_id: string;
}

export class ReportExecutor {
  private emailSender: EmailSender;

  constructor() {
    this.emailSender = new EmailSender();
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  async execute(report: Report): Promise<void> {
    const executedAt = new Date();
    let historyId: string | null = null;

    try {
      logger.info(`Starting execution of report: ${report.name} (${report.id})`);

      const reportData = await this.generateReportData(report);
      logger.info(`Generated report data for ${report.name}`, {
        reportId: report.id,
        dataSize: JSON.stringify(reportData).length,
      });

      historyId = await this.createHistoryEntry(report.id, executedAt, 'success', null);

      await this.emailSender.sendReportEmails(report, reportData, historyId, executedAt);

      logger.info(`Successfully executed report: ${report.name} (${report.id})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to execute report: ${report.name} (${report.id})`, { error: errorMessage });

      try {
        await this.createHistoryEntry(report.id, executedAt, 'failed', errorMessage);
      } catch (historyError) {
        logger.error('Failed to create failed history entry', {
          reportId: report.id,
          error: historyError instanceof Error ? historyError.message : String(historyError),
        });
      }

      throw error;
    }
  }

  // ─── Meter selection helpers ──────────────────────────────────────────────────

  private parseMeterSelections(raw: any): MeterSelection[] | null {
    if (!raw) return null;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    if (Array.isArray(raw)) return raw as MeterSelection[];
    return null;
  }

  /**
   * Returns (meter_id, meter_element_id) pairs from meter_selections.
   * If no selections, returns all active (meter, element) pairs.
   */
  private async getMeterElementPairs(report: Report): Promise<MeterElementPair[]> {
    const selections = this.parseMeterSelections(report.meter_selections);

    if (selections && selections.length > 0) {
      const pairs: MeterElementPair[] = [];
      for (const sel of selections) {
        if (!sel.meter_id) continue;
        const meterId = String(sel.meter_id);

        if (sel.meter_element_ids && sel.meter_element_ids.length > 0) {
          for (const elId of sel.meter_element_ids) {
            pairs.push({ meter_id: meterId, meter_element_id: String(elId) });
          }
        } else {
          // Expand to all elements for this meter
          const elements = await db.query<{ meter_element_id: string }>(
            `SELECT meter_element_id FROM meter_element WHERE meter_id = $1`,
            [meterId]
          );
          for (const el of elements.rows) {
            pairs.push({ meter_id: meterId, meter_element_id: el.meter_element_id });
          }
        }
      }
      return pairs;
    }

    // No specific meters — return all active (meter, element) pairs
    const all = await db.query<{ meter_id: string; meter_element_id: string }>(
      `SELECT m.meter_id, me.meter_element_id
       FROM meter m
       JOIN meter_element me ON me.meter_id = m.meter_id
       WHERE m.active = true`
    );
    return all.rows;
  }

  /**
   * Builds a SQL WHERE fragment and parameters for filtering to specific pairs.
   * Returns null when no pairs are specified (query all).
   */
  private buildPairFilter(
    pairs: MeterElementPair[],
    startParamIdx: number
  ): { sql: string; params: any[] } | null {
    if (pairs.length === 0) return null;

    const clauses = pairs.map((p, i) =>
      `(r.meter_id = $${startParamIdx + i * 2} AND r.meter_element_id = $${startParamIdx + i * 2 + 1})`
    );
    const params = pairs.flatMap(p => [p.meter_id, p.meter_element_id]);
    return { sql: `(${clauses.join(' OR ')})`, params };
  }

  // ─── Report generators ────────────────────────────────────────────────────────

  private async generateReportData(report: Report): Promise<ReportData> {
    switch (report.type) {
      case 'meter_readings':
        return this.generateMeterReadingsReport(report);
      case 'usage_summary':
        return this.generateUsageSummaryReport(report);
      case 'daily_summary':
        return this.generateDailySummaryReport(report);
      default:
        logger.warn(`Unknown report type: ${report.type}`);
        return { type: report.type, data: [] };
    }
  }

  /**
   * Meter readings report — raw readings for the past 24 hours, scoped to
   * the configured meter/element selections.
   */
  private async generateMeterReadingsReport(report: Report): Promise<ReportData> {
    const pairs = await this.getMeterElementPairs(report);
    const pairFilter = pairs.length > 0 ? this.buildPairFilter(pairs, 1) : null;

    const whereClause = [
      `r.created_at >= NOW() - INTERVAL '24 hours'`,
      pairFilter?.sql,
    ]
      .filter(Boolean)
      .join(' AND ');

    const params = pairFilter?.params ?? [];

    const result = await db.query(
      `SELECT
         m.name                          AS meter_name,
         CONCAT(COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, '?')) AS element,
         r.kwh,
         r.kw,
         r.kvar,
         r.kvarh,
         r.kva,
         r.kvah,
         r.power_factor,
         r.amperage,
         r.peak_kw,
         r.created_at
       FROM meter_reading r
       JOIN meter m ON m.meter_id = r.meter_id
       JOIN meter_element me ON me.meter_element_id = r.meter_element_id
       WHERE ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT 2000`,
      params
    );

    return {
      type: 'meter_readings',
      generatedAt: new Date().toISOString(),
      period: 'Last 24 hours',
      recordCount: result.rows.length,
      data: result.rows,
    };
  }

  /**
   * Usage summary — totals and averages per meter/element for the past 30 days.
   */
  private async generateUsageSummaryReport(report: Report): Promise<ReportData> {
    const pairs = await this.getMeterElementPairs(report);
    const pairFilter = pairs.length > 0 ? this.buildPairFilter(pairs, 1) : null;

    const whereClause = [
      `r.created_at >= NOW() - INTERVAL '30 days'`,
      pairFilter?.sql,
    ]
      .filter(Boolean)
      .join(' AND ');

    const params = pairFilter?.params ?? [];

    const result = await db.query(
      `SELECT
         m.name                                                               AS meter_name,
         CONCAT(COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, '?')) AS element,
         COUNT(*)                                                             AS reading_count,
         ROUND(SUM(r.kwh)::numeric, 2)                                       AS total_kwh,
         ROUND(AVG(r.kw)::numeric, 2)                                        AS avg_kw,
         ROUND(MAX(r.kw)::numeric, 2)                                        AS peak_kw,
         ROUND(MIN(r.kw)::numeric, 2)                                        AS min_kw,
         ROUND(AVG(r.power_factor)::numeric, 4)                              AS avg_pf,
         MAX(r.created_at)                                                    AS last_reading_at
       FROM meter_reading r
       JOIN meter m ON m.meter_id = r.meter_id
       JOIN meter_element me ON me.meter_element_id = r.meter_element_id
       WHERE ${whereClause}
       GROUP BY m.meter_id, m.name, me.meter_element_id, me.element, me.name
       ORDER BY m.name, element`,
      params
    );

    return {
      type: 'usage_summary',
      generatedAt: new Date().toISOString(),
      period: 'Last 30 days',
      meterCount: result.rows.length,
      data: result.rows,
    };
  }

  /**
   * Daily summary — daily aggregated totals for the past 30 days.
   */
  private async generateDailySummaryReport(report: Report): Promise<ReportData> {
    const pairs = await this.getMeterElementPairs(report);
    const pairFilter = pairs.length > 0 ? this.buildPairFilter(pairs, 1) : null;

    const whereClause = [
      `r.created_at >= NOW() - INTERVAL '30 days'`,
      pairFilter?.sql,
    ]
      .filter(Boolean)
      .join(' AND ');

    const params = pairFilter?.params ?? [];

    const result = await db.query(
      `SELECT
         DATE(r.created_at)                                                    AS date,
         m.name                                                                AS meter_name,
         CONCAT(COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, '?')) AS element,
         COUNT(*)                                                              AS reading_count,
         ROUND(SUM(r.kwh)::numeric, 2)                                        AS total_kwh,
         ROUND(AVG(r.kw)::numeric, 2)                                         AS avg_kw,
         ROUND(MAX(r.kw)::numeric, 2)                                         AS peak_kw
       FROM meter_reading r
       JOIN meter m ON m.meter_id = r.meter_id
       JOIN meter_element me ON me.meter_element_id = r.meter_element_id
       WHERE ${whereClause}
       GROUP BY DATE(r.created_at), m.meter_id, m.name, me.meter_element_id, me.element, me.name
       ORDER BY date DESC, m.name, element`,
      params
    );

    return {
      type: 'daily_summary',
      generatedAt: new Date().toISOString(),
      period: 'Last 30 days',
      dayCount: new Set(result.rows.map((r: any) => r.date)).size,
      data: result.rows,
    };
  }

  // ─── History ──────────────────────────────────────────────────────────────────

  private async createHistoryEntry(
    reportId: string,
    executedAt: Date,
    status: 'success' | 'failed',
    errorMessage: string | null
  ): Promise<string> {
    const result = await db.query<{ id: string }>(
      `INSERT INTO report_history (report_id, executed_at, status, error_message, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING report_history_id as id`,
      [reportId, executedAt, status, errorMessage, new Date()]
    );

    if (result.rows.length === 0) throw new Error('Failed to create history entry');
    return result.rows[0].id;
  }
}
