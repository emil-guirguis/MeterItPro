/**
 * Database module for Cloudflare Worker
 * Provides pg Pool wrapper compatible with the existing API patterns.
 */

import { Pool, PoolClient } from 'pg';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;
  FRONTEND_URL?: string;
}

let pool: Pool | null = null;

export function getPool(env: Env): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export async function query(env: Env, text: string, params: any[] = []) {
  const p = getPool(env);
  const client = await p.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function transaction<T>(env: Env, callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = getPool(env);
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
