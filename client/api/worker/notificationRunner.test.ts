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

const METER_ELEMENT_PAIR = {
  meter_id: '10',
  meter_element_id: '20',
  display_name: 'Main Meter    A-Phase A',
};

describe('runNotificationRule', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockReset();
  });

  it('throws when rule not found', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(runNotificationRule(TEST_ENV, '999')).rejects.toThrow('not found or inactive');
  });

  it('throws when rule is inactive (returns empty rows)', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await expect(runNotificationRule(TEST_ENV, '1')).rejects.toThrow();
  });

  describe('meter_no_reading rule', () => {
    it('clears notification when no gaps found', async () => {
      mockExecQuery
        .mockResolvedValueOnce({ rows: [BASE_RULE] } as any)              // fetch rule
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any) // all elements
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)     // display names
        .mockResolvedValueOnce({ rows: [{ last_reading_at: new Date() }] } as any) // pre-check: recent reading
        .mockResolvedValueOnce({ rows: [] } as any)                        // gap check: no gaps
        .mockResolvedValueOnce({ rows: [] } as any);                       // clearNotification DELETE

      await runNotificationRule(TEST_ENV, '1');

      const deleteCall = mockExecQuery.mock.calls.find(([, sql]) => sql.includes('DELETE FROM notification'));
      expect(deleteCall).toBeDefined();
    });

    it('upserts notification and sends email when gaps are found', async () => {
      mockExecQuery
        .mockResolvedValueOnce({ rows: [BASE_RULE] } as any)             // fetch rule
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any) // all elements
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)    // display names
        .mockResolvedValueOnce({ rows: [{ last_reading_at: new Date() }] } as any) // pre-check: recent reading
        .mockResolvedValueOnce({                                          // gap result
          rows: [{
            total_number_of_gaps: '2',
            gap_duration_minutes: '120',
            gap_starts_at: new Date('2024-01-15T08:00:00Z'),
            gap_ends_at: new Date('2024-01-15T10:00:00Z'),
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)                       // clearNotification DELETE
        .mockResolvedValueOnce({ rows: [] } as any)                       // upsertNotification INSERT
        .mockResolvedValueOnce({ rows: [{ email_address: 'admin@test.com' }] } as any); // getEmailRecipients

      mockFetch.mockResolvedValueOnce({ ok: true });

      await runNotificationRule(TEST_ENV, '1');

      expect(mockFetch).toHaveBeenCalledOnce();
      const fetchArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchArgs[1].body);
      expect(body.to).toBe('admin@test.com');
    });

    it('skips email when no recipients', async () => {
      mockExecQuery
        .mockResolvedValueOnce({ rows: [BASE_RULE] } as any)
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        .mockResolvedValueOnce({ rows: [{ last_reading_at: new Date() }] } as any) // pre-check: recent
        .mockResolvedValueOnce({
          rows: [{ total_number_of_gaps: '1', gap_duration_minutes: '90', gap_starts_at: new Date(), gap_ends_at: new Date() }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any) // clearNotification
        .mockResolvedValueOnce({ rows: [] } as any) // upsertNotification INSERT
        .mockResolvedValueOnce({ rows: [] } as any); // no recipients

      await runNotificationRule(TEST_ENV, '1');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fires immediately and sends email when last reading exceeds threshold', async () => {
      const oldDate = new Date(Date.now() - 48 * 3_600_000); // 48h ago, threshold is 24h
      mockExecQuery
        .mockResolvedValueOnce({ rows: [BASE_RULE] } as any)
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        .mockResolvedValueOnce({ rows: [{ last_reading_at: oldDate }] } as any) // pre-check: stale
        .mockResolvedValueOnce({ rows: [] } as any)   // clearNotification DELETE
        .mockResolvedValueOnce({ rows: [] } as any)   // upsertNotification INSERT
        .mockResolvedValueOnce({ rows: [{ email_address: 'admin@test.com' }] } as any);

      mockFetch.mockResolvedValueOnce({ ok: true });

      await runNotificationRule(TEST_ENV, '1');

      const insertCall = mockExecQuery.mock.calls.find(([, sql]) => sql.includes('INSERT INTO notification'));
      expect(insertCall).toBeDefined();
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('detects gap that crosses the window boundary', async () => {
      // Meter recovered today after 7-day gap — pre-check sees recent reading,
      // gap check must see the pre-window boundary reading to catch the gap.
      const recentReading = new Date(); // 5/19
      mockExecQuery
        .mockResolvedValueOnce({ rows: [BASE_RULE] } as any)
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        .mockResolvedValueOnce({ rows: [{ last_reading_at: recentReading }] } as any) // pre-check: recent
        .mockResolvedValueOnce({                                                       // gap crosses boundary
          rows: [{
            total_number_of_gaps: '1',
            gap_duration_minutes: String(7 * 24 * 60),
            gap_starts_at: new Date(Date.now() - 7 * 24 * 3_600_000),
            gap_ends_at: recentReading,
          }],
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any)   // clearNotification DELETE
        .mockResolvedValueOnce({ rows: [] } as any)   // upsertNotification INSERT
        .mockResolvedValueOnce({ rows: [{ email_address: 'admin@test.com' }] } as any);

      mockFetch.mockResolvedValueOnce({ ok: true });

      await runNotificationRule(TEST_ENV, '1');

      const insertCall = mockExecQuery.mock.calls.find(([, sql]) => sql.includes('INSERT INTO notification'));
      expect(insertCall).toBeDefined();
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('fires immediately when no readings ever recorded', async () => {
      mockExecQuery
        .mockResolvedValueOnce({ rows: [BASE_RULE] } as any)
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        .mockResolvedValueOnce({ rows: [{ last_reading_at: null }] } as any) // pre-check: never recorded
        .mockResolvedValueOnce({ rows: [] } as any)  // clearNotification DELETE
        .mockResolvedValueOnce({ rows: [] } as any)  // upsertNotification INSERT
        .mockResolvedValueOnce({ rows: [] } as any); // no recipients

      await runNotificationRule(TEST_ENV, '1');

      const insertCall = mockExecQuery.mock.calls.find(([, sql]) => sql.includes('INSERT INTO notification'));
      expect(insertCall).toBeDefined();
    });
  });

  describe('meter_zero_reading rule', () => {
    const ZERO_RULE = { ...BASE_RULE, rule_type: 'meter_zero_reading' };

    it('clears notification when readings are not all zero', async () => {
      mockExecQuery
        .mockResolvedValueOnce({ rows: [ZERO_RULE] } as any)
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '10', zero_count: '3' }] } as any) // not all zero
        .mockResolvedValueOnce({ rows: [] } as any); // clearNotification

      await runNotificationRule(TEST_ENV, '1');

      const calls = mockExecQuery.mock.calls;
      const deleteCall = calls.find(([, sql]) => sql.includes('DELETE FROM notification'));
      expect(deleteCall).toBeDefined();
    });

    it('upserts notification when all readings are zero', async () => {
      mockExecQuery
        .mockResolvedValueOnce({ rows: [ZERO_RULE] } as any)
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '5', zero_count: '5' }] } as any) // all zero
        .mockResolvedValueOnce({ rows: [] } as any) // clearNotification DELETE
        .mockResolvedValueOnce({ rows: [] } as any) // upsertNotification INSERT
        .mockResolvedValueOnce({ rows: [] } as any); // no recipients

      await runNotificationRule(TEST_ENV, '1');

      const calls = mockExecQuery.mock.calls;
      const insertCall = calls.find(([, sql]) => sql.includes('INSERT INTO notification'));
      expect(insertCall).toBeDefined();
    });

    it('clears notification when total is 0', async () => {
      mockExecQuery
        .mockResolvedValueOnce({ rows: [ZERO_RULE] } as any)
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '0', zero_count: '0' }] } as any) // no readings
        .mockResolvedValueOnce({ rows: [] } as any); // clearNotification

      await runNotificationRule(TEST_ENV, '1');

      const insertCall = mockExecQuery.mock.calls.find(([, sql]) => sql.includes('INSERT INTO notification'));
      expect(insertCall).toBeUndefined();
    });
  });

  describe('demand_threshold rule', () => {
    const DEMAND_RULE = {
      ...BASE_RULE,
      rule_type: 'demand_threshold',
      demand_threshold: 100,
      threshold_hours: 1,
    };

    it('skips when demand_threshold is null', async () => {
      const ruleNoDemand = { ...DEMAND_RULE, demand_threshold: null };
      mockExecQuery.mockResolvedValueOnce({ rows: [ruleNoDemand] } as any);

      await runNotificationRule(TEST_ENV, '1');
      // Only 1 DB call (fetch rule); no further queries
      expect(mockExecQuery).toHaveBeenCalledOnce();
    });

    it('clears notification when demand is within threshold', async () => {
      mockExecQuery
        .mockResolvedValueOnce({ rows: [DEMAND_RULE] } as any)
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        .mockResolvedValueOnce({ rows: [] } as any) // no readings exceeding threshold
        .mockResolvedValueOnce({ rows: [] } as any); // clearNotification

      await runNotificationRule(TEST_ENV, '1');

      const deleteCall = mockExecQuery.mock.calls.find(([, sql]) => sql.includes('DELETE FROM notification'));
      expect(deleteCall).toBeDefined();
    });

    it('upserts notification when peak demand exceeds threshold', async () => {
      mockExecQuery
        .mockResolvedValueOnce({ rows: [DEMAND_RULE] } as any)
        .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        .mockResolvedValueOnce({ rows: [{ kw: '150.5', created_at: new Date() }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any) // clearNotification DELETE
        .mockResolvedValueOnce({ rows: [] } as any) // upsertNotification INSERT
        .mockResolvedValueOnce({ rows: [] } as any); // no recipients

      await runNotificationRule(TEST_ENV, '1');

      const insertCall = mockExecQuery.mock.calls.find(([, sql]) => sql.includes('INSERT INTO notification'));
      expect(insertCall).toBeDefined();
    });
  });

  describe('meter selections', () => {
    it('uses explicit meter element IDs from selections', async () => {
      const ruleWithSelections = {
        ...BASE_RULE,
        meter_selections: JSON.stringify([
          { meter_id: 10, meter_element_ids: [20, 21] },
        ]),
      };

      mockExecQuery
        .mockResolvedValueOnce({ rows: [ruleWithSelections] } as any)
        // display names query (skips individual element fetches since IDs are explicit)
        .mockResolvedValueOnce({ rows: [
          METER_ELEMENT_PAIR,
          { ...METER_ELEMENT_PAIR, meter_element_id: '21', display_name: 'Main Meter    A-Phase B' },
        ] } as any)
        // pair 1
        .mockResolvedValueOnce({ rows: [{ last_reading_at: new Date() }] } as any) // pre-check
        .mockResolvedValueOnce({ rows: [] } as any) // gap check: no gaps
        .mockResolvedValueOnce({ rows: [] } as any) // clear
        // pair 2
        .mockResolvedValueOnce({ rows: [{ last_reading_at: new Date() }] } as any) // pre-check
        .mockResolvedValueOnce({ rows: [] } as any) // gap check: no gaps
        .mockResolvedValueOnce({ rows: [] } as any); // clear

      await runNotificationRule(TEST_ENV, '1');
      expect(mockExecQuery).toHaveBeenCalled();
    });

    it('fetches elements from DB when no element IDs in selection', async () => {
      const ruleWithMeterOnly = {
        ...BASE_RULE,
        meter_selections: JSON.stringify([
          { meter_id: 10 }, // no meter_element_ids
        ]),
      };

      mockExecQuery
        .mockResolvedValueOnce({ rows: [ruleWithMeterOnly] } as any)
        // fetch elements for meter 10
        .mockResolvedValueOnce({ rows: [{ meter_element_id: '20' }] } as any)
        // display names
        .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
        // pre-check: recent reading
        .mockResolvedValueOnce({ rows: [{ last_reading_at: new Date() }] } as any)
        // gap check
        .mockResolvedValueOnce({ rows: [] } as any)
        // clear notification
        .mockResolvedValueOnce({ rows: [] } as any);

      await runNotificationRule(TEST_ENV, '1');

      // Second call should be the element fetch
      const elementFetchCall = mockExecQuery.mock.calls[1];
      expect(elementFetchCall[1]).toContain('meter_element_id FROM meter_element');
    });
  });
});

