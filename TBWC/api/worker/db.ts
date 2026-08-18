/**
 * Database module for the TBWC Cloudflare Worker.
 * Connects to the tbwc-site Supabase Postgres via Hyperdrive (connection pooling).
 * Uses pg Client (Hyperdrive already pools) — mirrors MeterItPro's worker db.
 */
import { Client } from 'pg';
import { formatSqlForDebug } from '@meterit/framework-backend/shared/helpers/worker-logger';
export { formatSqlForDebug };

export interface Env {
  DATABASE_URL?: string;
  HYPERDRIVE: any;
  FRONTEND_URL?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export async function query(env: Env, text: string, params: any[] = []) {
  // Prefer an explicit DATABASE_URL (local dev / direct connection, needs SSL to
  // the Supabase pooler); otherwise use the Hyperdrive-provided string (prod,
  // which manages its own TLS).
  const directUrl = env.DATABASE_URL;
  const connectionString = directUrl || env.HYPERDRIVE?.connectionString;
  // The Supabase pooler accepts non-SSL connections; using ssl:false avoids
  // workerd's incomplete Postgres-TLS support in local dev. Hyperdrive (prod)
  // manages its own TLS.
  const client = new Client(
    directUrl ? { connectionString, ssl: false } : { connectionString }
  );
  await client.connect();
  try {
    return await client.query(text, params);
  } catch (error: any) {
    error.sql = text;
    error.sqlParams = params;
    throw error;
  } finally {
    await client.end();
  }
}

export async function execQuery(
  env: Env,
  sql: string,
  params?: any[],
  logMessage?: string
): Promise<{ rows: any[]; rowCount: number | null }> {
  const label = logMessage ? `[execQuery] ${logMessage}` : '[execQuery]';
  console.log(`${label} Executing:\n${formatSqlForDebug(sql, params || [])}`);
  const start = Date.now();
  try {
    const result = await query(env, sql, params);
    console.log(`${label} Rows: ${result.rows?.length ?? result.rowCount ?? 0} | Time: ${Date.now() - start}ms`);
    return result;
  } catch (error) {
    console.error(`${label} Failed: ${error}`);
    throw error;
  }
}
