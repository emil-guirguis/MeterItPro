import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./db', () => ({
  execQuery: vi.fn(),
}));

import { execQuery } from './db';
import {
  getDateRange,
  queryConsumption,
  queryDemand,
  queryVirtualConsumption,
  queryVirtualDemand,
} from './meterQueryHelpers';
import type { Env } from './db';

const mockExecQuery = vi.mocked(execQuery);

const TEST_ENV: Env = {
  JWT_SECRET: 'test',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
} as any;

const BASE_PARAMS = {
  tenantId: 1,
  meterId: 10,
  meterElementId: 100,
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T23:59:59Z',
};

describe('getDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Saturday June 15 2024, 14:30 local (any tz, we use local Date)
    vi.setSystemTime(new Date(2024, 5, 15, 14, 30, 0)); // June 15, 2024
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('custom with start and end returns those dates', () => {
    const { startDate, endDate } = getDateRange('custom', '2024-01-01', '2024-12-31');
    expect(startDate).toEqual(new Date('2024-01-01'));
    expect(endDate).toEqual(new Date('2024-12-31'));
  });

  it('custom without dates falls through to monthly default', () => {
    const { startDate } = getDateRange('custom');
    expect(startDate.getDate()).toBe(1);
    expect(startDate.getMonth()).toBe(5); // June
  });

  it('today spans the full local day', () => {
    const { startDate, endDate } = getDateRange('today');
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(startDate.getSeconds()).toBe(0);
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
    expect(endDate.getSeconds()).toBe(59);
    expect(startDate.getFullYear()).toBe(2024);
    expect(startDate.getMonth()).toBe(5); // June
    expect(startDate.getDate()).toBe(15);
  });

  it('weekly starts on Monday of the current week', () => {
    // June 15 2024 is Saturday (getDay()=6), so Monday is June 10
    const { startDate, endDate } = getDateRange('weekly');
    expect(startDate.getDay()).toBe(1); // Monday
    expect(startDate.getDate()).toBe(10); // June 10
    expect(startDate.getHours()).toBe(0);
    // End is Sunday = June 16
    expect(endDate.getDate()).toBe(16);
    expect(endDate.getHours()).toBe(23);
  });

  it('weekly when today is Sunday (starts on previous Monday)', () => {
    vi.setSystemTime(new Date(2024, 5, 16, 10, 0, 0)); // Sunday June 16
    const { startDate } = getDateRange('weekly');
    // Sunday: daysToMonday = 6, so Monday = June 16 - 6 = June 10
    expect(startDate.getDate()).toBe(10);
    expect(startDate.getDay()).toBe(1);
  });

  it('yearly spans Jan 1 to Dec 31 of current year', () => {
    const { startDate, endDate } = getDateRange('yearly');
    expect(startDate.getMonth()).toBe(0); // January
    expect(startDate.getDate()).toBe(1);
    expect(startDate.getFullYear()).toBe(2024);
    expect(endDate.getMonth()).toBe(11); // December
    expect(endDate.getDate()).toBe(31);
    expect(endDate.getFullYear()).toBe(2024);
  });

  it('monthly spans first to last day of current month', () => {
    const { startDate, endDate } = getDateRange('monthly');
    expect(startDate.getDate()).toBe(1);
    expect(startDate.getMonth()).toBe(5); // June
    // Last day of June is 30
    expect(endDate.getMonth()).toBe(5);
    expect(endDate.getHours()).toBe(23);
  });

  it('unknown timeframe defaults to monthly', () => {
    const { startDate } = getDateRange('unknown');
    expect(startDate.getDate()).toBe(1);
    expect(startDate.getMonth()).toBe(5); // June
  });
});

