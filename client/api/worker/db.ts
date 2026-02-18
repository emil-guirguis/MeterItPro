/**
 * Database module for Cloudflare Worker
 * Uses Hyperdrive for connection pooling to Supabase.
 * Note: Hyperdrive handles connection pooling, so we use Client (not Pool)
 * to avoid double-pooling and connection exhaustion.
 */

import { Client } from 'pg';

export interface Env {
  DATABASE_URL?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;
  FRONTEND_URL?: string;
  HYPERDRIVE: any;
}

export async function query(env: Env, text: string, params: any[] = []) {
  // For local development, use DATABASE_URL if available; otherwise use HYPERDRIVE
  const config = env.DATABASE_URL ? { connectionString: env.DATABASE_URL } : env.HYPERDRIVE;
  const client = new Client(config);
  await client.connect();
  try {
    return await client.query(text, params);
  } catch (error: any) {
    // Include SQL information in error for debugging
    error.sql = text;
    error.sqlParams = params;
    throw error;
  } finally {
    await client.end();
  }
}

export async function transaction<T>(env: Env, callback: (client: Client) => Promise<T>): Promise<T> {
  // For local development, use DATABASE_URL if available; otherwise use HYPERDRIVE
  const config = env.DATABASE_URL ? { connectionString: env.DATABASE_URL } : env.HYPERDRIVE;
  const client = new Client(config);
  await client.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error: any) {
    await client.query('ROLLBACK');
    // Re-throw error with transaction context
    throw error;
  } finally {
    await client.end();
  }
}