describe('runAllActiveNotificationRules', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockReset();
  });

  it('runs rules where cron matches', async () => {
    const now = new Date('2024-01-15T10:00:00Z');
    mockMatchesCron.mockReturnValue(true);

    mockExecQuery
      .mockResolvedValueOnce({ rows: [BASE_RULE] } as any) // fetch all rules
      // rule execution (meter_no_reading, no selections)
      .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
      .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
      .mockResolvedValueOnce({ rows: [{ last_reading_at: new Date() }] } as any) // pre-check: recent
      .mockResolvedValueOnce({ rows: [] } as any) // no gaps
      .mockResolvedValueOnce({ rows: [] } as any); // clearNotification

    await runAllActiveNotificationRules(TEST_ENV, now);

    expect(mockMatchesCron).toHaveBeenCalledWith(BASE_RULE.schedule_cron, now);
    expect(mockExecQuery).toHaveBeenCalledTimes(6);
  });

  it('skips rules where cron does not match', async () => {
    const now = new Date('2024-01-15T10:00:00Z');
    mockMatchesCron.mockReturnValue(false);

    mockExecQuery.mockResolvedValueOnce({ rows: [BASE_RULE] } as any);

    await runAllActiveNotificationRules(TEST_ENV, now);

    // Only 1 DB call (fetch rules), no execution queries
    expect(mockExecQuery).toHaveBeenCalledOnce();
  });

  it('continues after a rule throws an error', async () => {
    const rule2 = { ...BASE_RULE, notification_rule_id: '2', rule_type: 'unknown_type' };
    mockMatchesCron.mockReturnValue(true);

    mockExecQuery
      .mockResolvedValueOnce({ rows: [BASE_RULE, rule2] } as any) // fetch rules
      // BASE_RULE execution
      .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
      .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    // Should not throw even though rule2 has unknown type
    await expect(runAllActiveNotificationRules(TEST_ENV, new Date())).resolves.toBeUndefined();
  });

  it('uses current time when no date provided', async () => {
    mockMatchesCron.mockReturnValue(false);
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);

    await runAllActiveNotificationRules(TEST_ENV);

    expect(mockMatchesCron).not.toHaveBeenCalled();
    expect(mockExecQuery).toHaveBeenCalledOnce();
  });

  it('processes multiple matching rules', async () => {
    const rule2 = {
      ...BASE_RULE,
      notification_rule_id: '2',
      rule_type: 'meter_zero_reading',
    };
    mockMatchesCron.mockReturnValue(true);

    mockExecQuery
      .mockResolvedValueOnce({ rows: [BASE_RULE, rule2] } as any) // fetch rules
      // Rule 1 (meter_no_reading)
      .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
      .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
      .mockResolvedValueOnce({ rows: [{ last_reading_at: new Date() }] } as any) // pre-check: recent
      .mockResolvedValueOnce({ rows: [] } as any) // no gaps
      .mockResolvedValueOnce({ rows: [] } as any) // clear
      // Rule 2 (meter_zero_reading)
      .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
      .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
      .mockResolvedValueOnce({ rows: [{ total: '5', zero_count: '3' }] } as any) // not all zero
      .mockResolvedValueOnce({ rows: [] } as any); // clear

    await runAllActiveNotificationRules(TEST_ENV, new Date());
    expect(mockMatchesCron).toHaveBeenCalledTimes(2);
  });
});