describe('queryConsumption', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls execQuery and returns rows', async () => {
    const rows = [
      { label_key: 0, calculated_kwh: 10.5 },
      { label_key: 1, calculated_kwh: 8.2 },
    ];
    mockExecQuery.mockResolvedValueOnce({ rows } as any);

    const result = await queryConsumption(TEST_ENV, { ...BASE_PARAMS, timePeriod: 'today' });
    expect(result).toEqual(rows);
    expect(mockExecQuery).toHaveBeenCalledOnce();
  });

  it('passes tzOffset=0 when not provided', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await queryConsumption(TEST_ENV, { ...BASE_PARAMS, timePeriod: 'today' });
    const [, , params] = mockExecQuery.mock.calls[0];
    expect(params![3]).toBe(0); // $4=tzOffset
  });

  it('passes custom tzOffset', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await queryConsumption(TEST_ENV, { ...BASE_PARAMS, timePeriod: 'today', tzOffset: 300 });
    const [, , params] = mockExecQuery.mock.calls[0];
    expect(params![3]).toBe(300);
  });

  it('uses hourly grouping for today period', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await queryConsumption(TEST_ENV, { ...BASE_PARAMS, timePeriod: 'today' });
    const [, sql] = mockExecQuery.mock.calls[0];
    expect(sql).toContain('EXTRACT(HOUR');
  });

  it('uses monthly grouping for yearly period', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await queryConsumption(TEST_ENV, { ...BASE_PARAMS, timePeriod: 'yearly' });
    const [, sql] = mockExecQuery.mock.calls[0];
    expect(sql).toContain('EXTRACT(MONTH');
  });

  it('uses date grouping for weekly and monthly periods', async () => {
    for (const period of ['weekly', 'monthly'] as const) {
      mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
      await queryConsumption(TEST_ENV, { ...BASE_PARAMS, timePeriod: period });
      const [, sql] = mockExecQuery.mock.calls[mockExecQuery.mock.calls.length - 1];
      expect(sql).toContain('::date::text');
    }
  });
});

describe('queryDemand', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls execQuery and returns rows', async () => {
    const rows = [{ label_key: 0, power: 5.5 }];
    mockExecQuery.mockResolvedValueOnce({ rows } as any);
    const result = await queryDemand(TEST_ENV, { ...BASE_PARAMS, timePeriod: 'today' });
    expect(result).toEqual(rows);
  });

  it('selects kw as power field', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await queryDemand(TEST_ENV, { ...BASE_PARAMS, timePeriod: 'today' });
    const [, sql] = mockExecQuery.mock.calls[0];
    expect(sql).toContain('SUM(kw)');
    expect(sql).toContain('AS power');
  });
});

describe('queryVirtualConsumption', () => {
  beforeEach(() => vi.resetAllMocks());

  const VIRTUAL_PARAMS = {
    tenantId: 1,
    meterId: 99,
    timePeriod: 'monthly' as const,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  it('calls execQuery and returns rows', async () => {
    const rows = [{ label_key: '2024-01-01', calculated_kwh: 20 }];
    mockExecQuery.mockResolvedValueOnce({ rows } as any);
    const result = await queryVirtualConsumption(TEST_ENV, VIRTUAL_PARAMS);
    expect(result).toEqual(rows);
  });

  it('joins meter_virtual table', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await queryVirtualConsumption(TEST_ENV, VIRTUAL_PARAMS);
    const [, sql] = mockExecQuery.mock.calls[0];
    expect(sql).toContain('meter_virtual');
  });

  it('applies operation sign for subtraction', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await queryVirtualConsumption(TEST_ENV, VIRTUAL_PARAMS);
    const [, sql] = mockExecQuery.mock.calls[0];
    expect(sql).toContain("mv.operation = '-'");
  });

  it('uses $1=tenantId and $2=virtualMeterId', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await queryVirtualConsumption(TEST_ENV, VIRTUAL_PARAMS);
    const [, , params] = mockExecQuery.mock.calls[0];
    expect(params![0]).toBe(1);  // $1 tenantId
    expect(params![1]).toBe(99); // $2 meterId
  });
});

describe('queryVirtualDemand', () => {
  beforeEach(() => vi.resetAllMocks());

  it('selects kw as power for virtual meters', async () => {
    mockExecQuery.mockResolvedValueOnce({ rows: [] } as any);
    await queryVirtualDemand(TEST_ENV, {
      tenantId: 1, meterId: 99, timePeriod: 'today', startDate: '2024-01-01', endDate: '2024-01-31',
    });
    const [, sql] = mockExecQuery.mock.calls[0];
    expect(sql).toContain('mr.kw');
    expect(sql).toContain('AS power');
  });
});
