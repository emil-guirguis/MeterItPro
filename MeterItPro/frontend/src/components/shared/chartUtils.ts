export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatHour(hour: number): string {
  if (hour === 0) return '12AM';
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
}

export function getChartDateRange(timePeriod: string, offset: number = 0): { startDate: Date; endDate: Date } {
  const now = new Date();

  if (timePeriod === 'today') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return {
      startDate: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
      endDate:   new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
    };
  }

  if (timePeriod === 'weekly') {
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToMonday + offset * 7);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  if (timePeriod === 'monthly') {
    const targetMonth = now.getMonth() + offset;
    const startDate = new Date(now.getFullYear(), targetMonth, 1, 0, 0, 0, 0);
    const endDate = offset === 0
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      : new Date(now.getFullYear(), targetMonth + 1, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  // yearly
  const targetYear = now.getFullYear() + offset;
  const startDate = new Date(targetYear, 0, 1, 0, 0, 0, 0);
  const endDate = offset === 0
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    : new Date(targetYear, 11, 31, 23, 59, 59, 999);
  return { startDate, endDate };
}

export function buildConsumptionChartData(
  rows: { label_key: string | number; calculated_kwh: number }[],
  timePeriod: string,
  offset: number = 0,
): { label: string; calculated_kwh: number }[] {
  const lookup = new Map<string, number>();
  for (const row of rows) {
    lookup.set(String(row.label_key), Math.round(Number(row.calculated_kwh) * 10000) / 10000);
  }
  return buildLabels(timePeriod, offset).map(({ label, key }) => ({
    label,
    calculated_kwh: lookup.get(key) ?? 0,
  }));
}

export function buildDemandChartData(
  rows: { label_key: string | number; power: number }[],
  timePeriod: string,
  offset: number = 0,
): { label: string; power: number }[] {
  const lookup = new Map<string, number>();
  for (const row of rows) {
    lookup.set(String(row.label_key), Math.round(Number(row.power) * 10000) / 10000);
  }
  return buildLabels(timePeriod, offset).map(({ label, key }) => ({
    label,
    power: lookup.get(key) ?? 0,
  }));
}

function buildLabels(timePeriod: string, offset: number): { label: string; key: string }[] {
  if (timePeriod === 'today') {
    return Array.from({ length: 24 }, (_, h) => ({ label: formatHour(h), key: String(h) }));
  }
  if (timePeriod === 'yearly') {
    return Array.from({ length: 12 }, (_, i) => ({ label: MONTH_NAMES[i], key: String(i + 1) }));
  }
  // weekly / monthly — fill every day in range
  const { startDate, endDate } = getChartDateRange(timePeriod, offset);
  const result: { label: string; key: string }[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    result.push({
      key: [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, '0'),
        String(cursor.getDate()).padStart(2, '0'),
      ].join('-'),
      label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
