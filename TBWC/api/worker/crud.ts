/**
 * Generic CRUD SQL helpers for Hono worker routes.
 * Replaces BaseModel findAll/findById/create/update/delete with raw SQL.
 *
 * Identifier inputs (table, column names, where keys, searchFields, sortBy)
 * are validated against SAFE_IDENT to prevent SQL injection. Free-form SQL
 * fragments (joins, selectFields, explicit orderBy) remain caller-trusted â€”
 * never derive these from request input.
 */

import { Env, execQuery } from './db';

const SAFE_IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function assertIdent(name: string, kind: string): void {
  if (typeof name !== 'string' || !SAFE_IDENT.test(name)) {
    throw new Error(`Invalid ${kind}: ${name}`);
  }
}

// Columns never writable via update()
const UPDATE_DENYLIST = new Set(['tenant_id', 'created_at', 'updated_at']);

export interface FindAllOptions {
  table: string;
  primaryKey: string;
  tenantId?: number;
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
  where?: Record<string, any>;
  orderBy?: string;
  sortBy?: string;
  sortOrder?: string;
  joins?: string;
  selectFields?: string;
}

/** Convert camelCase to snake_case for DB column names */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export interface FindAllResult {
  rows: any[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export async function findAll(env: Env, opts: FindAllOptions): Promise<FindAllResult> {
  const {
    table,
    primaryKey,
    tenantId,
    page = 1,
    limit = 25,
    search,
    searchFields = ['name'],
    where = {},
    sortBy,
    sortOrder,
    joins = '',
    selectFields = `"${opts.table}".*`,
  } = opts;

  assertIdent(table, 'table');
  assertIdent(primaryKey, 'primaryKey');
  for (const f of searchFields) assertIdent(f, 'searchField');
  for (const k of Object.keys(where)) assertIdent(k, 'whereKey');

  // Build orderBy: explicit orderBy > sortBy param > primary key fallback
  let orderBy = opts.orderBy;
  if (!orderBy) {
    if (sortBy) {
      const col = camelToSnake(sortBy);
      assertIdent(col, 'sortBy');
      const dir = (sortOrder || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      orderBy = `"${table}".${col} ${dir}`;
    } else {
      orderBy = `"${table}".${primaryKey} DESC`;
    }
  }

  const params: any[] = [];
  let paramIdx = 1;
  let whereClauses: string[] = [];

  // Add tenant filter if tenantId is provided
  if (tenantId !== undefined) {
    whereClauses.push(`"${table}".tenant_id = $${paramIdx}`);
    params.push(tenantId);
    paramIdx++;
  }

  // Search filter
  if (search && searchFields.length > 0) {
    const searchClauses = searchFields.map((f) => {
      const clause = `LOWER("${table}".${f}) LIKE LOWER($${paramIdx})`;
      return clause;
    });
    // All search fields share the same param
    whereClauses.push(`(${searchClauses.join(' OR ')})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  // Additional where conditions
  for (const [key, value] of Object.entries(where)) {
    if (value === null) {
      whereClauses.push(`"${table}".${key} IS NULL`);
    } else {
      whereClauses.push(`"${table}".${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count query
  const countSql = `SELECT COUNT(*) as total FROM "${table}" ${joins} ${whereSQL}`;
  const countResult = await execQuery(env, countSql, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query
  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const dataSql = `SELECT ${selectFields} FROM "${table}" ${joins} ${whereSQL} ORDER BY ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
  const dataResult = await execQuery(
    env,
    dataSql,
    dataParams
  );

  return {
    rows: dataResult.rows,
    pagination: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findById(env: Env, table: string, primaryKey: string, id: any, tenantId?: number, selectFields?: string) {
  assertIdent(table, 'table');
  assertIdent(primaryKey, 'primaryKey');
  const cols = selectFields || `"${table}".*`;
  let sql = `SELECT ${cols} FROM "${table}" WHERE ${primaryKey} = $1`;
  const params: any[] = [id];

  if (tenantId !== undefined) {
    sql += ' AND tenant_id = $2';
    params.push(tenantId);
  }

  const result = await execQuery(env, sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function create(env: Env, table: string, data: Record<string, any>) {
  assertIdent(table, 'table');
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  for (const k of keys) assertIdent(k, 'column');
  const values = keys.map((k) => data[k]);
  const placeholders = keys.map((_, i) => `$${i + 1}`);

  const sql = `INSERT INTO "${table}" (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  const result = await execQuery(env, sql, values);
  return result.rows[0];
}

export async function update(env: Env, table: string, primaryKey: string, id: any, data: Record<string, any>) {
  assertIdent(table, 'table');
  assertIdent(primaryKey, 'primaryKey');
  const keys = Object.keys(data).filter(
    (k) => data[k] !== undefined && k !== primaryKey && !UPDATE_DENYLIST.has(k)
  );
  if (keys.length === 0) return null;
  for (const k of keys) assertIdent(k, 'column');

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
  const values = keys.map((k) => data[k]);
  values.push(id);

  // Note: no `updated_at = NOW()` â€” the tbwc users/order tables have no such column.
  const sql = `UPDATE "${table}" SET ${setClauses.join(', ')} WHERE ${primaryKey} = $${keys.length + 1} RETURNING *`;
  const result = await execQuery(env, sql, values);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export interface DeleteRestriction {
  table: string;      // child table holding the FK
  fk: string;         // FK column in the child table
  label?: string;     // human name for the children (defaults to table)
  message?: string;   // full override for the error message
}

export interface DeleteRestrictionViolation {
  table: string;
  count: number;
  message: string;
}

/**
 * Check a schema's deleteRestrictions before deleting a row.
 * Returns null when deletable, or a violation with a user-facing message.
 * The matching DB FK should be ON DELETE RESTRICT as the backstop.
 */
export async function checkDeleteRestrictions(
  env: Env,
  schema: { deleteRestrictions?: DeleteRestriction[] },
  id: any
): Promise<DeleteRestrictionViolation | null> {
  const rules = schema.deleteRestrictions || [];
  for (const rule of rules) {
    assertIdent(rule.table, 'table');
    assertIdent(rule.fk, 'fk column');
    const result = await execQuery(
      env,
      `SELECT COUNT(*)::int AS count FROM ${rule.table} WHERE ${rule.fk} = $1`,
      [id]
    );
    const count = result.rows[0]?.count ?? 0;
    if (count > 0) {
      const label = rule.label || rule.table.replace(/_/g, ' ');
      return {
        table: rule.table,
        count,
        message: rule.message
          || `Cannot delete â€” ${count} ${label}${count === 1 ? '' : 's'} still reference this record. Reassign or remove them first.`,
      };
    }
  }
  return null;
}

export async function remove(env: Env, table: string, primaryKey: string, id: any, tenantId?: number) {
  assertIdent(table, 'table');
  assertIdent(primaryKey, 'primaryKey');
  let sql = `DELETE FROM "${table}" WHERE ${primaryKey} = $1`;
  const params: any[] = [id];
  if (tenantId !== undefined) {
    sql += ' AND tenant_id = $2';
    params.push(tenantId);
  }
  sql += ' RETURNING *';
  const result = await execQuery(env, sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}
