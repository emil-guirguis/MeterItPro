/**
 * SQLite Pool Adapter
 *
 * Wraps better-sqlite3 in a pg-compatible interface (query/connect/end/on)
 * so existing syncPool call sites and execQuery() work unchanged.
 *
 * Translations applied per query:
 *  - $1..$n placeholders            -> ? (handles repeats / out-of-order)
 *  - col = ANY($1::uuid[])          -> col IN (?, ?, ...) with the array expanded
 *  - NOW() - INTERVAL 'N units'     -> datetime('now', '-N units')
 *  - NOW()                          -> datetime('now')  (bare SELECT NOW() aliased AS now)
 *  - boolean params                 -> 0/1, Date params -> UTC 'YYYY-MM-DD HH:MM:SS.mmm'
 *  - boolean columns on read        -> true/false (active, success, is_synchronized)
 *  - timestamp columns on read      -> ISO 8601 UTC strings (*_at, now, timestamp, ...)
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

/** Minimal pg-compatible result shape */
export interface SqliteQueryResult {
  rows: any[];
  rowCount: number | null;
}

/** Boolean columns per project convention (every table uses `active`, never `enabled`) */
const BOOLEAN_COLUMNS = new Set(['active', 'success', 'is_synchronized', 'last_success']);

/** Timestamp column detection: *_at suffix or known aliases */
const TIMESTAMP_COLUMN_RE = /(_at|^timestamp|^now|^last_activity|^last_sync_time)$/;

/** SQLite datetime text: 'YYYY-MM-DD HH:MM:SS' with optional fractional seconds */
const SQLITE_DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;

/** Format a Date as UTC 'YYYY-MM-DD HH:MM:SS.mmm' (sortable, matches datetime('now')) */
export function toSqliteTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

/** Convert a stored SQLite datetime back to an ISO 8601 UTC string */
function fromSqliteTimestamp(value: string): string {
  return value.replace(' ', 'T') + 'Z';
}

function convertParam(value: any): any {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return toSqliteTimestamp(value);
  return value;
}

function convertRow(row: any): any {
  for (const key of Object.keys(row)) {
    const value = row[key];
    if (BOOLEAN_COLUMNS.has(key)) {
      if (value !== null && value !== undefined) row[key] = !!value;
    } else if (
      typeof value === 'string' &&
      TIMESTAMP_COLUMN_RE.test(key) &&
      SQLITE_DATETIME_RE.test(value)
    ) {
      row[key] = fromSqliteTimestamp(value);
    }
  }
  return row;
}

/**
 * Translate a Postgres-flavored SQL string + params into SQLite SQL + flat params.
 */
export function translateQuery(text: string, params: any[] = []): { sql: string; args: any[] } {
  let sql = text;

  // Bare health-check query: keep the `now` column name callers expect
  if (/^\s*SELECT\s+NOW\(\)\s*;?\s*$/i.test(sql)) {
    sql = `SELECT strftime('%Y-%m-%d %H:%M:%f', 'now') AS now`;
  }

  // NOW() - INTERVAL 'N units'  ->  datetime('now', '-N units')
  sql = sql.replace(
    /NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*(hours?|minutes?|days?|seconds?)'/gi,
    (_m, n, unit) => `datetime('now', '-${n} ${unit}')`
  );

  // Remaining NOW() -> datetime('now')
  sql = sql.replace(/\bNOW\(\)/gi, `datetime('now')`);

  // col = ANY($n) / col = ANY($n::type[])  ->  marker for IN-expansion
  sql = sql.replace(/=\s*ANY\(\s*\$(\d+)(?:::[a-z_]+\[\])?\s*\)/gi, (_m, idx) => `@@ANY${idx}@@`);

  // Strip simple casts on placeholders: $1::int -> $1
  sql = sql.replace(/\$(\d+)::[a-z_]+/gi, (_m, idx) => `$${idx}`);

  // Walk placeholders, building positional args (handles repeats and ANY expansion)
  const args: any[] = [];
  sql = sql.replace(/@@ANY(\d+)@@|\$(\d+)/g, (_m, anyIdx, plainIdx) => {
    if (anyIdx !== undefined) {
      const arr = params[parseInt(anyIdx, 10) - 1];
      if (!Array.isArray(arr)) {
        throw new Error(`Parameter $${anyIdx} for ANY() must be an array`);
      }
      if (arr.length === 0) {
        // IN () is invalid SQL; match nothing instead
        return `IN (NULL)`;
      }
      for (const v of arr) args.push(convertParam(v));
      return `IN (${arr.map(() => '?').join(', ')})`;
    }
    args.push(convertParam(params[parseInt(plainIdx, 10) - 1]));
    return '?';
  });

  return { sql, args };
}

