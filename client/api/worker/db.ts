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
  MCP_URL?: string;
}

export async function query(env: Env, text: string, params: any[] = []) {
  const connectionString = env.DATABASE_URL || env.HYPERDRIVE?.connectionString;
  const client = new Client({ connectionString });
  await client.connect();
  console.log('[SQL]', text, params.length ? params : '');
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
  const connectionString = env.DATABASE_URL || env.HYPERDRIVE?.connectionString;
  const client = new Client({ connectionString });
  await client.connect();
  const loggingClient = new Proxy(client, {
    get(target, prop) {
      if (prop === 'query') {
        return (text: string, params?: any[]) => {
          console.log('[SQL]', text, params?.length ? params : '');
          return target.query(text, params as any);
        };
      }
      return (target as any)[prop];
    },
  });
  try {
    await client.query('BEGIN');
    const result = await callback(loggingClient as Client);
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
