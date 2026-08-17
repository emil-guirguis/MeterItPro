/**
 * Lightweight cron schedule matcher for Cloudflare Workers.
 * Supports standard 5-field expressions: minute hour dom month dow
 * Fields support: * | exact | N-M range | N,M list | *\/N or N-M/N step
 * All comparisons use UTC, consistent with Cloudflare scheduled event times.
 */

function matchesCronField(field: string, value: number): boolean {
  if (field === '*') return true;

  for (const part of field.split(',')) {
    if (part.includes('/')) {
      const [range, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) continue;

      let start = 0, end = 59;
      if (range !== '*') {
        if (range.includes('-')) {
          [start, end] = range.split('-').map(Number);
        } else {
          start = parseInt(range, 10);
          end = start;
        }
      }
      for (let v = start; v <= end; v += step) {
        if (v === value) return true;
      }
    } else if (part.includes('-')) {
      const [s, e] = part.split('-').map(Number);
      if (value >= s && value <= e) return true;
    } else {
      if (parseInt(part, 10) === value) return true;
    }
  }
  return false;
}

/**
 * Returns true if `now` matches the given 5-field cron expression.
 */
export function matchesCronSchedule(schedule: string, now: Date): boolean {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length < 5) return false;
  const [minuteField, hourField, domField, monthField, dowField] = parts;

  return (
    matchesCronField(minuteField, now.getUTCMinutes()) &&
    matchesCronField(hourField,   now.getUTCHours()) &&
    matchesCronField(domField,    now.getUTCDate()) &&
    matchesCronField(monthField,  now.getUTCMonth() + 1) &&  // 1–12
    matchesCronField(dowField,    now.getUTCDay())            // 0–6, Sunday = 0
  );
}
