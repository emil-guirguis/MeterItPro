/**
 * Database module for Cloudflare Worker
 * Uses Hyperdrive for connection pooling to Supabase.
 * Note: Hyperdrive handles connection pooling, so we use Client (not Pool)
 * to avoid double-pooling and connection exhaustion.
 */

import { Client } from 'pg';

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;
  FRONTEND_URL?: string;
  HYPERDRIVE: { connectionString: string };
}

export async function query(env: Env, text: string, params: any[] = []) {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await client.connect();
  try {
    return await client.query(text, params);
  } finally {
    await client.end();
  }
}

export async function transaction<T>(env: Env, callback: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await client.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
