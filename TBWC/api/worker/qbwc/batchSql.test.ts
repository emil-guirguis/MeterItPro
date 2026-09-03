import { describe, it, expect } from 'vitest';
import { multiRowValues, chunk } from './batchSql';

describe('multiRowValues', () => {
  it('numbers placeholders across rows with casts and tail', () => {
    expect(multiRowValues(2, ['', '::jsonb'], ', CURRENT_TIMESTAMP')).toBe(
      '($1,$2::jsonb, CURRENT_TIMESTAMP),($3,$4::jsonb, CURRENT_TIMESTAMP)'
    );
  });

  it('handles a single row without tail', () => {
    expect(multiRowValues(1, ['', ''])).toBe('($1,$2)');
  });

  it('supports literal tails for fixed columns', () => {
    expect(multiRowValues(2, ['', ''], `, 'Customer', CURRENT_TIMESTAMP`)).toBe(
      `($1,$2, 'Customer', CURRENT_TIMESTAMP),($3,$4, 'Customer', CURRENT_TIMESTAMP)`
    );
  });
});

describe('chunk', () => {
  it('splits into fixed-size chunks with remainder', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('returns empty for empty input', () => {
    expect(chunk([], 100)).toEqual([]);
  });
});
