/**
 * Generic CRUD SQL helpers for Hono worker routes.
 * Replaces BaseModel findAll/findById/create/update/delete with raw SQL.
 */

import { query, transaction, Env } from './db';

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
    selectFields = `${table}.*`,
  } = opts;

  // Build orderBy: explicit orderBy > sortBy param > primary key fallback
  let orderBy = opts.orderBy;
  if (!orderBy) {
    if (sortBy) {
      const col = camelToSnake(sortBy);
      const dir = (sortOrder || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      orderBy = `${table}.${col} ${dir}`;
    } else {
      orderBy = `${table}.${primaryKey} DESC`;
    }
  }

  const params: any[] = [];
  let paramIdx = 1;
  let whereClauses: string[] = [];

  // Add tenant filter if tenantId is provided
  if (tenantId !== undefined) {
    whereClauses.push(`${table}.tenant_id = $${paramIdx}`);
    params.push(tenantId);
    paramIdx++;
  }

  // Search filter
  if (search && searchFields.length > 0) {
    const searchClauses = searchFields.map((f) => {
      const clause = `LOWER(${table}.${f}) LIKE LOWER($${paramIdx})`;
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
      whereClauses.push(`${table}.${key} IS NULL`);
    } else {
      whereClauses.push(`${table}.${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count query
  const countSql = `SELECT COUNT(*) as total FROM ${table} ${joins} ${whereSQL}`;
  console.log('[findAll] COUNT SQL:', countSql);
  console.log('[findAll] COUNT params:', params);
  const countResult = await query(env, countSql, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query
  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const dataSql = `SELECT ${selectFields} FROM ${table} ${joins} ${whereSQL} ORDER BY ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
  console.log('[findAll] DATA SQL:', dataSql);
  console.log('[findAll] DATA params:', dataParams);
  const dataResult = await query(
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

export async function findById(env: Env, table: string, primaryKey: string, id: any, tenantId?: number) {
  let sql = `SELECT * FROM ${table} WHERE ${primaryKey} = $1`;
  const params: any[] = [id];

  if (tenantId !== undefined) {
    sql += ' AND tenant_id = $2';
    params.push(tenantId);
  }

  const result = await query(env, sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function create(env: Env, table: string, data: Record<string, any>) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  const values = keys.map((k) => data[k]);
  const placeholders = keys.map((_, i) => `$${i + 1}`);

  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  const result = await query(env, sql, values);
  return result.rows[0];
}

export async function update(env: Env, table: string, primaryKey: string, id: any, data: Record<string, any>) {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined && k !== primaryKey);
  if (keys.length === 0) return null;

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
  const values = keys.map((k) => data[k]);
  values.push(id);

  const sql = `UPDATE ${table} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE ${primaryKey} = $${keys.length + 1} RETURNING *`;
  const result = await query(env, sql, values);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function remove(env: Env, table: string, primaryKey: string, id: any) {
  const sql = `DELETE FROM ${table} WHERE ${primaryKey} = $1 RETURNING *`;
  const result = await query(env, sql, [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
}
