/**
 * Tests for reportRunner — exercise the exported entry points
 * (previewReport, runReport, runAllActiveReports, generateDemandReport)
 * with execQuery mocked, which transitively covers the private helpers
 * (parseMeterSelections, splitMeterSelections, buildPairFilter,
 * getRegisterFieldNames, filterColumns, formatValue, buildTimeLabels,
 * buildLabelKeys, buildPreviewHtml, buildEmailHtml, sendEmail).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./db', () => {
  const queryFn = vi.fn();
  return {
    query: queryFn,
    execQuery: vi.fn((env: any, sql: string, params?: any[]) => queryFn(env, sql, params)),
    transaction: vi.fn(),
  };
});

vi.mock('./cronMatcher', () => ({
  matchesCronSchedule: vi.fn(),
}));

import { execQuery } from './db';
import { matchesCronSchedule } from './cronMatcher';
import {
  previewReport,
  runReport,
  runAllActiveReports,
  generateDemandReport,
} from './reportRunner';
import type { Env } from './db';

const mockExec = vi.mocked(execQuery);
const mockCron = vi.mocked(matchesCronSchedule);

const TEST_ENV: Env = {
  JWT_SECRET: 'test',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
  RESEND_API_KEY: 'test-key',
  RESEND_FROM: 'Test <noreply@test.com>',
} as any;

const baseReport = {
  report_id: 1,
  name: 'Daily Energy',
  type: 'meter_readings',
  tenant_id: 10,
  recipients: { to: ['ops@example.com'] },
  meter_selections: null,
  time_frame: 'monthly',
  visualization_type: 'bar',
  grouping_type: null,
  attach_as: 'html',
};

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = mockFetch as any;
  mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '' } as any);
});

// --- previewReport ----------------------------------------------------------

describe('previewReport', () => {
  it('throws when the report does not exist', async () => {
    mockExec.mockResolvedValueOnce({ rows: [] } as any);
    await expect(previewReport(TEST_ENV, 999)).rejects.toThrow(/not found/);
  });

  it('returns HTML containing the report name and a data table', async () => {
    // generateReportData and fetchChartSeriesData run in Promise.all — pattern-match
    // by SQL fragment instead of order-based mocks to stay deterministic.
    mockExec.mockImplementation((_env: any, sql: string) => {
      const s = String(sql);
      if (s.includes('FROM report WHERE report_id')) {
        return Promise.resolve({ rows: [{ ...baseReport }] }) as any;
      }
      if (s.includes('FROM meter_reading r') && s.includes('INTERVAL \'24 hours\'')) {
        return Promise.resolve({
          rows: [{ meter_name: 'Main (A) phaseA', created_at: '2026-01-01T00:00:00Z', kwh: 12.34 }],
        }) as any;
      }
      return Promise.resolve({ rows: [] }) as any;
    });

    const html = await previewReport(TEST_ENV, 1);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Daily Energy');
    expect(html).toContain('Main (A) phaseA');
    expect(html).toContain('12.34');
  });

  it('renders "No data available" when the result set is empty', async () => {
    mockExec
      .mockResolvedValueOnce({ rows: [{ ...baseReport, visualization_type: 'table' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any) // splitMeterSelections — no rows
      .mockResolvedValueOnce({ rows: [] } as any) // meter readings query
      .mockResolvedValue({ rows: [] } as any);

    const html = await previewReport(TEST_ENV, 1);
    expect(html).toContain('No data available');
  });

  it('does NOT include the Chart.js script for non-chart visualization types', async () => {
    mockExec
      .mockResolvedValueOnce({ rows: [{ ...baseReport, visualization_type: 'table' }] } as any)
      .mockResolvedValue({ rows: [] } as any);

    const html = await previewReport(TEST_ENV, 1);
    expect(html).not.toContain('chart.js');
  });

  it('emits the print-on-load script when attach_as is "pdf" with no chart', async () => {
    mockExec
      .mockResolvedValueOnce({ rows: [{ ...baseReport, visualization_type: 'table', attach_as: 'pdf' }] } as any)
      .mockResolvedValue({ rows: [] } as any);

    const html = await previewReport(TEST_ENV, 1);
    expect(html).toContain('window.print()');
  });
});

// --- runReport --------------------------------------------------------------

describe('runReport', () => {
  it('throws when the report does not exist or is inactive', async () => {
    mockExec.mockResolvedValueOnce({ rows: [] } as any);
    await expect(runReport(TEST_ENV, 42)).rejects.toThrow(/not found or inactive/);
  });

  it('creates a history entry, sends one email per recipient, and marks history success', async () => {
    const report = {
      ...baseReport,
      recipients: { to: ['a@x.com', 'b@x.com'], from: 'Custom <x@x.com>' },
    };
    mockExec
      // SELECT report
      .mockResolvedValueOnce({ rows: [report] } as any)
      // generateMeterReadingsReport — splitMeterSelections fallback rows
      .mockResolvedValueOnce({ rows: [] } as any)
      // fetchChartSeriesData — splitMeterSelections fallback rows (runs concurrently via Promise.all)
      .mockResolvedValueOnce({ rows: [] } as any)
      // meter readings query
      .mockResolvedValueOnce({ rows: [] } as any)
      // INSERT report_history (createHistoryEntry)
      .mockResolvedValueOnce({ rows: [{ report_history_id: 77 }] } as any)
      // INSERT report_email_logs x2
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      // UPDATE report_history success
      .mockResolvedValueOnce({ rows: [] } as any);

    await runReport(TEST_ENV, 1);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse((init as any).body);
    expect(body.from).toBe('Custom <x@x.com>');
    expect(body.to).toBe('a@x.com');
    expect(body.subject).toBe('Report: Daily Energy');

    const updateCall = mockExec.mock.calls.find(c =>
      String(c[1]).includes('UPDATE report_history')
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![2]?.[0]).toBe('success');
  });

  it('falls back to RESEND_FROM when recipients.from is not set', async () => {
    mockExec
      .mockResolvedValueOnce({ rows: [{ ...baseReport }] } as any)
      // generateMeterReadingsReport — splitMeterSelections fallback
      .mockResolvedValueOnce({ rows: [] } as any)
      // fetchChartSeriesData — splitMeterSelections fallback (concurrent via Promise.all)
      .mockResolvedValueOnce({ rows: [] } as any)
      // meter readings query
      .mockResolvedValueOnce({ rows: [] } as any)
      // INSERT report_history
      .mockResolvedValueOnce({ rows: [{ report_history_id: 1 }] } as any)
      .mockResolvedValue({ rows: [] } as any);

    await runReport(TEST_ENV, 1);

    const body = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
    expect(body.from).toBe('Test <noreply@test.com>');
  });

  it('throws if RESEND_API_KEY is missing', async () => {
    const envNoKey = { ...TEST_ENV, RESEND_API_KEY: undefined } as any;
    mockExec
      .mockResolvedValueOnce({ rows: [{ ...baseReport }] } as any)
      // generateMeterReadingsReport — splitMeterSelections fallback
      .mockResolvedValueOnce({ rows: [] } as any)
      // fetchChartSeriesData — splitMeterSelections fallback (concurrent via Promise.all)
      .mockResolvedValueOnce({ rows: [] } as any)
      // meter readings query
      .mockResolvedValueOnce({ rows: [] } as any)
      // INSERT report_history
      .mockResolvedValueOnce({ rows: [{ report_history_id: 1 }] } as any)
      // failed email log + failed history update
      .mockResolvedValue({ rows: [] } as any);

    await expect(runReport(envNoKey, 1)).rejects.toThrow();
  });

  it('throws when Resend returns a non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' } as any);
    mockExec
      .mockResolvedValueOnce({ rows: [{ ...baseReport }] } as any)
      // generateMeterReadingsReport — splitMeterSelections fallback
      .mockResolvedValueOnce({ rows: [] } as any)
      // fetchChartSeriesData — splitMeterSelections fallback (concurrent via Promise.all)
      .mockResolvedValueOnce({ rows: [] } as any)
      // meter readings query
      .mockResolvedValueOnce({ rows: [] } as any)
      // INSERT report_history
      .mockResolvedValueOnce({ rows: [{ report_history_id: 1 }] } as any)
      .mockResolvedValue({ rows: [] } as any);

    await expect(runReport(TEST_ENV, 1)).rejects.toThrow(/Email delivery failed/);

    const failureLog = mockExec.mock.calls.find(c =>
      String(c[1]).includes('INSERT INTO report_email_logs') && c[2]?.[4] === 'failed'
    );
    expect(failureLog).toBeDefined();
  });

  it('marks history failed and rethrows when generateReportData fails', async () => {
    mockExec
      .mockResolvedValueOnce({ rows: [{ ...baseReport }] } as any)
      // splitMeterSelections rejects
      .mockRejectedValueOnce(new Error('db down'))
      // createHistoryEntry (in catch fallback)
      .mockResolvedValue({ rows: [{ report_history_id: 99 }] } as any);

    await expect(runReport(TEST_ENV, 1)).rejects.toThrow(/db down/);

    const failedHistory = mockExec.mock.calls.find(c => {
      const sql = String(c[1]);
      return (sql.includes('INSERT INTO report_history') || sql.includes('UPDATE report_history'))
        && c[2]?.includes('failed');
    });
    expect(failedHistory).toBeDefined();
  });
});

// --- runAllActiveReports ----------------------------------------------------

describe('runAllActiveReports', () => {
  it('skips reports whose cron schedule does not match the trigger time', async () => {
    mockExec.mockResolvedValueOnce({
      rows: [
        { report_id: 1, cron: '0 9 * * *' },
        { report_id: 2, cron: '0 17 * * *' },
      ],
    } as any);
    mockCron.mockReturnValue(false);

    await runAllActiveReports(TEST_ENV, new Date('2026-01-01T12:00:00Z'));

    expect(mockCron).toHaveBeenCalledTimes(2);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('continues running other reports even when one throws', async () => {
    mockExec
      // active reports list
      .mockResolvedValueOnce({
        rows: [
          { report_id: 1, cron: '* * * * *' },
          { report_id: 2, cron: '* * * * *' },
        ],
      } as any)
      // runReport(1) — SELECT report fails
      .mockResolvedValueOnce({ rows: [] } as any)
      // runReport(2) — SELECT report ok
      .mockResolvedValueOnce({ rows: [{ ...baseReport, report_id: 2 }] } as any)
      // generateMeterReadingsReport — splitMeterSelections fallback
      .mockResolvedValueOnce({ rows: [] } as any)
      // fetchChartSeriesData — splitMeterSelections fallback (concurrent via Promise.all)
      .mockResolvedValueOnce({ rows: [] } as any)
      // meter readings query
      .mockResolvedValueOnce({ rows: [] } as any)
      // INSERT report_history
      .mockResolvedValueOnce({ rows: [{ report_history_id: 1 }] } as any)
      .mockResolvedValue({ rows: [] } as any);
    mockCron.mockReturnValue(true);

    await runAllActiveReports(TEST_ENV, new Date());

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// --- generateDemandReport ---------------------------------------------------

describe('generateDemandReport', () => {
  it('returns peak demand sorted descending across physical + virtual meters', async () => {
    const report = {
      ...baseReport,
      type: 'demand',
      meter_selections: [
        { id: 'a', meter_id: 1, meter_element_ids: [11], register_field_names: [] },
        { id: 'b', meter_id: 2, meter_element_ids: [],   register_field_names: [] },
      ],
    };

    mockExec
      // splitMeterSelections — virtual id lookup
      .mockResolvedValueOnce({ rows: [{ meter_id: 2 }] } as any)
      // physical query
      .mockResolvedValueOnce({
        rows: [{ meter_name: 'Phys (A)', peak_demand_kw: '5.50', peak_reading_at: '2026-01-01 10:00:00', reading_count: 100 }],
      } as any)
      // virtual demand query (one)
      .mockResolvedValueOnce({
        rows: [{ meter_name: 'Virt', peak_demand_kw: '12.00', peak_reading_at: '2026-01-01 11:00:00', reading_count: 50 }],
      } as any);

    const result = await generateDemandReport(TEST_ENV, report as any);

    expect(result.type).toBe('demand');
    expect(result.data).toHaveLength(2);
    expect(Number(result.data[0].peak_demand_kw)).toBeGreaterThan(Number(result.data[1].peak_demand_kw));
    expect(result.meterCount).toBe(2);
  });

  it('returns an empty data set when no selections resolve to any meter', async () => {
    const report = {
      ...baseReport,
      type: 'demand',
      meter_selections: [],
    };

    // splitMeterSelections "no selections" branch — fetch all physical pairs
    mockExec.mockResolvedValueOnce({ rows: [] } as any);

    const result = await generateDemandReport(TEST_ENV, report as any);

    expect(result.data).toEqual([]);
    expect(result.meterCount).toBe(0);
  });

  it('capitalizes the time_frame into a period label', async () => {
    const report = { ...baseReport, type: 'demand', time_frame: 'weekly' };
    mockExec.mockResolvedValueOnce({ rows: [] } as any);

    const result = await generateDemandReport(TEST_ENV, report as any);
    expect(result.period).toBe('Weekly');
  });
});