/** pg PoolClient-compatible shim (same underlying connection) */
export interface SqlitePoolClient {
  query(text: string, params?: any[]): Promise<SqliteQueryResult>;
  release(): void;
}

export class SqlitePool {
  private db: Database.Database;

  constructor(filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('busy_timeout = 5000');
  }

  /** Direct access for advanced use (backups, pragmas) */
  get raw(): Database.Database {
    return this.db;
  }

  async query(text: string, params?: any[]): Promise<SqliteQueryResult> {
    return this.execute(text, params);
  }

  /**
   * pg Pool.connect() shim. SQLite has a single connection, so the "client"
   * is the same database handle; BEGIN/COMMIT/ROLLBACK pass through.
   */
  async connect(): Promise<SqlitePoolClient> {
    return {
      query: (text: string, params?: any[]) => this.execute(text, params),
      release: () => { /* no-op: single shared connection */ },
    };
  }

  /** pg Pool event API shim (no idle clients to error) */
  on(_event: string, _listener: (...args: any[]) => void): this {
    return this;
  }

  async end(): Promise<void> {
    this.db.close();
  }

  private async execute(text: string, params?: any[]): Promise<SqliteQueryResult> {
    const trimmed = text.trim();

    // Transaction control + multi-statement DDL go through exec (no params)
    if (/^(BEGIN|COMMIT|ROLLBACK)\b/i.test(trimmed)) {
      this.db.exec(trimmed);
      return { rows: [], rowCount: null };
    }

    const { sql, args } = translateQuery(text, params || []);
    const stmt = this.db.prepare(sql);

    if (stmt.reader) {
      const rows = stmt.all(...args).map(convertRow);
      return { rows, rowCount: rows.length };
    }

    const info = stmt.run(...args);
    return { rows: [], rowCount: info.changes };
  }
}

/**
 * Create the sync database schema (idempotent).
 * Fresh SQLite port of the sync Postgres schema — 6 tables + indexes.
 * meter_reading column set is the union of the installer dump and the
 * legacy data-sync DDL (register field_name values map to these columns).
 */
