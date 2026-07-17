import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./db', () => ({
  execQuery: vi.fn(),
}));

vi.mock('./cronMatcher', () => ({
  matchesCronSchedule: vi.fn(),
}));

vi.mock('./errorHandler', () => ({
  logError: vi.fn(),
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import { execQuery } from './db';
import { matchesCronSchedule } from './cronMatcher';
import { runNotificationRule, runAllActiveNotificationRules } from './notificationRunner';
import type { Env } from './db';

const mockExecQuery = vi.mocked(execQuery);
const mockMatchesCron = vi.mocked(matchesCronSchedule);

const TEST_ENV: Env = {
  JWT_SECRET: 'test',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
  RESEND_API_KEY: 'test-resend-key',
} as any;

const BASE_RULE = {
  notification_rule_id: '1',
  tenant_id: '100',
  name: 'Test Rule',
  rule_type: 'meter_no_reading',
  threshold_hours: 24,
  demand_threshold: null,
  schedule_cron: '0 * * * *',
  meter_selections: null,
};

const PAIR_ROW = { meter_id: '10', meter_element_id: '20' };
const NAME_ROW = { meter_id: '10', meter_element_id: '20', display_name: 'Main Meter    A-Phase A' };

/** Helper: route mocked queries by SQL content. */
function routeQueries(handlers: Array<{ match: string; rows: any[] }>) {
  mockExecQuery.mockImplementation(async (_env: any, sql: any) => {
    const text = String(sql);
    for (const h of handlers) {
      if (text.includes(h.match)) return { rows: h.rows } as any;
    }
    return { rows: [] } as any;
  });
}

const RULE_FETCH = { match: 'FROM notification_rule WHERE notification_rule_id', rows: [BASE_RULE] };
const PAIRS_FETCH = { match: 'JOIN meter_element me ON me.meter_id = m.meter_id', rows: [PAIR_ROW] };
const NAMES_FETCH = { match: 'AS display_name', rows: [NAME_ROW] };
const RECIPIENTS = { match: 'notification_rule_recipient', rows: [{ email_address: 'ops@x.com' }] };

describe('runNotificationRule', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true } as any);
  });

  it('throws when rule not found', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(runNotificationRule(TEST_ENV, '999')).rejects.toThrow('not found or inactive');
  });

  describe('meter_no_reading (gap-table backed)', () => {
    it('clears notification when element healthy (no silence, no open gaps)', async () => {
      routeQueries([RULE_FETCH, PAIRS_FETCH, NAMES_FETCH,
        { match: 'meter_element_watermark', rows: [] },
        { match: 'meter_reading_gap', rows: [] },
      ]);

      await runNotificationRule(TEST_ENV, '1');

      const deleteCall = mockExecQuery.mock.calls.find(c => String(c[1]).includes('DELETE FROM notification'));
      expect(deleteCall).toBeDefined();
      const insertCall = mockExecQuery.mock.calls.find(c => String(c[1]).includes('INSERT INTO notification'));
      expect(insertCall).toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fires alert + email for silent element (new alert)', async () => {
      routeQueries([RULE_FETCH, PAIRS_FETCH, NAMES_FETCH, RECIPIENTS,
        { match: 'meter_element_watermark', rows: [{ ...PAIR_ROW, last_reading_at: null }] },
        { match: 'meter_reading_gap', rows: [] },
        { match: 'SELECT n.meter_id', rows: [] }, // no existing notification
      ]);

      await runNotificationRule(TEST_ENV, '1');

      const upsert = mockExecQuery.mock.calls.find(c => String(c[1]).includes('INSERT INTO notification'));
      expect(upsert).toBeDefined();
      expect(String(upsert![1])).toContain('ON CONFLICT ON CONSTRAINT notification_unique_target');
      expect(mockFetch).toHaveBeenCalledTimes(1); // one recipient
      const stamp = mockExecQuery.mock.calls.find(c => String(c[1]).includes('SET last_notified_at = NOW()'));
      expect(stamp).toBeDefined();
    });

    it('reads gaps from meter_reading_gap, not meter_reading window scans', async () => {
      routeQueries([RULE_FETCH, PAIRS_FETCH, NAMES_FETCH, RECIPIENTS,
        { match: 'meter_element_watermark', rows: [] },
        { match: 'meter_reading_gap', rows: [{
          ...PAIR_ROW,
          gap_start: '2026-07-16T10:00:00Z', gap_end: '2026-07-16T14:00:00Z',
          gap_minutes: '240', total_gaps: '2',
        }] },
        { match: 'SELECT n.meter_id', rows: [] },
      ]);

      await runNotificationRule(TEST_ENV, '1');

      const sqls = mockExecQuery.mock.calls.map(c => String(c[1]));
      expect(sqls.some(s => s.includes('LAG('))).toBe(false); // no window scans
      const upsert = mockExecQuery.mock.calls.find(c => String(c[1]).includes('INSERT INTO notification'));
      expect(upsert).toBeDefined();
      const params = upsert![2] as any[];
      expect(params.join(' ')).toContain('2 reading gaps detected');
    });

    it('suppresses email when alert already notified recently', async () => {
      routeQueries([RULE_FETCH, PAIRS_FETCH, NAMES_FETCH, RECIPIENTS,
        { match: 'meter_element_watermark', rows: [{ ...PAIR_ROW, last_reading_at: null }] },
        { match: 'meter_reading_gap', rows: [] },
        { match: 'SELECT n.meter_id', rows: [{
          ...PAIR_ROW, status: 'open', last_notified_at: new Date().toISOString(),
        }] },
      ]);

      await runNotificationRule(TEST_ENV, '1');

      expect(mockFetch).not.toHaveBeenCalled();
      // upsert still refreshes the row
      expect(mockExecQuery.mock.calls.some(c => String(c[1]).includes('INSERT INTO notification'))).toBe(true);
    });

    it('re-notifies when last_notified_at is past the renotify window', async () => {
      const old = new Date(Date.now() - 25 * 3_600_000).toISOString();
      routeQueries([RULE_FETCH, PAIRS_FETCH, NAMES_FETCH, RECIPIENTS,
        { match: 'meter_element_watermark', rows: [{ ...PAIR_ROW, last_reading_at: null }] },
        { match: 'meter_reading_gap', rows: [] },
        { match: 'SELECT n.meter_id', rows: [{ ...PAIR_ROW, status: 'open', last_notified_at: old }] },
      ]);

      await runNotificationRule(TEST_ENV, '1');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('never emails acknowledged alerts', async () => {
      const old = new Date(Date.now() - 100 * 3_600_000).toISOString();
      routeQueries([RULE_FETCH, PAIRS_FETCH, NAMES_FETCH, RECIPIENTS,
        { match: 'meter_element_watermark', rows: [{ ...PAIR_ROW, last_reading_at: null }] },
        { match: 'meter_reading_gap', rows: [] },
        { match: 'SELECT n.meter_id', rows: [{ ...PAIR_ROW, status: 'acknowledged', last_notified_at: old }] },
      ]);

      await runNotificationRule(TEST_ENV, '1');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('meter_zero_reading', () => {
    const ZERO_RULE = { ...BASE_RULE, rule_type: 'meter_zero_reading' };

    it('uses one grouped query and fires when all readings zero', async () => {
      routeQueries([
        { match: 'FROM notification_rule WHERE notification_rule_id', rows: [ZERO_RULE] },
        PAIRS_FETCH, NAMES_FETCH, RECIPIENTS,
        { match: 'GROUP BY r.meter_id, r.meter_element_id', rows: [{ ...PAIR_ROW, total: '8', zero_count: '8' }] },
        { match: 'SELECT n.meter_id', rows: [] },
      ]);

      await runNotificationRule(TEST_ENV, '1');

      const grouped = mockExecQuery.mock.calls.filter(c => String(c[1]).includes('GROUP BY r.meter_id'));
      expect(grouped).toHaveLength(1); // set-based: one query for all pairs
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('clears when readings are non-zero', async () => {
      routeQueries([
        { match: 'FROM notification_rule WHERE notification_rule_id', rows: [ZERO_RULE] },
        PAIRS_FETCH, NAMES_FETCH,
        { match: 'GROUP BY r.meter_id, r.meter_element_id', rows: [{ ...PAIR_ROW, total: '8', zero_count: '3' }] },
      ]);

      await runNotificationRule(TEST_ENV, '1');

      expect(mockExecQuery.mock.calls.some(c => String(c[1]).includes('DELETE FROM notification'))).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('demand_threshold', () => {
    const DEMAND_RULE = { ...BASE_RULE, rule_type: 'demand_threshold', demand_threshold: 500, threshold_hours: 1 };

    it('fires on peak above threshold via DISTINCT ON query', async () => {
      routeQueries([
        { match: 'FROM notification_rule WHERE notification_rule_id', rows: [DEMAND_RULE] },
        PAIRS_FETCH, NAMES_FETCH, RECIPIENTS,
        { match: 'DISTINCT ON (r.meter_id, r.meter_element_id)', rows: [{ ...PAIR_ROW, kw: '612.5', created_at: '2026-07-17T11:00:00Z' }] },
        { match: 'SELECT n.meter_id', rows: [] },
      ]);

      await runNotificationRule(TEST_ENV, '1');

      const upsert = mockExecQuery.mock.calls.find(c => String(c[1]).includes('INSERT INTO notification'));
      expect(upsert).toBeDefined();
      expect((upsert![2] as any[]).join(' ')).toContain('612.5');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('skips rule when no demand_threshold configured', async () => {
      routeQueries([
        { match: 'FROM notification_rule WHERE notification_rule_id', rows: [{ ...DEMAND_RULE, demand_threshold: null }] },
      ]);
      await runNotificationRule(TEST_ENV, '1');
      expect(mockExecQuery).toHaveBeenCalledTimes(1); // only the rule fetch
    });
  });
});

describe('runAllActiveNotificationRules', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true } as any);
  });

  it('evaluates rules with shouldFire=false when cron does not match (no email, still reconciles)', async () => {
    mockMatchesCron.mockReturnValue(false);
    mockExecQuery.mockImplementation(async (_env: any, sql: any) => {
      const text = String(sql);
      if (text.includes("FROM notification_rule WHERE active = true")) return { rows: [BASE_RULE] } as any;
      if (text.includes('JOIN meter_element me')) return { rows: [PAIR_ROW] } as any;
      if (text.includes('AS display_name')) return { rows: [NAME_ROW] } as any;
      if (text.includes('meter_element_watermark')) return { rows: [{ ...PAIR_ROW, last_reading_at: null }] } as any;
      return { rows: [] } as any;
    });

    await runAllActiveNotificationRules(TEST_ENV);

    // Alert row still upserted (state reconciled) but no email sent.
    expect(mockExecQuery.mock.calls.some(c => String(c[1]).includes('INSERT INTO notification'))).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('continues past a failing rule', async () => {
    mockMatchesCron.mockReturnValue(true);
    const rules = [BASE_RULE, { ...BASE_RULE, notification_rule_id: '2', rule_type: 'bogus' }];
    mockExecQuery.mockImplementation(async (_env: any, sql: any) => {
      const text = String(sql);
      if (text.includes("FROM notification_rule WHERE active = true")) return { rows: rules } as any;
      if (text.includes('JOIN meter_element me')) throw new Error('db exploded');
      return { rows: [] } as any;
    });

    await expect(runAllActiveNotificationRules(TEST_ENV)).resolves.toBeUndefined();
  });
});
