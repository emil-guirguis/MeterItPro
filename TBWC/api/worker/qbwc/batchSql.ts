/**
 * Multi-row VALUES builder for batched upserts. execQuery opens a fresh
 * connection per call, so per-record inserts turn a 500-row iterator page into
 * 1000 connect/query/close cycles — enough to blow the Web Connector's response
 * timeout. Batching a page into a handful of multi-row statements keeps
 * receiveResponseXML well inside the budget.
 */

/**
 * Placeholder list for `rowCount` rows of `colCasts.length` columns:
 * "($1,$2::jsonb,...,CURRENT_TIMESTAMP),($n+1,...)". Each entry in `colCasts`
 * is '' or a cast suffix like '::jsonb'; `tail` is appended verbatim inside
 * every row's parens (for trailing literals like CURRENT_TIMESTAMP columns).
 */
export function multiRowValues(rowCount: number, colCasts: string[], tail = ''): string {
  const width = colCasts.length;
  const rows: string[] = [];
  for (let r = 0; r < rowCount; r++) {
    const ph = colCasts.map((cast, c) => `$${r * width + c + 1}${cast}`);
    rows.push(`(${ph.join(',')}${tail})`);
  }
  return rows.join(',');
}

/** Split `arr` into chunks of at most `size`. */
export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Rows per batched INSERT — bounds both param count and statement payload. */
export const BATCH_SIZE = 100;
