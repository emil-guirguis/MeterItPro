import { describe, it, expect } from 'vitest';
import { checkReadingQuality } from './qualityChecks';

const NOW = new Date('2026-07-17T12:00:00Z');

describe('checkReadingQuality', () => {
  it('returns valid with no flags for a normal reading', () => {
    const result = checkReadingQuality({
      kwh: 1523.4, kw: 42.7, power_factor: 0.95,
      voltage_a_n: 277.1, frequency: 60.01,
      created_at: '2026-07-17T11:45:00Z',
    }, NOW);
    expect(result.quality).toBe('valid');
    expect(result.flags).toEqual([]);
  });

  it('ignores null and undefined fields', () => {
    const result = checkReadingQuality({ kwh: null, kw: undefined }, NOW);
    expect(result.quality).toBe('valid');
    expect(result.flags).toEqual([]);
  });

  describe('range checks', () => {
    it('flags negative power', () => {
      const result = checkReadingQuality({ kw: -5 }, NOW);
      expect(result.quality).toBe('suspect');
      expect(result.flags).toContain('range:kw');
    });

    it('flags absurdly large power', () => {
      const result = checkReadingQuality({ kw: 200_000 }, NOW);
      expect(result.quality).toBe('suspect');
      expect(result.flags).toContain('range:kw');
    });

    it('flags negative energy', () => {
      const result = checkReadingQuality({ kwh: -1 }, NOW);
      expect(result.flags).toContain('range:kwh');
    });

    it('flags each bad field independently', () => {
      const result = checkReadingQuality({ kw: -1, kvar: -2, kwh: -3 }, NOW);
      expect(result.flags).toEqual(
        expect.arrayContaining(['range:kw', 'range:kvar', 'range:kwh'])
      );
    });
  });

  describe('power factor', () => {
    it('accepts pf in [-1, 1]', () => {
      expect(checkReadingQuality({ power_factor: -0.8 }, NOW).quality).toBe('valid');
      expect(checkReadingQuality({ power_factor: 1 }, NOW).quality).toBe('valid');
    });

    it('flags pf outside [-1, 1]', () => {
      const result = checkReadingQuality({ pf_a: 1.5 }, NOW);
      expect(result.quality).toBe('suspect');
      expect(result.flags).toContain('pf_range:pf_a');
    });
  });

  describe('voltage', () => {
    it('flags negative voltage', () => {
      const result = checkReadingQuality({ voltage_a_b: -480 }, NOW);
      expect(result.flags).toContain('voltage_range:voltage_a_b');
    });

    it('accepts typical voltages', () => {
      expect(checkReadingQuality({ voltage_a_b: 480, voltage_a_n: 277 }, NOW).quality).toBe('valid');
    });
  });

  describe('frequency', () => {
    it('flags out-of-band frequency', () => {
      const result = checkReadingQuality({ frequency: 12 }, NOW);
      expect(result.flags).toContain('frequency_range');
    });

    it('treats 0 frequency as not-reported, not out-of-band', () => {
      expect(checkReadingQuality({ frequency: 0 }, NOW).flags).toEqual([]);
    });
  });

  describe('timestamps', () => {
    it('flags future timestamps beyond tolerance', () => {
      const result = checkReadingQuality({ created_at: '2026-07-17T13:00:00Z' }, NOW);
      expect(result.quality).toBe('suspect');
      expect(result.flags).toContain('future_timestamp');
    });

    it('allows small clock skew', () => {
      const result = checkReadingQuality({ created_at: '2026-07-17T12:03:00Z' }, NOW);
      expect(result.flags).toEqual([]);
    });

    it('ignores unparseable timestamps', () => {
      expect(checkReadingQuality({ created_at: 'garbage' }, NOW).flags).toEqual([]);
    });
  });

  describe('zero readings', () => {
    it('flags all-zero energy but keeps quality valid', () => {
      const result = checkReadingQuality({ kwh: 0, kw: 0 }, NOW);
      expect(result.quality).toBe('valid');
      expect(result.flags).toEqual(['zero_reading']);
    });

    it('does not flag zero kwh with nonzero kw', () => {
      expect(checkReadingQuality({ kwh: 0, kw: 5 }, NOW).flags).toEqual([]);
    });
  });

  it('handles string numerics from JSON payloads', () => {
    const result = checkReadingQuality({ kw: '-3.5' }, NOW);
    expect(result.quality).toBe('suspect');
    expect(result.flags).toContain('range:kw');
  });
});
