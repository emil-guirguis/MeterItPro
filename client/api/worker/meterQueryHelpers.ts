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
  // weekly / monthly � group by local date
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

// --- Virtual meter SQL builders -----------------------------------------------
// Params: $1=tenantId, $2=virtualMeterId, $3=tzOffset, $4=startDate, $5=endDate

function virtualConsumptionSql(period: TimePeriod): string {
  const tz  = `($3::int * INTERVAL '1 minute')`;
  const op  = `CASE WHEN mv.operation = '-' THEN -mr.calculated_kwh ELSE mr.calculated_kwh END`;
  const base = `FROM meter_reading mr
    JOIN meter_virtual mv
      ON mv.selected_meter_id = mr.meter_id
      AND mv.select_meter_element_id = mr.meter_element_id
    WHERE mr.tenant_id = $1
      AND mv.meter_id = $2`;

  if (period === 'today') {
    return `
      SELECT EXTRACT(HOUR FROM (mr.created_at + ${tz}))::int AS label_key,
             SUM(${op}) AS calculated_kwh
      ${base}
        AND mr.created_at >= $4::timestamptz
        AND mr.created_at <= $5::timestamptz
      GROUP BY 1 ORDER BY 1`;
  }
  if (period === 'yearly') {
    return `
      SELECT EXTRACT(MONTH FROM (mr.created_at + ${tz}))::int AS label_key,
             SUM(${op}) AS calculated_kwh
      ${base}
        AND (mr.created_at + ${tz}) >= $4::timestamptz
        AND (mr.created_at + ${tz}) <= $5::timestamptz
      GROUP BY 1 ORDER BY 1`;
  }
  return `
    SELECT (mr.created_at + ${tz})::date::text AS label_key,
           SUM(${op}) AS calculated_kwh
    ${base}
      AND (mr.created_at + ${tz}) >= $4::timestamptz
      AND (mr.created_at + ${tz}) <= $5::timestamptz
    GROUP BY 1 ORDER BY 1`;
}

function virtualDemandSql(period: TimePeriod): string {
  const tz  = `($3::int * INTERVAL '1 minute')`;
  const op  = `CASE WHEN mv.operation = '-' THEN -mr.kw ELSE mr.kw END`;
  const base = `FROM meter_reading mr
    JOIN meter_virtual mv
      ON mv.selected_meter_id = mr.meter_id
      AND mv.select_meter_element_id = mr.meter_element_id
    WHERE mr.tenant_id = $1
      AND mv.meter_id = $2`;

  if (period === 'today') {
    return `
      SELECT EXTRACT(HOUR FROM (mr.created_at + ${tz}))::int AS label_key,
             SUM(${op}) AS power
      ${base}
        AND mr.created_at >= $4::timestamptz
        AND mr.created_at <= $5::timestamptz
      GROUP BY 1 ORDER BY 1`;
  }
  if (period === 'yearly') {
    return `
      SELECT EXTRACT(MONTH FROM (mr.created_at + ${tz}))::int AS label_key,
             SUM(${op}) AS power
      ${base}
        AND (mr.created_at + ${tz}) >= $4::timestamptz
        AND (mr.created_at + ${tz}) <= $5::timestamptz
      GROUP BY 1 ORDER BY 1`;
  }
  return `
    SELECT (mr.created_at + ${tz})::date::text AS label_key,
           SUM(${op}) AS power
    ${base}
      AND (mr.created_at + ${tz}) >= $4::timestamptz
      AND (mr.created_at + ${tz}) <= $5::timestamptz
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

export interface VirtualGraphQueryParams {
  tenantId: number;
  meterId: number;
  timePeriod: TimePeriod;
  startDate: string;
  endDate: string;
  tzOffset?: number;
}

export async function queryVirtualConsumption(env: Env, p: VirtualGraphQueryParams): Promise<ConsumptionPoint[]> {
  const { tenantId, meterId, timePeriod, startDate, endDate, tzOffset = 0 } = p;
  const result = await execQuery(env, virtualConsumptionSql(timePeriod), [tenantId, meterId, tzOffset, startDate, endDate]);
  return result.rows;
}

export async function queryVirtualDemand(env: Env, p: VirtualGraphQueryParams): Promise<DemandPoint[]> {
  const { tenantId, meterId, timePeriod, startDate, endDate, tzOffset = 0 } = p;
  const result = await execQuery(env, virtualDemandSql(timePeriod), [tenantId, meterId, tzOffset, startDate, endDate]);
  return result.rows;
}