export function ensureSyncSchema(pool: SqlitePool): void {
  const uuidDefault =
    `(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || ` +
    `substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || ` +
    `substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))))`;
  const nowDefault = `(strftime('%Y-%m-%d %H:%M:%f', 'now'))`;

  pool.raw.exec(`
    CREATE TABLE IF NOT EXISTS tenant (
      tenant_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT,
      street TEXT,
      street2 TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      country TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      meter_reading_batch_count INTEGER DEFAULT 100,
      api_key TEXT NOT NULL DEFAULT '',
      download_batch_size INTEGER NOT NULL DEFAULT 1000,
      upload_batch_size INTEGER NOT NULL DEFAULT 100,
      created_at TEXT DEFAULT ${nowDefault},
      updated_at TEXT DEFAULT ${nowDefault}
    );

    CREATE TABLE IF NOT EXISTS meter (
      meter_id INTEGER NOT NULL DEFAULT 0,
      device_id INTEGER NOT NULL DEFAULT 0,
      register_id INTEGER,
      location_id INTEGER,
      name TEXT,
      ip TEXT,
      port INTEGER,
      active INTEGER DEFAULT 1,
      last_reading_at TEXT,
      element TEXT,
      meter_element_id INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (meter_id, meter_element_id)
    );

    CREATE TABLE IF NOT EXISTS register (
      register_id INTEGER PRIMARY KEY,
      name TEXT,
      register INTEGER,
      unit TEXT,
      field_name TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS device_register (
      device_id INTEGER NOT NULL,
      register_id INTEGER NOT NULL,
      PRIMARY KEY (device_id, register_id)
    );

    CREATE TABLE IF NOT EXISTS meter_reading (
      meter_reading_id TEXT PRIMARY KEY DEFAULT ${uuidDefault},
      created_at TEXT NOT NULL DEFAULT ${nowDefault},
      sync_status TEXT,
      tenant_id INTEGER NOT NULL DEFAULT 0,
      meter_id INTEGER NOT NULL DEFAULT 0,
      meter_element_id INTEGER,
      kwh REAL DEFAULT 0,
      mwh REAL DEFAULT 0,
      kvah REAL DEFAULT 0,
      kvah_export REAL DEFAULT 0,
      kva REAL DEFAULT 0,
      phase_kva_a REAL DEFAULT 0,
      phase_kva_b REAL DEFAULT 0,
      phase_kva_c REAL DEFAULT 0,
      amperage REAL DEFAULT 0,
      phase_amperage_a REAL DEFAULT 0,
      phase_amperage_b REAL DEFAULT 0,
      phase_amperage_c REAL DEFAULT 0,
      frequency REAL DEFAULT 0,
      peak_kw REAL DEFAULT 0,
      kw REAL DEFAULT 0,
      power_factor REAL DEFAULT 0,
      pf REAL DEFAULT 0,
      pf_a REAL DEFAULT 0,
      pf_b REAL DEFAULT 0,
      pf_c REAL DEFAULT 0,
      phase_kw_a REAL DEFAULT 0,
      phase_kw_b REAL DEFAULT 0,
      phase_kw_c REAL DEFAULT 0,
      kvarh REAL DEFAULT 0,
      kvarh_export REAL DEFAULT 0,
      reactive_energy_export REAL DEFAULT 0,
      kvar REAL DEFAULT 0,
      phase_kvar_a REAL DEFAULT 0,
      phase_kvar_b REAL DEFAULT 0,
      phase_kvar_c REAL DEFAULT 0,
      voltage_a_b REAL DEFAULT 0,
      voltage_a_n REAL DEFAULT 0,
      voltage_b_c REAL DEFAULT 0,
      voltage_b_n REAL DEFAULT 0,
      voltage_c_a REAL DEFAULT 0,
      voltage_c_n REAL DEFAULT 0,
      voltage_p_n REAL DEFAULT 0,
      voltage_p_p REAL DEFAULT 0,
      total_thdv REAL DEFAULT 0,
      phase_thdv_a REAL DEFAULT 0,
      phase_thdv_b REAL DEFAULT 0,
      phase_thdv_c REAL DEFAULT 0,
      is_synchronized INTEGER DEFAULT 0,
      retry_count INTEGER DEFAULT 0,
      calculated_kwh REAL DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      sync_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT,
      batch_size INTEGER,
      success INTEGER,
      error_message TEXT,
      details TEXT DEFAULT NULL,
      synced_at TEXT DEFAULT ${nowDefault}
    );

    CREATE INDEX IF NOT EXISTS idx_meter_reading_created_at ON meter_reading (created_at);
    CREATE INDEX IF NOT EXISTS idx_meter_reading_is_synchronized ON meter_reading (is_synchronized);
    CREATE INDEX IF NOT EXISTS idx_meter_reading_meter_id ON meter_reading (meter_id);
    CREATE INDEX IF NOT EXISTS idx_meters_is_active ON meter (active);
    CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log (synced_at);
  `);
}

/**
 * Resolve the sync SQLite file path from the environment.
 * Both MeterItProSync/api and MeterItProSync/mcp MUST point at the same file — set SQLITE_SYNC_PATH
 * in the root .env. Falls back to <cwd>/data/sync.db with a loud warning.
 */
export function resolveSyncDbPath(): string {
  const envPath = process.env.SQLITE_SYNC_PATH;
  if (envPath && envPath.trim()) return envPath.trim();
  const fallback = `${process.cwd()}/data/sync.db`;
  console.warn(
    `⚠️  [SQLite] SQLITE_SYNC_PATH not set — falling back to ${fallback}. ` +
    `Set SQLITE_SYNC_PATH in the root .env so MeterItProSync/api and MeterItProSync/mcp share one database file.`
  );
  return fallback;
}