describe('email behavior', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockReset();
  });

  it('skips email when RESEND_API_KEY is not set', async () => {
    const envNoResend = { ...TEST_ENV, RESEND_API_KEY: undefined } as any;
    mockExecQuery
      .mockResolvedValueOnce({ rows: [BASE_RULE] } as any)
      .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
      .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
      .mockResolvedValueOnce({
        rows: [{ total_number_of_gaps: '1', gap_duration_minutes: '60', gap_starts_at: new Date(), gap_ends_at: new Date() }],
      } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [{ email_address: 'admin@test.com' }] } as any);

    await runNotificationRule(envNoResend, '1');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends to multiple recipients', async () => {
    mockExecQuery
      .mockResolvedValueOnce({ rows: [BASE_RULE] } as any)
      .mockResolvedValueOnce({ rows: [{ meter_id: '10', meter_element_id: '20' }] } as any)
      .mockResolvedValueOnce({ rows: [METER_ELEMENT_PAIR] } as any)
      .mockResolvedValueOnce({
        rows: [{ total_number_of_gaps: '1', gap_duration_minutes: '60', gap_starts_at: new Date(), gap_ends_at: new Date() }],
      } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({
        rows: [
          { email_address: 'admin@test.com' },
          { email_address: 'manager@test.com' },
        ],
      } as any);

    mockFetch.mockResolvedValue({ ok: true });

    await runNotificationRule(TEST_ENV, '1');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
