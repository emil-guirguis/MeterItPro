/**
 * Unit tests for the meterStatuses calculation logic used in LocalDashboard.
 *
 * The dashboard computes per-meter status (connected / last reading / count)
 * from two flat arrays: `meters` and `readings`.  The logic was previously an
 * O(n×m) filter+sort on every render; it was refactored to a Map-based O(n+m)
 * pass wrapped in useMemo.  These tests verify correctness of that algorithm
 * independently of React rendering.
 */

import { describe, it, expect } from 'vitest';
import type { Meter, MeterReading } from '../types';

// ---------------------------------------------------------------------------
// The algorithm extracted from LocalDashboard (useMemo body)
// ---------------------------------------------------------------------------

function computeMeterStatuses(
  meters: Meter[],
  readings: MeterReading[],
  nowMs: number = Date.now(),
) {
  const readingsByMeter = new Map<number, MeterReading[]>();
  for (const r of readings) {
    if (!readingsByMeter.has(r.meter_id)) readingsByMeter.set(r.meter_id, []);
    readingsByMeter.get(r.meter_id)!.push(r);
  }

  return meters.map((meter) => {
    const meterReadings = readingsByMeter.get(meter.meter_id) ?? [];
    const lastReading = meterReadings.reduce<MeterReading | undefined>(
      (best, r) =>
        !best || new Date(r.timestamp).getTime() > new Date(best.timestamp).getTime()
          ? r
          : best,
      undefined,
    );
    const isConnected = lastReading
      ? nowMs - new Date(lastReading.timestamp).getTime() < 5 * 60 * 1000
      : false;
    return { meter, isConnected, lastReading, readingCount: meterReadings.length };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMeter = (id: number): Meter => ({
  meter_id: id,
  name: `Meter ${id}`,
  device_id: null,
  ip: null,
  port: null,
  active: true,
  element: '',
});

const makeReading = (
  id: number,
  meterId: number,
  timestamp: string,
  synced = false,
): MeterReading => ({
  id,
  meter_id: meterId,
  timestamp,
  data_point: 'kwh',
  value: id * 10,
  unit: 'kWh',
  is_synchronized: synced,
});

// Fixed "now" so connection-window assertions are deterministic
const NOW = new Date('2026-04-08T12:00:00.000Z').getTime();
const RECENT = new Date('2026-04-08T11:58:00.000Z').toISOString(); // 2 min ago  → connected
const STALE  = new Date('2026-04-08T11:54:00.000Z').toISOString(); // 6 min ago  → disconnected

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeMeterStatuses', () => {
  describe('empty inputs', () => {
    it('returns empty array when there are no meters', () => {
      expect(computeMeterStatuses([], [], NOW)).toEqual([]);
    });

    it('marks meters as disconnected when there are no readings', () => {
      const result = computeMeterStatuses([makeMeter(1)], [], NOW);
      expect(result[0].isConnected).toBe(false);
      expect(result[0].lastReading).toBeUndefined();
      expect(result[0].readingCount).toBe(0);
    });
  });

  describe('connection status', () => {
    it('marks meter as connected when last reading is within 5 minutes', () => {
      const result = computeMeterStatuses(
        [makeMeter(1)],
        [makeReading(1, 1, RECENT)],
        NOW,
      );
      expect(result[0].isConnected).toBe(true);
    });

    it('marks meter as disconnected when last reading is older than 5 minutes', () => {
      const result = computeMeterStatuses(
        [makeMeter(1)],
        [makeReading(1, 1, STALE)],
        NOW,
      );
      expect(result[0].isConnected).toBe(false);
    });

    it('uses the most recent reading for the connection check, not the first', () => {
      const readings = [
        makeReading(1, 1, STALE),   // older — would give disconnected
        makeReading(2, 1, RECENT),  // newer — should win
      ];
      const result = computeMeterStatuses([makeMeter(1)], readings, NOW);
      expect(result[0].isConnected).toBe(true);
      expect(result[0].lastReading?.id).toBe(2);
    });
  });

  describe('reading counts', () => {
    it('counts only readings belonging to the given meter', () => {
      const readings = [
        makeReading(1, 1, RECENT),
        makeReading(2, 1, STALE),
        makeReading(3, 2, RECENT), // different meter
      ];
      const result = computeMeterStatuses([makeMeter(1), makeMeter(2)], readings, NOW);
      expect(result[0].readingCount).toBe(2); // meter 1
      expect(result[1].readingCount).toBe(1); // meter 2
    });

    it('returns readingCount of 0 for meters with no readings', () => {
      const result = computeMeterStatuses(
        [makeMeter(1), makeMeter(2)],
        [makeReading(1, 1, RECENT)],
        NOW,
      );
      expect(result[1].readingCount).toBe(0);
    });
  });

  describe('multiple meters', () => {
    it('processes each meter independently', () => {
      const meters = [makeMeter(1), makeMeter(2), makeMeter(3)];
      const readings = [
        makeReading(1, 1, RECENT),
        makeReading(2, 2, STALE),
        // meter 3 has no readings
      ];
      const result = computeMeterStatuses(meters, readings, NOW);

      expect(result[0].isConnected).toBe(true);
      expect(result[1].isConnected).toBe(false);
      expect(result[2].isConnected).toBe(false);
      expect(result[2].readingCount).toBe(0);
    });
  });

  describe('preserves meter reference', () => {
    it('includes the original meter object in each result entry', () => {
      const meter = makeMeter(99);
      const result = computeMeterStatuses([meter], [], NOW);
      expect(result[0].meter).toBe(meter);
    });
  });
});
