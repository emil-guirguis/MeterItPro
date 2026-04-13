/**
 * Report execution for Cloudflare Workers.
 *
 * Ports the MCP ReportExecutor + EmailSender logic to run inside a Worker:
 * - Queries are done via the Worker's `query()` helper (Hyperdrive / pg).
 * - Email is sent via the Resend HTTP API (no TCP / nodemailer required).
 *
 * Required env vars (set via `npx wrangler secret put`):
 *   RESEND_API_KEY  — API key from resend.com (free tier: 3,000 emails/month)
 *   RESEND_FROM     — "From" address, e.g. "MeterItPro <noreply@meteritpro.com>"
 */

import { query, Env } from './db';
import { matchesCronSchedule } from './cronMatcher';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  report_id: number;
  name: string;
  type: string;
  recipients: string[];
  meter_selections: string | any[] | null;
  config: Record<string, any>;
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

interface ReportData {
  type: string;
  generatedAt: string;
  period?: string;
  recordCount?: number;
  meterCount?: number;
  dayCount?: number;
  data: Record<string, any>[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMeterSelections(raw: any): MeterSelection[] | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  if (Array.isArray(raw)) return raw as MeterSelection[];
  return null;
}

async function getMeterElementPairs(env: Env, report: Report): Promise<MeterElementPair[]> {
  const selections = parseMeterSelections(report.meter_selections);

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
        const elements = await query<{ meter_element_id: string }>(
          env,
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

  const all = await query<{ meter_id: string; meter_element_id: string }>(
    env,
    `SELECT m.meter_id, me.meter_element_id
     FROM meter m
     JOIN meter_element me ON me.meter_id = m.meter_id
     WHERE m.active = true`
  );
  return all.rows;
}

function buildPairFilter(
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

function getRegisterFieldNames(report: Report): string[] | null {
  const selections = parseMeterSelections(report.meter_selections);
  if (!selections || selections.length === 0) return null;
  const names = selections.flatMap(s => s.register_field_names ?? []);
  return names.length > 0 ? [...new Set(names)] : null;
}

const INTERNAL_IDS = new Set(['meter_reading_id', 'meter_id', 'meter_element_id', 'tenant_id', 'device_id', 'reading_id']);
const IDENTIFIERS = new Set(['meter_name', 'element', 'created_at', 'date']);

function filterColumns(rows: Record<string, any>[], allowedFields: string[] | null): Record<string, any>[] {
  if (!allowedFields) {
    return rows.map(row =>
      Object.fromEntries(Object.entries(row).filter(([k]) => !INTERNAL_IDS.has(k)))
    );
  }
  const allowed = new Set([...IDENTIFIERS, ...allowedFields]);
  return rows.map(row =>
    Object.fromEntries(Object.entries(row).filter(([k]) => allowed.has(k)))
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

// ─── Report data generators ───────────────────────────────────────────────────

async function generateMeterReadingsReport(env: Env, report: Report): Promise<ReportData> {
  const pairs = await getMeterElementPairs(env, report);
  const pairFilter = pairs.length > 0 ? buildPairFilter(pairs, 1) : null;

  const whereClause = [`r.created_at >= NOW() - INTERVAL '24 hours'`, pairFilter?.sql]
    .filter(Boolean).join(' AND ');

  const result = await query(
    env,
    `SELECT
       m.name                                                                  AS meter_name,
       CONCAT(COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, '?'))   AS element,
       r.*
     FROM meter_reading r
     JOIN meter m ON m.meter_id = r.meter_id
     JOIN meter_element me ON me.meter_element_id = r.meter_element_id
     WHERE ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT 2000`,
    pairFilter?.params ?? []
  );

  const data = filterColumns(result.rows, getRegisterFieldNames(report));
  return { type: 'meter_readings', generatedAt: new Date().toISOString(), period: 'Last 24 hours', recordCount: data.length, data };
}

async function generateUsageSummaryReport(env: Env, report: Report): Promise<ReportData> {
  const pairs = await getMeterElementPairs(env, report);
  const pairFilter = pairs.length > 0 ? buildPairFilter(pairs, 1) : null;

  const whereClause = [`r.created_at >= NOW() - INTERVAL '30 days'`, pairFilter?.sql]
    .filter(Boolean).join(' AND ');

  const result = await query(
    env,
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
    pairFilter?.params ?? []
  );

  const data = filterColumns(result.rows, getRegisterFieldNames(report));
  return { type: 'usage_summary', generatedAt: new Date().toISOString(), period: 'Last 30 days', meterCount: data.length, data };
}

async function generateDailySummaryReport(env: Env, report: Report): Promise<ReportData> {
  const pairs = await getMeterElementPairs(env, report);
  const pairFilter = pairs.length > 0 ? buildPairFilter(pairs, 1) : null;

  const whereClause = [`r.created_at >= NOW() - INTERVAL '30 days'`, pairFilter?.sql]
    .filter(Boolean).join(' AND ');

  const result = await query(
    env,
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
    pairFilter?.params ?? []
  );

  const data = filterColumns(result.rows, getRegisterFieldNames(report));
  return {
    type: 'daily_summary',
    generatedAt: new Date().toISOString(),
    period: 'Last 30 days',
    dayCount: new Set(data.map((r: any) => r.date)).size,
    data,
  };
}

async function generateReportData(env: Env, report: Report): Promise<ReportData> {
  switch (report.type) {
    case 'meter_readings':  return generateMeterReadingsReport(env, report);
    case 'usage_summary':   return generateUsageSummaryReport(env, report);
    case 'daily_summary':   return generateDailySummaryReport(env, report);
    default:
      console.warn(`[reportRunner] Unknown report type: ${report.type}`);
      return { type: report.type, generatedAt: new Date().toISOString(), data: [] };
  }
}

// ─── HTML email body ──────────────────────────────────────────────────────────

function buildEmailHtml(report: Report, reportData: ReportData): string {
  const rows = Array.isArray(reportData.data) ? reportData.data : [];
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const displayRows = rows.slice(0, 100);

  const tableHtml = rows.length === 0
    ? '<p style="color:#6b7280;font-style:italic">No data available for this report.</p>'
    : `<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:12px">
        <thead>
          <tr style="background:#1a56db;color:#fff">
            ${headers.map(h => `<th style="padding:6px 8px;text-align:left;text-transform:capitalize">${h.replace(/_/g, ' ')}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${displayRows.map((row, i) => `
            <tr style="${i % 2 === 1 ? 'background:#f9fafb' : ''}">
              ${headers.map(h => `<td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top">${formatValue(row[h])}</td>`).join('')}
            </tr>`).join('')}
        </tbody>
       </table>
       ${rows.length > 100 ? `<p style="color:#6b7280;font-size:11px;margin-top:8px">Showing first 100 of ${rows.length} records.</p>` : ''}`;

  const meta = [
    reportData.period       ? `<p><strong>Period:</strong> ${reportData.period}</p>` : '',
    reportData.recordCount != null ? `<p><strong>Records:</strong> ${reportData.recordCount}</p>` : '',
    reportData.meterCount  != null ? `<p><strong>Meters:</strong> ${reportData.meterCount}</p>` : '',
    reportData.dayCount    != null ? `<p><strong>Days:</strong> ${reportData.dayCount}</p>` : '',
  ].filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${report.name}</title></head>
<body style="font-family:Arial,sans-serif;font-size:13px;color:#111;background:#fff;padding:24px;margin:0">
  <div style="border-bottom:2px solid #1a56db;padding-bottom:12px;margin-bottom:16px">
    <h1 style="font-size:20px;color:#1a56db;margin:0">${report.name}</h1>
    <p style="color:#555;margin-top:4px;font-size:11px">Type: ${report.type} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
  </div>
  <div style="margin-bottom:16px">${meta}</div>
  ${tableHtml}
  <p style="color:#9ca3af;font-size:11px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:12px">
    This is an automated report from MeterItPro. Please do not reply to this email.
  </p>
</body>
</html>`;
}

// ─── Email via Resend ─────────────────────────────────────────────────────────

async function sendEmail(env: Env, to: string, subject: string, html: string): Promise<void> {
  const apiKey = (env as any).RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured — run: npx wrangler secret put RESEND_API_KEY');

  const from = (env as any).RESEND_FROM || 'MeterItPro <noreply@meteritpro.com>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error (${res.status}): ${err}`);
  }
}

// ─── History helpers ──────────────────────────────────────────────────────────

async function createHistoryEntry(
  env: Env,
  reportId: number,
  executedAt: Date,
  status: 'pending' | 'success' | 'failed',
  errorMessage: string | null
): Promise<number> {
  const result = await query<{ report_history_id: number }>(
    env,
    `INSERT INTO report_history (report_id, executed_at, status, error_message, created_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING report_history_id`,
    [reportId, executedAt, status, errorMessage, new Date()]
  );
  if (result.rows.length === 0) throw new Error('Failed to create history entry');
  return result.rows[0].report_history_id;
}

async function updateHistoryEntry(
  env: Env,
  historyId: number,
  status: 'success' | 'failed',
  errorMessage: string | null
): Promise<void> {
  await query(
    env,
    `UPDATE report_history SET status = $1, error_message = $2 WHERE report_history_id = $3`,
    [status, errorMessage, historyId]
  );
}

async function createEmailLogEntry(
  env: Env,
  reportId: number,
  historyId: number,
  recipient: string,
  sentAt: Date,
  status: 'delivered' | 'failed',
  errorDetails: string | null
): Promise<void> {
  await query(
    env,
    `INSERT INTO report_email_logs (report_id, report_history_id, recipient, sent_at, status, error_details, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [reportId, historyId, recipient, sentAt, status, errorDetails, new Date()]
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate and return the HTML preview for a report without sending emails.
 */
export async function previewReport(env: Env, reportId: number): Promise<string> {
  const reportResult = await query<Report>(
    env,
    `SELECT report_id, name, type, recipients, meter_selections, config
     FROM report WHERE report_id = $1`,
    [reportId]
  );

  if (reportResult.rows.length === 0) {
    throw new Error(`Report ${reportId} not found`);
  }

  const report = reportResult.rows[0];
  const reportData = await generateReportData(env, report);
  return buildEmailHtml(report, reportData);
}

/**
 * Execute a single report: generate data, send emails, record history.
 * Throws on fatal errors; partial email failures are logged but not thrown.
 */
export async function runReport(env: Env, reportId: number): Promise<void> {
  const reportResult = await query<Report>(
    env,
    `SELECT report_id, name, type, recipients, meter_selections, config
     FROM report WHERE report_id = $1 AND active = true`,
    [reportId]
  );

  if (reportResult.rows.length === 0) {
    throw new Error(`Report ${reportId} not found or inactive`);
  }

  const report = reportResult.rows[0];
  const executedAt = new Date();
  let historyId: number | null = null;

  try {
    const reportData = await generateReportData(env, report);
    historyId = await createHistoryEntry(env, report.report_id, executedAt, 'pending', null);

    const html = buildEmailHtml(report, reportData);
    const subject = `Report: ${report.name}`;
    const failures: string[] = [];

    for (const recipient of report.recipients) {
      try {
        await sendEmail(env, recipient, subject, html);
        await createEmailLogEntry(env, report.report_id, historyId, recipient, executedAt, 'delivered', null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failures.push(`${recipient}: ${msg}`);
        await createEmailLogEntry(env, report.report_id, historyId, recipient, executedAt, 'failed', msg).catch(() => {});
      }
    }

    if (failures.length > 0) {
      throw new Error(`Email delivery failed for ${failures.length} recipient(s): ${failures.join('; ')}`);
    }

    await updateHistoryEntry(env, historyId, 'success', null);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (historyId !== null) {
      await updateHistoryEntry(env, historyId, 'failed', msg).catch(() => {});
    } else {
      await createHistoryEntry(env, reportId, executedAt, 'failed', msg).catch(() => {});
    }
    throw error;
  }
}

/**
 * Run all active reports whose cron schedule matches `now` — used by the cron trigger.
 * Pass the scheduled event time so reports fire only at their configured time.
 */
export async function runAllActiveReports(env: Env, now: Date = new Date()): Promise<void> {
  const result = await query<{ report_id: number; schedule: string }>(
    env,
    `SELECT report_id, schedule FROM report WHERE active = true`
  );

  for (const row of result.rows) {
    if (!matchesCronSchedule(row.schedule, now)) {
      console.log(`[cron] Report ${row.report_id} skipped — schedule "${row.schedule}" does not match ${now.toISOString()}`);
      continue;
    }

    try {
      await runReport(env, row.report_id);
      console.log(`[cron] Report ${row.report_id} executed successfully`);
    } catch (err) {
      console.error(`[cron] Report ${row.report_id} failed:`, err instanceof Error ? err.message : err);
    }
  }
}
