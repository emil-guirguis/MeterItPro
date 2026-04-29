/**
 * Centralized meter reading query helpers.
 * Shared by meterReadings routes and report graph data so both produce identical results.
 */

import { Env, execQuery } from './db';

export type TimePeriod = 'today' | 'weekly' | 'monthly' | 'yearly';

export interface GraphQueryParams {
  tenantId: number;
  meterId: number;
  meterElementId: number;
  timePeriod: TimePeriod;
  startDate: string;
  endDate: string;
  tzOffset?: number; // minutes from UTC, e.g. 300 for UTC+5
}

export interface ConsumptionPoint {
  label_key: number | string;
  calculated_kwh: number;
}

export interface DemandPoint {
  label_key: number | string;
  power: number;
}

/**
 * Compute start/end Date for a named time frame relative to now (server UTC).
 * Pass customStart/customEnd (ISO strings) when timeFrame === 'custom'.
 */
export function getDateRange(
  timeFrame: string,
  customStart?: string,
  customEnd?: string,
): { startDate: Date; endDate: Date } {
  const now = new Date();

  if (timeFrame === 'custom' && customStart && customEnd) {
    return { startDate: new Date(customStart), endDate: new Date(customEnd) };
  }
  if (timeFrame === 'today') {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
      endDate:   new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
    };
  }
  if (timeFrame === 'weekly') {
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - daysToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  if (timeFrame === 'yearly') {
    return {
      startDate: new Date(now.getFullYear(), 0,  1,  0, 0, 0),
      endDate:   new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    };
  }
  // monthly (default)
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(),     1,  0, 0, 0),
    endDate:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
}

// --- SQL builders -------------------------------------------------------------
// Params are always: $1=tenantId, $2=meterId, $3=meterElementId, $4=tzOffset, $5=startDate, $6=endDate

function consumptionSql(period: TimePeriod): string {
  const tz  = `($4::int * INTERVAL '1 minute')`;
  const base = `FROM meter_reading
    WHERE tenant_id = $1
      AND meter_id = $2
      AND meter_element_id = $3`;

  if (period === 'today') {
    return `
      SELECT EXTRACT(HOUR FROM (created_at + ${tz}))::int AS label_key,
             SUM(calculated_kwh) AS calculated_kwh
      ${base}
        AND created_at >= $5::timestamptz
        AND created_at <= $6::timestamptz
      GROUP BY 1 ORDER BY 1`;
  }
  if (period === 'yearly') {
    return `
      SELECT EXTRACT(MONTH FROM (created_at + ${tz}))::int AS label_key,
             SUM(calculated_kwh) AS calculated_kwh
      ${base}
        AND (created_at + ${tz}) >= $5::timestamptz
        AND (created_at + ${tz}) <= $6::timestamptz
      GROUP BY 1 ORDER BY 1`;
  }
  // weekly / monthly — group by local date
  return `
    SELECT (created_at + ${tz})::date::text AS label_key,
           SUM(calculated_kwh) AS calculated_kwh
    ${base}
      AND (created_at + ${tz}) >= $5::timestamptz
      AND (created_at + ${tz}) <= $6::timestamptz
    GROUP BY 1 ORDER BY 1`;
}

function demandSql(period: TimePeriod): string {
  const tz  = `($4::int * INTERVAL '1 minute')`;
  const base = `FROM meter_reading
    WHERE tenant_id = $1
      AND meter_id = $2
      AND meter_element_id = $3`;

  if (period === 'today') {
    return `
      SELECT EXTRACT(HOUR FROM (created_at + ${tz}))::int AS label_key,
             SUM(kw) AS power
      ${base}
        AND created_at >= $5::timestamptz
        AND created_at <= $6::timestamptz
      GROUP BY 1 ORDER BY 1`;
  }
  if (period === 'yearly') {
    return `
      SELECT EXTRACT(MONTH FROM (created_at + ${tz}))::int AS label_key,
             SUM(kw) AS power
      ${base}
        AND (created_at + ${tz}) >= $5::timestamptz
        AND (created_at + ${tz}) <= $6::timestamptz
      GROUP BY 1 ORDER BY 1`;
  }
  return `
    SELECT (created_at + ${tz})::date::text AS label_key,
           SUM(kw) AS power
    ${base}
      AND (created_at + ${tz}) >= $5::timestamptz
      AND (created_at + ${tz}) <= $6::timestamptz
    GROUP BY 1 ORDER BY 1`;
}

// --- Public query functions ---------------------------------------------------

export async function queryConsumption(env: Env, p: GraphQueryParams): Promise<ConsumptionPoint[]> {
  const { tenantId, meterId, meterElementId, timePeriod, startDate, endDate, tzOffset = 0 } = p;
  const result = await execQuery(env, consumptionSql(timePeriod), [tenantId, meterId, meterElementId, tzOffset, startDate, endDate]);
  return result.rows;
}

export async function queryDemand(env: Env, p: GraphQueryParams): Promise<DemandPoint[]> {
  const { tenantId, meterId, meterElementId, timePeriod, startDate, endDate, tzOffset = 0 } = p;
  const result = await execQuery(env, demandSql(timePeriod), [tenantId, meterId, meterElementId, tzOffset, startDate, endDate]);
  return result.rows;
}
