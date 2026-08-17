import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./db', () => ({
  execQuery: vi.fn(),
}));

import { execQuery } from './db';
import { runQualityEngine } from './qualityEngine';
import type { Env } from './db';

const mockExecQuery = vi.mocked(execQuery);

const TEST_ENV: Env = {
  JWT_SECRET: 'test',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
} as any;

describe('runQualityEngine', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockExecQuery.mockResolvedValue({ rows: [] } as any);
  });

  it('runs all six steps in order', async () => {
    await runQualityEngine(TEST_ENV);

    expect(mockExecQuery).toHaveBeenCalledTimes(6);
    const sqls = mockExecQuery.mock.calls.map(call => String(call[1]));

    // 1. seed watermarks
    expect(sqls[0]).toContain('INSERT INTO meter_element_watermark');
    expect(sqls[0]).toContain('ON CONFLICT (meter_element_id) DO NOTHING');
    // 2. interior gaps via LAG scan
    expect(sqls[1]).toContain('LAG(r.created_at)');
    expect(sqls[1]).toContain('INSERT INTO meter_reading_gap');
    // 3. resolve tail gaps
    expect(sqls[2]).toContain('SET gap_end = f.first_ts');
    expect(sqls[2]).toContain("g2.gap_end IS NULL");
    // 4. close backfilled gaps
    expect(sqls[3]).toContain("SET status = 'closed'");
    expect(sqls[3]).toContain('EXISTS');
    // 5. advance watermarks
    expect(sqls[4]).toContain('UPDATE meter_element_watermark');
    expect(sqls[4]).toContain('last_checked_at');
    // 6. open tail gaps for silent elements
    expect(sqls[5]).toContain('INSERT INTO meter_reading_gap');
    expect(sqls[5]).toContain('gap_end IS NULL');
  });

  it('interior gap scan is incremental (watermark-bounded)', async () => {
    await runQualityEngine(TEST_ENV);
    const scanSql = String(mockExecQuery.mock.calls[1][1]);
    expect(scanSql).toContain('r.created_at > COALESCE(w.last_checked_at');
  });

  it('detects gaps only past interval + tolerance', async () => {
    await runQualityEngine(TEST_ENV);
    const scanSql = String(mockExecQuery.mock.calls[1][1]);
    expect(scanSql).toContain("(expected_interval_minutes + 5) || ' minutes'");
  });

  it('opens tail gaps only when no open tail gap exists', async () => {
    await runQualityEngine(TEST_ENV);
    const tailSql = String(mockExecQuery.mock.calls[5][1]);
    expect(tailSql).toContain('NOT EXISTS');
    expect(tailSql).toContain("w.last_reading_at < NOW() - ((w.expected_interval_minutes * 2)");
  });

  it('propagates query failures', async () => {
    mockExecQuery.mockRejectedValueOnce(new Error('db down'));
    await expect(runQualityEngine(TEST_ENV)).rejects.toThrow('db down');
    expect(mockExecQuery).toHaveBeenCalledTimes(1);
  });
});
