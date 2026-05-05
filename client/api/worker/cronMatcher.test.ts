import { describe, it, expect } from 'vitest';
import { matchesCronSchedule } from './cronMatcher';

// All dates use UTC to match the implementation.
function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

describe('matchesCronSchedule', () => {
  describe('field count validation', () => {
    it('returns false when fewer than 5 fields', () => {
      expect(matchesCronSchedule('* * * *', utc(2024, 1, 15, 10, 30))).toBe(false);
      expect(matchesCronSchedule('30 10 *', utc(2024, 1, 15, 10, 30))).toBe(false);
      expect(matchesCronSchedule('', utc(2024, 1, 15))).toBe(false);
    });

    it('accepts exactly 5 fields', () => {
      expect(matchesCronSchedule('* * * * *', utc(2024, 1, 15))).toBe(true);
    });

    it('ignores extra fields beyond 5', () => {
      expect(matchesCronSchedule('0 0 * * * extra', utc(2024, 1, 15, 0, 0))).toBe(true);
    });
  });

  describe('wildcard (*)', () => {
    it('matches any value', () => {
      const now = utc(2024, 6, 15, 14, 37);
      expect(matchesCronSchedule('* * * * *', now)).toBe(true);
    });
  });

  describe('exact values', () => {
    // Jan 15 2024, Mon, 10:30 UTC — UTC month=1, dow=1
    const now = utc(2024, 1, 15, 10, 30);

    it('matches on exact minute', () => {
      expect(matchesCronSchedule('30 * * * *', now)).toBe(true);
      expect(matchesCronSchedule('31 * * * *', now)).toBe(false);
    });

    it('matches on exact hour', () => {
      expect(matchesCronSchedule('* 10 * * *', now)).toBe(true);
      expect(matchesCronSchedule('* 11 * * *', now)).toBe(false);
    });

    it('matches on exact DOM', () => {
      expect(matchesCronSchedule('* * 15 * *', now)).toBe(true);
      expect(matchesCronSchedule('* * 16 * *', now)).toBe(false);
    });

    it('matches on exact month (1-12)', () => {
      expect(matchesCronSchedule('* * * 1 *', now)).toBe(true);
      expect(matchesCronSchedule('* * * 2 *', now)).toBe(false);
    });

    it('matches on exact DOW (0=Sunday)', () => {
      // Jan 15 2024 is Monday (1)
      expect(matchesCronSchedule('* * * * 1', now)).toBe(true);
      expect(matchesCronSchedule('* * * * 0', now)).toBe(false);
      expect(matchesCronSchedule('* * * * 2', now)).toBe(false);
    });

    it('matches all fields together', () => {
      expect(matchesCronSchedule('30 10 15 1 1', now)).toBe(true);
      expect(matchesCronSchedule('30 10 15 1 2', now)).toBe(false);
    });
  });

  describe('ranges (N-M)', () => {
    const now = utc(2024, 1, 15, 10, 30); // minute=30, hour=10

    it('matches value within range', () => {
      expect(matchesCronSchedule('25-35 * * * *', now)).toBe(true);
      expect(matchesCronSchedule('8-12 * * * *', now)).toBe(false); // 30 not in 8-12
    });

    it('matches at range boundaries', () => {
      expect(matchesCronSchedule('30-30 * * * *', now)).toBe(true);
      expect(matchesCronSchedule('* 10-10 * * *', now)).toBe(true);
      expect(matchesCronSchedule('* 11-11 * * *', now)).toBe(false);
    });

    it('returns false when value outside range', () => {
      expect(matchesCronSchedule('0-29 * * * *', now)).toBe(false);
      expect(matchesCronSchedule('31-59 * * * *', now)).toBe(false);
    });
  });

  describe('lists (N,M,...)', () => {
    const now = utc(2024, 1, 15, 10, 30);

    it('matches when value is in list', () => {
      expect(matchesCronSchedule('15,30,45 * * * *', now)).toBe(true);
      expect(matchesCronSchedule('0,30 * * * *', now)).toBe(true);
    });

    it('returns false when value not in list', () => {
      expect(matchesCronSchedule('15,20,45 * * * *', now)).toBe(false);
    });

    it('works with mixed list items', () => {
      // minute=30: list with range 28-32 and exact 0
      expect(matchesCronSchedule('0,28-32 * * * *', now)).toBe(true);
    });
  });

  describe('steps (*/N and N-M/N)', () => {
    it('*/15 matches 0, 15, 30, 45', () => {
      expect(matchesCronSchedule('*/15 * * * *', utc(2024, 1, 1, 0, 0))).toBe(true);
      expect(matchesCronSchedule('*/15 * * * *', utc(2024, 1, 1, 0, 15))).toBe(true);
      expect(matchesCronSchedule('*/15 * * * *', utc(2024, 1, 1, 0, 30))).toBe(true);
      expect(matchesCronSchedule('*/15 * * * *', utc(2024, 1, 1, 0, 45))).toBe(true);
      expect(matchesCronSchedule('*/15 * * * *', utc(2024, 1, 1, 0, 1))).toBe(false);
      expect(matchesCronSchedule('*/15 * * * *', utc(2024, 1, 1, 0, 31))).toBe(false);
    });

    it('*/6 on hours matches 0, 6, 12, 18', () => {
      expect(matchesCronSchedule('* */6 * * *', utc(2024, 1, 1, 0, 0))).toBe(true);
      expect(matchesCronSchedule('* */6 * * *', utc(2024, 1, 1, 6, 0))).toBe(true);
      expect(matchesCronSchedule('* */6 * * *', utc(2024, 1, 1, 12, 0))).toBe(true);
      expect(matchesCronSchedule('* */6 * * *', utc(2024, 1, 1, 18, 0))).toBe(true);
      expect(matchesCronSchedule('* */6 * * *', utc(2024, 1, 1, 7, 0))).toBe(false);
    });

    it('10-50/10 matches 10, 20, 30, 40, 50', () => {
      expect(matchesCronSchedule('10-50/10 * * * *', utc(2024, 1, 1, 0, 10))).toBe(true);
      expect(matchesCronSchedule('10-50/10 * * * *', utc(2024, 1, 1, 0, 30))).toBe(true);
      expect(matchesCronSchedule('10-50/10 * * * *', utc(2024, 1, 1, 0, 50))).toBe(true);
      expect(matchesCronSchedule('10-50/10 * * * *', utc(2024, 1, 1, 0, 35))).toBe(false);
      expect(matchesCronSchedule('10-50/10 * * * *', utc(2024, 1, 1, 0, 5))).toBe(false);
    });

    it('skips invalid step (step=0)', () => {
      // step=0 is invalid, should not match anything
      const now = utc(2024, 1, 1, 0, 0);
      expect(matchesCronSchedule('*/0 * * * *', now)).toBe(false);
    });
  });

  describe('common real-world expressions', () => {
    it('0 0 * * * (midnight daily)', () => {
      expect(matchesCronSchedule('0 0 * * *', utc(2024, 3, 10, 0, 0))).toBe(true);
      expect(matchesCronSchedule('0 0 * * *', utc(2024, 3, 10, 0, 1))).toBe(false);
      expect(matchesCronSchedule('0 0 * * *', utc(2024, 3, 10, 1, 0))).toBe(false);
    });

    it('0 9 * * 1-5 (9am weekdays)', () => {
      // Wednesday
      expect(matchesCronSchedule('0 9 * * 1-5', utc(2024, 1, 17, 9, 0))).toBe(true);
      // Saturday
      expect(matchesCronSchedule('0 9 * * 1-5', utc(2024, 1, 20, 9, 0))).toBe(false);
      // Sunday
      expect(matchesCronSchedule('0 9 * * 1-5', utc(2024, 1, 21, 9, 0))).toBe(false);
    });

    it('0 0 1 * * (first of each month)', () => {
      expect(matchesCronSchedule('0 0 1 * *', utc(2024, 3, 1, 0, 0))).toBe(true);
      expect(matchesCronSchedule('0 0 1 * *', utc(2024, 3, 2, 0, 0))).toBe(false);
    });

    it('*/30 * * * * (every 30 minutes)', () => {
      expect(matchesCronSchedule('*/30 * * * *', utc(2024, 1, 1, 5, 0))).toBe(true);
      expect(matchesCronSchedule('*/30 * * * *', utc(2024, 1, 1, 5, 30))).toBe(true);
      expect(matchesCronSchedule('*/30 * * * *', utc(2024, 1, 1, 5, 15))).toBe(false);
    });
  });
});
