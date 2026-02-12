/**
 * Generic CRUD SQL helpers for Hono worker routes.
 * Replaces BaseModel findAll/findById/create/update/delete with raw SQL.
 */

import { query, transaction, Env } from './db';

export interface FindAllOptions {
  table: string;
  primaryKey: string;
  tenantId: number;
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
  where?: Record<string, any>;
  orderBy?: string;
  joins?: string;
  selectFields?: string;
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
    tenantId,
    page = 1,
    limit = 25,
    search,
    searchFields = ['name'],
    where = {},
    orderBy = `${table}.created_at DESC`,
    joins = '',
    selectFields = `${table}.*`,
  } = opts;

  const params: any[] = [tenantId];
  let paramIdx = 2;
  let whereClauses = [`${table}.tenant_id = $1`];

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
  const countResult = await query(env, `SELECT COUNT(*) as total FROM ${table} ${joins} ${whereSQL}`, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query
  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const dataResult = await query(
    env,
    `SELECT ${selectFields} FROM ${table} ${joins} ${whereSQL} ORDER BY ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
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
